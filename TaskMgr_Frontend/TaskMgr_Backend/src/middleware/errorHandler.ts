import { Request, Response, NextFunction } from 'express';
import {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError
} from './errors';

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  status: number;
  stack?: string;
}

/**
 * Global error handler middleware
 * Handles all error types with consistent response format
 * Maps errors to appropriate HTTP status codes
 * Logs errors for debugging
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error for debugging
  console.error('Error occurred:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let errorResponse: ErrorResponse = {
    success: false,
    message: 'Internal server error',
    status: 500
  };

  // Handle ValidationError (400)
  if (err instanceof ValidationError) {
    errorResponse = {
      success: false,
      message: err.message,
      code: 'VALIDATION_ERROR',
      errors: err.errors,
      status: 400
    };
  }
  // Handle AuthenticationError (401)
  else if (err instanceof AuthenticationError) {
    errorResponse = {
      success: false,
      message: err.message,
      code: 'AUTHENTICATION_ERROR',
      status: 401
    };
  }
  // Handle AuthorizationError (403)
  else if (err instanceof AuthorizationError) {
    errorResponse = {
      success: false,
      message: err.message,
      code: 'AUTHORIZATION_ERROR',
      status: 403
    };
  }
  // Handle NotFoundError (404)
  else if (err instanceof NotFoundError) {
    errorResponse = {
      success: false,
      message: err.message,
      code: 'NOT_FOUND',
      status: 404
    };
  }
  // Handle ApiError (custom status codes)
  else if (err instanceof ApiError) {
    errorResponse = {
      success: false,
      message: err.message,
      status: err.statusCode
    };
  }
  // Handle generic errors (500)
  else {
    errorResponse = {
      success: false,
      message: err.message || 'Internal server error',
      status: 500
    };
  }

  // Include stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(errorResponse.status).json(errorResponse);
};

/**
 * 404 Not Found handler for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error);
};
