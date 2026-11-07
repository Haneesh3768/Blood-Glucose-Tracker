import type { NextFunction, Response } from "express";
import { readingsService, ReadingsService } from "./readings.service.js";
import type { AuthenticatedRequest } from "../../types/auth.js";
import type { ApiSuccessResponse } from "../../types/api.js";
import type { FormattedReading } from "./readings.service.js";

export class ReadingsController {
  constructor(private readonly service: ReadingsService = readingsService) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reading = await this.service.createReading(req.user!.id, req.body);
      const response: ApiSuccessResponse<{ reading: FormattedReading }> = {
        success: true,
        message: "Reading created successfully.",
        data: { reading },
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getReadings(req.user!.id, req.query as any);
      const response: ApiSuccessResponse<{ readings: FormattedReading[] }> = {
        success: true,
        data: { readings: result.readings },
        meta: result.pagination,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reading = await this.service.getReadingById(req.user!.id, req.params.id as string);
      const response: ApiSuccessResponse<{ reading: FormattedReading }> = {
        success: true,
        data: { reading },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reading = await this.service.updateReading(
        req.user!.id,
        req.params.id as string,
        req.body
      );
      const response: ApiSuccessResponse<{ reading: FormattedReading }> = {
        success: true,
        message: "Reading updated successfully.",
        data: { reading },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.deleteReading(req.user!.id, req.params.id as string);
      const response: ApiSuccessResponse<{ id: string }> = {
        success: true,
        message: "Reading deleted successfully.",
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}

export const readingsController = new ReadingsController();
