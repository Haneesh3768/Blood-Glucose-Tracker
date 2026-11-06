import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().trim().email("Please provide a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required."),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
