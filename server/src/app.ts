import express, { type Express } from "express";
import cors, { type CorsOptions } from "cors";
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

  // Configure Helmet with permissive Cross-Origin-Resource-Policy for dev APIs
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // Robust CORS Configuration
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // In non-production, permit all localhost / 127.0.0.1 ports (5173, 5174, 3000, etc.)
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (env.NODE_ENV !== "production" && isLocalhost) {
        return callback(null, true);
      }

      if (origin === env.CLIENT_URL) {
        return callback(null, true);
      }

      // Default allow in dev/test to avoid blocking local developer setups
      if (env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      callback(new Error(`CORS blocked request from origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Authorization"],
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  // Explicitly handle all preflight OPTIONS requests
  app.options("*", cors(corsOptions));

  // Body parsing
  app.use(express.json());

  // HTTP Request Logging
  if (env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
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
