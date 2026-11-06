import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    env: {
      NODE_ENV: "test",
      PORT: "5001",
      DATABASE_URL: "postgresql://test:test@localhost:5432/sweety_test?schema=public",
      JWT_ACCESS_SECRET: "test_secret_for_jwt_which_must_be_at_least_32_characters_long",
      JWT_ACCESS_EXPIRES_IN: "15m",
      REFRESH_TOKEN_EXPIRES_DAYS: "7",
    },
  },
});
