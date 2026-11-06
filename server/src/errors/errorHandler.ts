import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "./AppError.js";
import { logger } from "../config/logger.js";
import type { ApiErrorResponse } from "../types/api.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational errors (Application specific)
  if (err instanceof AppError) {
    logger.warn(`Operational error on ${req.method} ${req.originalUrl}: ${err.message}`, {
      statusCode: err.statusCode,
      details: err.details,
    });

    const response: ApiErrorResponse = {
      success: false,
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    const message = firstIssue?.message || "Validation failed";
    
    logger.warn(`Zod validation error on ${req.method} ${req.originalUrl}`, {
      issues: err.issues,
    });

    const response: ApiErrorResponse = {
      success: false,
      error: message,
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    };

    res.status(400).json(response);
    return;
  }

  // Handle Prisma unique constraint violation fallback (P2002)
  if ("code" in err && err.code === "P2002") {
    logger.warn(`Prisma unique constraint violation on ${req.method} ${req.originalUrl}`, {
      error: err.message,
    });

    const response: ApiErrorResponse = {
      success: false,
      error: "A record with this information already exists.",
    };

    res.status(409).json(response);
    return;
  }

  // Unhandled internal server errors
  logger.error(`Unhandled internal error on ${req.method} ${req.originalUrl}`, err);

  const response: ApiErrorResponse = {
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  };

  res.status(500).json(response);
}
