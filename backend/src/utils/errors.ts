/**
 * Error handling utilities for Neusik API
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class FileUploadError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'FILE_UPLOAD_ERROR', 400, details);
  }
}

export class ProcessingError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PROCESSING_ERROR', 500, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later', details?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, details);
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Request timeout', details?: Record<string, unknown>) {
    super(message, 'TIMEOUT_ERROR', 408, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable', details?: Record<string, unknown>) {
    super(message, 'SERVICE_UNAVAILABLE', 503, details);
  }
}

/**
 * Format error response for API
 */
export function formatErrorResponse(error: unknown): {
  error: string;
  code: string;
  details?: Record<string, unknown>;
} {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      code: 'INTERNAL_ERROR',
      details: {},
    };
  }

  return {
    error: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
    details: {},
  };
}

/**
 * Get HTTP status code from error
 */
export function getStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Log error with context
 * Uses structured logging for better error tracking
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  if (error instanceof AppError) {
    console.error(`[${error.code}] ${error.message}`, {
      statusCode: error.statusCode,
      details: error.details,
      context,
      timestamp: new Date().toISOString(),
    });
  } else if (error instanceof Error) {
    console.error('Error:', error.message, {
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.error('Unknown error:', error, { 
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

