type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class StructuredLogger {
  private formatLog(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error,
    context?: string
  ): string {
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context ? { context } : {}),
      ...(metadata ? { metadata } : {}),
      ...(error
        ? {
            error: {
              name: error.name,
              message: error.message,
              stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
            },
          }
        : {}),
    };

    return JSON.stringify(payload);
  }

  info(message: string, metadata?: Record<string, unknown>, context?: string): void {
    console.log(this.formatLog("info", message, metadata, undefined, context));
  }

  warn(message: string, metadata?: Record<string, unknown>, context?: string): void {
    console.warn(this.formatLog("warn", message, metadata, undefined, context));
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>, context?: string): void {
    console.error(this.formatLog("error", message, metadata, error, context));
  }

  debug(message: string, metadata?: Record<string, unknown>, context?: string): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatLog("debug", message, metadata, undefined, context));
    }
  }
}

export const logger = new StructuredLogger();

