import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "password",
      "passwordHash",
      "*.password",
      "*.passwordHash",
      "refreshToken",
      "*.refreshToken",
      "tokenHash",
      "*.tokenHash",
      "glucoseValue",
      "*.glucoseValue",
      "value",
      "*.value",
    ],
    censor: "[REDACTED]",
  },
});
