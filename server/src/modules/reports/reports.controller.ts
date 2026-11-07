import type { NextFunction, Response } from "express";
import { reportsService, ReportsService } from "./reports.service.js";
import type { AuthenticatedRequest } from "../../types/auth.js";
import type { ApiSuccessResponse } from "../../types/api.js";
import type { ReportResult } from "./reports.service.js";

export class ReportsController {
  constructor(private readonly service: ReportsService = reportsService) {}

  getDaily = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.service.getDailyReport(
        req.user!.id,
        req.query.date as string | undefined
      );
      const response: ApiSuccessResponse<{ report: ReportResult }> = {
        success: true,
        data: { report },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getMonthToDate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.service.getMonthToDateReport(
        req.user!.id,
        req.query.date as string | undefined
      );
      const response: ApiSuccessResponse<{ report: ReportResult }> = {
        success: true,
        data: { report },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getMonthly = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.service.getMonthlyReport(
        req.user!.id,
        req.query.date as string | undefined
      );
      const response: ApiSuccessResponse<{ report: ReportResult }> = {
        success: true,
        data: { report },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.service.generateReport(req.user!.id, req.query as any);
      const response: ApiSuccessResponse<{ report: ReportResult }> = {
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
