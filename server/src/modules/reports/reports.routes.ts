import { Router } from "express";
import { reportsController } from "./reports.controller.js";
import {
  getReportDateQuerySchema,
  getReportQuerySchema,
} from "./reports.validator.js";
import { validateQuery } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/authMiddleware.js";

export const reportsRouter = Router();

// All report endpoints require active session authentication
reportsRouter.use(authenticate);

// Dedicated Phase 3 Report Endpoints
reportsRouter.get("/daily", validateQuery(getReportDateQuerySchema), reportsController.getDaily);
reportsRouter.get("/month-to-date", validateQuery(getReportDateQuerySchema), reportsController.getMonthToDate);
reportsRouter.get("/monthly", validateQuery(getReportDateQuerySchema), reportsController.getMonthly);

// Backward-compatible unified summary endpoint
reportsRouter.get("/summary", validateQuery(getReportQuerySchema), reportsController.getSummary);
