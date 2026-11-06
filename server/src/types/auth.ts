import type { Request } from "express";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

export interface AccessTokenPayload {
  userId: string;
  email: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
