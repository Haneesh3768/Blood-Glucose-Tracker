import fs from "fs";
import path from "path";
import express, { type Express } from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { apiRateLimiter } from "./middlewares/rateLimiter.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { readingsRouter } from "./modules/readings/readings.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { errorHandler } from "./errors/errorHandler.js";
import { NotFoundError } from "./errors/AppError.js";

function getOpenApiSpec(): Record<string, unknown> | null {
  const candidates = [
    path.resolve(process.cwd(), "src/docs/openapi.json"),
    path.resolve(process.cwd(), "server/src/docs/openapi.json"),
    path.resolve(process.cwd(), "dist/src/docs/openapi.json"),
    path.resolve(process.cwd(), "dist/docs/openapi.json"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, "utf-8"));
      } catch {
        // continue
      }
    }
  }
  return null;
}

export function createApp(): Express {
  const app = express();

  // Helmet with cross-origin policy for modern frontends and Swagger UI support
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://cdn.jsdelivr.net",
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://cdn.jsdelivr.net",
          ],
          imgSrc: [
            "'self'",
            "data:",
            "https://validator.swagger.io",
          ],
          connectSrc: ["'self'", "*"],
        },
      },
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

  // Body Parsing with constrained payload size limit (mitigates payload flood / DoS)
  app.use(express.json({ limit: "15kb" }));

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

  // Swagger / OpenAPI Interactive Documentation
  app.get("/api/docs/openapi.json", (_req, res) => {
    const spec = getOpenApiSpec();
    if (spec) {
      res.status(200).json(spec);
    } else {
      res.status(404).json({ error: "Documentation specification not found." });
    }
  });

  app.get(["/api/docs", "/api/docs/"], (_req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.status(200).send(`<!DOCTYPE html>
<html>
  <head>
    <title>Sweety API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/api/docs/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.SwaggerUIStandalonePreset
          ],
        });
      };
    </script>
  </body>
</html>`);
  });

  // Modular API v1 Routes
  app.use("/api/v1", apiRateLimiter);
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
