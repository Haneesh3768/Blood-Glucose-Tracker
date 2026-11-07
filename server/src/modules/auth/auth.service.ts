import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { ConflictError, UnauthorizedError } from "../../errors/AppError.js";
import type { IAuthRepository } from "./auth.repository.js";
import { authRepository } from "./auth.repository.js";
import type { LoginInput, RegisterInput } from "./auth.validator.js";
import type { AccessTokenPayload, AuthenticatedUser, TokenPair } from "../../types/auth.js";
import { logger } from "../../config/logger.js";

// Bounded retry helper for transient database serialization / concurrency conflicts
async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delayMs = 50
): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      // Check for PostgreSQL serialization failure (40001) or Prisma P2034
      const isSerializationConflict =
        error?.code === "P2034" ||
        error?.code === "40001" ||
        error?.message?.includes("serialization failure") ||
        error?.message?.includes("could not serialize access");

      if (isSerializationConflict && attempt < retries) {
        logger.warn(
          `Prisma serialization conflict on attempt ${attempt}. Retrying in ${delayMs * attempt}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Transaction retry limit exceeded");
}

export class AuthService {
  constructor(private readonly repository: IAuthRepository = authRepository) {}

  public hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  public generateAccessToken(user: AuthenticatedUser): string {
    const payload: AccessTokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
  }

  public async issueTokenPair(
    user: AuthenticatedUser,
    familyId?: string
  ): Promise<TokenPair> {
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
      rawRefreshToken,
    };
  }

  async register(input: RegisterInput): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> {
    const normalizedEmail = input.email.toLowerCase().trim();

    const existing = await this.repository.findUserByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictError("An account with this email address already exists.");
    }

    // Hash password with bcrypt cost 12
    const passwordHash = await bcrypt.hash(input.password, 12);

    const createdUser = await this.repository.createUser({
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const user: AuthenticatedUser = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
    };

    const tokens = await this.issueTokenPair(user);

    return { user, tokens };
  }

  async login(input: LoginInput): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> {
    const normalizedEmail = input.email.toLowerCase().trim();

    const foundUser = await this.repository.findUserByEmail(normalizedEmail);
    // Generic error to prevent account enumeration
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

    const tokens = await this.issueTokenPair(user);

    return { user, tokens };
  }

  async rotateRefreshToken(rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(rawRefreshToken);

    const storedToken = await this.repository.findRefreshTokenByHash(tokenHash);
    if (!storedToken) {
      throw new UnauthorizedError("Invalid or expired refresh token.");
    }

    // Reuse detection: If token was already revoked, revoke the entire session family!
    if (storedToken.revokedAt !== null) {
      logger.warn(
        `🚨 Security Alert: Revoked refresh token reuse detected for family ${storedToken.familyId}. Revoking family.`
      );
      await this.repository.revokeFamily(storedToken.familyId);
      throw new UnauthorizedError(
        "Invalid session state detected. Please sign in again."
      );
    }

    // Expiration check
    if (new Date() > storedToken.expiresAt) {
      await this.repository.revokeRefreshToken(storedToken.id);
      throw new UnauthorizedError("Refresh token has expired. Please sign in again.");
    }

    // Prepare rotated token
    const newRawRefreshToken = crypto.randomBytes(40).toString("hex");
    const newTokenHash = this.hashToken(newRawRefreshToken);

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_DAYS);

    const user: AuthenticatedUser = {
      id: storedToken.user.id,
      name: storedToken.user.name,
      email: storedToken.user.email,
    };

    // Execute atomic rotation inside transaction with bounded retries
    const rotationResult = await withRetry(async () => {
      return this.repository.rotateTokenAtomic(storedToken.id, {
        userId: user.id,
        tokenHash: newTokenHash,
        familyId: storedToken.familyId,
        expiresAt: newExpiresAt,
      });
    });

    // If update count was 0, token was concurrently modified / revoked
    if (!rotationResult.rotated) {
      // Re-fetch to distinguish between concurrent rotation vs true reuse
      const rechecked = await this.repository.findRefreshTokenByHash(tokenHash);
      if (rechecked && rechecked.revokedAt !== null) {
        await this.repository.revokeFamily(storedToken.familyId);
      }
      throw new UnauthorizedError("Session renewal collision or token already consumed.");
    }

    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      rawRefreshToken: newRawRefreshToken,
    };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const storedToken = await this.repository.findRefreshTokenByHash(tokenHash);
    if (storedToken && storedToken.revokedAt === null) {
      await this.repository.revokeRefreshToken(storedToken.id);
    }
  }

  async logoutAll(userId: string): Promise<number> {
    return this.repository.revokeAllUserTokens(userId);
  }

  async getCurrentUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedError("User session no longer valid.");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}

export const authService = new AuthService();
