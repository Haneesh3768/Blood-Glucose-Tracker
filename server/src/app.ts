import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { readingsRouter } from "./modules/readings/readings.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { errorHandler } from "./errors/errorHandler.js";
import { NotFoundError } from "./errors/AppError.js";

export function createApp(): Express {
  const app = express();

  // Security headers & CORS
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Body parsing
  app.use(express.json());

  // HTTP Request Logging
  if (env.NODE_ENV !== "test") {
    app.use(morgan("combined"));
  }

  // Healthcheck Endpoint
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Modular API v1 Routes
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/readings", readingsRouter);
  app.use("/api/v1/reports", reportsRouter);

  // Catch-all 404 handler
  app.use((_req, _res, next) => {
    next(new NotFoundError("API endpoint not found."));
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}

