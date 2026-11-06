import type { PrismaClient, RefreshToken, User } from "@prisma/client";
import { prisma } from "../../config/database.js";

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(data: { name: string; email: string; passwordHash: string }): Promise<User>;
  createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<RefreshToken>;
  findRefreshTokenByHash(tokenHash: string): Promise<(RefreshToken & { user: User }) | null>;
  revokeRefreshToken(id: string): Promise<RefreshToken>;
  revokeTokenFamily(familyId: string): Promise<{ count: number }>;
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

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return this.db.refreshToken.create({
      data,
    });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<(RefreshToken & { user: User }) | null> {
    return this.db.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async revokeRefreshToken(id: string): Promise<RefreshToken> {
    return this.db.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  async revokeTokenFamily(familyId: string): Promise<{ count: number }> {
    return this.db.refreshToken.updateMany({
      where: { familyId },
      data: { isRevoked: true },
    });
  }
}

export const authRepository = new AuthRepository();
