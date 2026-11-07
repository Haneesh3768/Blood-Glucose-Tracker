import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().default("/api/v1"),
});

const rawApiUrl = import.meta.env.VITE_API_BASE_URL;
// Normalize to relative /api/v1 so cookies, Vite proxy, and session rehydration work seamlessly on all ports (5173, 5174, etc.)
const resolvedApiUrl =
  !rawApiUrl || rawApiUrl.includes("localhost:5000")
    ? "/api/v1"
    : rawApiUrl;

export const env = envSchema.parse({
  VITE_API_BASE_URL: resolvedApiUrl,
});
