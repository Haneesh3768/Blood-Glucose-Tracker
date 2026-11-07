import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === "test" ? 1000 : 20, // max attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many authentication attempts. Please try again in 15 minutes.",
  },
});

export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "test" ? 1000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many refresh attempts. Please try again later.",
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "test" ? 5000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please slow down.",
  },
});

