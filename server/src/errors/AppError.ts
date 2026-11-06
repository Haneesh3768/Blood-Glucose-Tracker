export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required. Please log in.") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access forbidden. You do not have permission.") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Requested resource not found.") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, details);
  }
}
