import express, { type Express } from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { readingsRouter } from "./modules/readings/readings.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { errorHandler } from "./errors/errorHandler.js";
import { NotFoundError } from "./errors/AppError.js";

export function createApp(): Express {
  const app = express();

  // Helmet with cross-origin policy for modern frontends
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // Strict & Secure CORS Configuration
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
    exposedHeaders: ["Authorization", "Set-Cookie"],
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  // Cookie Parser Middleware
  app.use(cookieParser());

  // Body Parsing
  app.use(express.json());

  // Structured Logging via Pino with PII / Credential Redaction
  if (env.NODE_ENV !== "test") {
    app.use(
      pinoHttp({
        logger,
        autoLogging: {
          ignore: (req) => req.url === "/health",
        },
      })
    );
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
