import { Router } from "express";
import { reportsController } from "./reports.controller.js";
import { getReportQuerySchema } from "./reports.validator.js";
import { validateQuery } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/authMiddleware.js";

export const reportsRouter = Router();

// All report endpoints require session authentication
reportsRouter.use(authenticate);

reportsRouter.get("/summary", validateQuery(getReportQuerySchema), reportsController.getSummary);
