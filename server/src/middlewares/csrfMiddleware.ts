import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { ForbiddenError } from "../errors/AppError.js";

export function verifyCsrfOrigin(req: Request, _res: Response, next: NextFunction): void {
  // Safe methods do not require origin check
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin || req.headers.referer;

  // In test or non-browser environments without origin headers, allow
  if (!origin) {
    return next();
  }

  try {
    const originUrl = new URL(origin);
    const clientUrl = new URL(env.CLIENT_URL);

    // In development or test, allow any localhost/127.0.0.1 origin
    if (env.NODE_ENV !== "production") {
      if (
        originUrl.hostname === "localhost" ||
        originUrl.hostname === "127.0.0.1"
      ) {
        return next();
      }
    }

    if (originUrl.origin === clientUrl.origin) {
      return next();
    }

    return next(new ForbiddenError("CSRF verification failed: Origin not recognized."));
  } catch (_e) {
    return next(new ForbiddenError("CSRF verification failed: Invalid origin format."));
  }
}

