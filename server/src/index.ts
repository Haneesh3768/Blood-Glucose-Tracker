import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { pool, prisma } from "./config/database.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Sweety API server running on port ${env.PORT} in ${env.NODE_ENV} mode`, {
    port: env.PORT,
    environment: env.NODE_ENV,
  });
});

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    logger.info("HTTP server closed.");
    try {
      await prisma.$disconnect();
      await pool.end();
      logger.info("Database connections successfully closed.");
      process.exit(0);
    } catch (error) {
      logger.error("Error during graceful shutdown database disconnect", error as Error);
      process.exit(1);
    }
  });

  // Force shutdown after 10s timeout
  setTimeout(() => {
    logger.error("Forceful shutdown after timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
