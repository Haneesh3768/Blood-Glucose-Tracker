import type { NextFunction, Request, Response } from "express";
import { authService, AuthService } from "./auth.service.js";
import type { AuthenticatedRequest } from "../../types/auth.js";
import type { ApiSuccessResponse } from "../../types/api.js";

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.signup(req.body);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.login(req.body);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tokens = await this.service.refreshTokens(req.body.refreshToken);
      const response: ApiSuccessResponse<{ tokens: typeof tokens }> = {
        success: true,
        data: { tokens },
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

