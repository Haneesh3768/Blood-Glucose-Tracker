import type { NextFunction, Request, Response } from "express";
import { authService, AuthService } from "./auth.service.js";
import { env } from "../../config/env.js";
import type { AuthenticatedRequest } from "../../types/auth.js";
import type { ApiSuccessResponse } from "../../types/api.js";
import { UnauthorizedError } from "../../errors/AppError.js";

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  private setRefreshCookie(res: Response, rawRefreshToken: string): void {
    res.cookie(env.REFRESH_COOKIE_NAME, rawRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(env.REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }

  private extractRefreshToken(req: Request): string | undefined {
    return req.cookies?.[env.REFRESH_COOKIE_NAME] || req.body?.refreshToken;
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.register(req.body);
      this.setRefreshCookie(res, result.tokens.rawRefreshToken);

      const response: ApiSuccessResponse<{
        user: typeof result.user;
        accessToken: string;
        tokens: {
          accessToken: string;
        };
      }> = {
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          tokens: {
            accessToken: result.tokens.accessToken,
          },
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.login(req.body);
      this.setRefreshCookie(res, result.tokens.rawRefreshToken);

      const response: ApiSuccessResponse<{
        user: typeof result.user;
        accessToken: string;
        tokens: {
          accessToken: string;
        };
      }> = {
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          tokens: {
            accessToken: result.tokens.accessToken,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawRefreshToken = this.extractRefreshToken(req);
      if (!rawRefreshToken) {
        throw new UnauthorizedError("Refresh token required.");
      }

      const tokens = await this.service.rotateRefreshToken(rawRefreshToken);
      this.setRefreshCookie(res, tokens.rawRefreshToken);

      const response: ApiSuccessResponse<{
        accessToken: string;
        user?: typeof tokens.user;
        tokens: {
          accessToken: string;
        };
      }> = {
        success: true,
        data: {
          accessToken: tokens.accessToken,
          user: tokens.user,
          tokens: {
            accessToken: tokens.accessToken,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawRefreshToken = this.extractRefreshToken(req);
      if (rawRefreshToken) {
        await this.service.logout(rawRefreshToken);
      }
      this.clearRefreshCookie(res);

      const response: ApiSuccessResponse<{ message: string }> = {
        success: true,
        data: { message: "Successfully logged out of current session." },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  logoutAll = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const count = await this.service.logoutAll(req.user!.id);
      this.clearRefreshCookie(res);

      const response: ApiSuccessResponse<{ message: string; revokedCount: number }> = {
        success: true,
        data: {
          message: "Successfully logged out of all active sessions.",
          revokedCount: count,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.getCurrentUser(req.user!.id);
      const response: ApiSuccessResponse<{ user: typeof user }> = {
        success: true,
        data: { user },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
