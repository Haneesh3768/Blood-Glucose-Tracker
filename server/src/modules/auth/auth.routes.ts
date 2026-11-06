import { Router } from "express";
import { authController } from "./auth.controller.js";
import { loginSchema, refreshTokenSchema, signupSchema } from "./auth.validator.js";
import { validateBody } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/authMiddleware.js";

export const authRouter = Router();

authRouter.post("/signup", validateBody(signupSchema), authController.signup);
authRouter.post("/login", validateBody(loginSchema), authController.login);
authRouter.post("/refresh", validateBody(refreshTokenSchema), authController.refreshToken);
authRouter.get("/me", authenticate, authController.me);
