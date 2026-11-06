import type { NextFunction, Response } from "express";
import { reportsService, ReportsService } from "./reports.service.js";
import type { AuthenticatedRequest } from "../../types/auth.js";
import type { ApiSuccessResponse } from "../../types/api.js";

export class ReportsController {
  constructor(private readonly service: ReportsService = reportsService) {}

  getSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.service.generateReport(req.user!.id, req.query as any);
      const response: ApiSuccessResponse<{ report: typeof report }> = {
        success: true,
        data: { report },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}

export const reportsController = new ReportsController();

