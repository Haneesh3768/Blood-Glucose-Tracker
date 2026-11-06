import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { BadRequestError, ConflictError, UnauthorizedError } from "../../errors/AppError.js";
import type { IAuthRepository } from "./auth.repository.js";
import { authRepository } from "./auth.repository.js";
import type { LoginInput, SignupInput } from "./auth.validator.js";
import type { AccessTokenPayload, AuthTokens, AuthenticatedUser } from "../../types/auth.js";

export class AuthService {
  constructor(private readonly repository: IAuthRepository = authRepository) {}

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private generateAccessToken(user: AuthenticatedUser): string {
    const payload: AccessTokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
  }

  private async createTokenPair(user: AuthenticatedUser, familyId?: string): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user);
    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    const tokenHash = this.hashToken(rawRefreshToken);
    const assignedFamilyId = familyId || crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_DAYS);

    await this.repository.createRefreshToken({
      userId: user.id,
      tokenHash,
      familyId: assignedFamilyId,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async signup(input: SignupInput): Promise<{ user: AuthenticatedUser; tokens: AuthTokens }> {
    const existing = await this.repository.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError("An account with this email address already exists.");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const createdUser = await this.repository.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const user: AuthenticatedUser = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
    };

    const tokens = await this.createTokenPair(user);

    return { user, tokens };
  }

  async login(input: LoginInput): Promise<{ user: AuthenticatedUser; tokens: AuthTokens }> {
    const foundUser = await this.repository.findUserByEmail(input.email);
    if (!foundUser) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const isMatch = await bcrypt.compare(input.password, foundUser.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const user: AuthenticatedUser = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
    };

    const tokens = await this.createTokenPair(user);

    return { user, tokens };
  }

  async refreshTokens(rawRefreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const storedToken = await this.repository.findRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedError("Invalid refresh token.");
    }

    // Reuse detection: If token was already revoked, revoke the entire session family!
    if (storedToken.isRevoked) {
      await this.repository.revokeTokenFamily(storedToken.familyId);
      throw new UnauthorizedError("Token compromised or previously revoked. Entire session invalidated.");
    }

    // Check expiration
    if (new Date() > storedToken.expiresAt) {
      await this.repository.revokeRefreshToken(storedToken.id);
      throw new UnauthorizedError("Refresh token has expired. Please sign in again.");
    }

    // Revoke current token before issuing the new one (Rotation)
    await this.repository.revokeRefreshToken(storedToken.id);

    const user: AuthenticatedUser = {
      id: storedToken.user.id,
      name: storedToken.user.name,
      email: storedToken.user.email,
    };

    // Rotate within the same family ID
    return this.createTokenPair(user, storedToken.familyId);
  }

  async getCurrentUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new BadRequestError("User not found.");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}

export const authService = new AuthService();
