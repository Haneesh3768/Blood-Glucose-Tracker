import { Router } from "express";
import { authController } from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.validator.js";
import { validateBody } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { authRateLimiter, refreshRateLimiter } from "../../middlewares/rateLimiter.js";
import { verifyCsrfOrigin } from "../../middlewares/csrfMiddleware.js";

export const authRouter = Router();

// Registration
authRouter.post(
  "/register",
  authRateLimiter,
  validateBody(registerSchema),
  authController.register
);
// Signup alias
authRouter.post(
  "/signup",
  authRateLimiter,
  validateBody(registerSchema),
  authController.register
);

// Login
authRouter.post(
  "/login",
  authRateLimiter,
  validateBody(loginSchema),
  authController.login
);

// Refresh Token Rotation
authRouter.post(
  "/refresh",
  refreshRateLimiter,
  verifyCsrfOrigin,
  authController.refresh
);

// Logout Current Session
authRouter.post(
  "/logout",
  verifyCsrfOrigin,
  authController.logout
);

// Logout All Sessions (Requires active JWT access token)
authRouter.post(
  "/logout-all",
  authenticate,
  verifyCsrfOrigin,
  authController.logoutAll
);

// Current User Profile
authRouter.get("/me", authenticate, authController.me);
