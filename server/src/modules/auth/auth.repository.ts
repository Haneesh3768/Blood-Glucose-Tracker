import type { PrismaClient, RefreshToken, User } from "@prisma/client";
import { prisma } from "../../config/database.js";

export interface CreateRefreshTokenData {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
}

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(data: { name: string; email: string; passwordHash: string }): Promise<User>;
  createRefreshToken(data: CreateRefreshTokenData): Promise<RefreshToken>;
  findRefreshTokenByHash(tokenHash: string): Promise<(RefreshToken & { user: User }) | null>;
  revokeRefreshToken(id: string, replacedBy?: string): Promise<RefreshToken>;
  revokeFamily(familyId: string): Promise<number>;
  revokeAllUserTokens(userId: string): Promise<number>;
  rotateTokenAtomic(
    oldTokenId: string,
    newToken: CreateRefreshTokenData
  ): Promise<{ rotated: boolean; createdToken?: RefreshToken }>;
}

export class AuthRepository implements IAuthRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    return this.db.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
      },
    });
  }

  async createRefreshToken(data: CreateRefreshTokenData): Promise<RefreshToken> {
    return this.db.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        familyId: data.familyId,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<(RefreshToken & { user: User }) | null> {
    return this.db.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async revokeRefreshToken(id: string, replacedBy?: string): Promise<RefreshToken> {
    return this.db.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        replacedBy,
      },
    });
  }

  async revokeFamily(familyId: string): Promise<number> {
    const result = await this.db.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  async revokeAllUserTokens(userId: string): Promise<number> {
    const result = await this.db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  async rotateTokenAtomic(
    oldTokenId: string,
    newToken: CreateRefreshTokenData
  ): Promise<{ rotated: boolean; createdToken?: RefreshToken }> {
    return this.db.$transaction(async (tx) => {
      // Conditional update: only revoke if not already revoked
      const updateResult = await tx.refreshToken.updateMany({
        where: {
          id: oldTokenId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          replacedBy: newToken.tokenHash,
        },
      });

      if (updateResult.count === 0) {
        return { rotated: false };
      }

      const created = await tx.refreshToken.create({
        data: {
          userId: newToken.userId,
          tokenHash: newToken.tokenHash,
          familyId: newToken.familyId,
          expiresAt: newToken.expiresAt,
        },
      });

      return { rotated: true, createdToken: created };
    });
  }
}

export const authRepository = new AuthRepository();
