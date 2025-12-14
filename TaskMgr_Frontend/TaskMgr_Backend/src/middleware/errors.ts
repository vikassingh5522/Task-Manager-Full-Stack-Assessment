/**
 * Custom error classes for the TaskMgr Backend API
 * Each error class includes a status code and message for consistent error handling
 */

/**
 * Base API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly to maintain instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Validation Error (400)
 * Used when request data fails validation
 */
export class ValidationError extends ApiError {
  public readonly errors?: Record<string, string[]>;

  constructor(message: string = 'Validation failed', errors?: Record<string, string[]>) {
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Authentication Error (401)
 * Used when authentication fails or token is invalid/missing
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error (403)
 * Used when user lacks permission to access a resource
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error (404)
 * Used when a requested resource doesn't exist
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Server Error (500)
 * Used for unexpected server errors
 */
export class ServerError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false);
    this.name = 'ServerError';
  }
}
