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
  iss?: string;
  aud?: string;
}

export interface TokenPair {
  accessToken: string;
  rawRefreshToken: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
