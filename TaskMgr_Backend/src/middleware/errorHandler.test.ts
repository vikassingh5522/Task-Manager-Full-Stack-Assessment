import { Request, Response, NextFunction } from 'express';
import fc from 'fast-check';
import { errorHandler } from './errorHandler';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ApiError
} from './errors';

describe('Error Handler Property Tests', () => {
  // Mock request, response, and next function
  const createMockRequest = (): Partial<Request> => ({
    path: '/test',
    method: 'GET'
  });

  const createMockResponse = (): Partial<Response> => {
    const res: any = {
      statusCode: 200,
      jsonData: null
    };
    res.status = jest.fn((code: number) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn((data: any) => {
      res.jsonData = data;
      return res;
    });
    return res;
  };

  const mockNext: NextFunction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Feature: taskmgr-backend, Property 49: Consistent error format
  describe('Property 49: Consistent error format', () => {
    it('should return consistent error format for any error type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            new ValidationError('Validation failed', { field: ['error'] }),
            new AuthenticationError('Auth failed'),
            new AuthorizationError('Access denied'),
            new NotFoundError('Not found'),
            new ApiError('Generic error', 500),
            new Error('Generic error')
          ),
          async (error) => {
            const req = createMockRequest() as Request;
            const res = createMockResponse() as Response;

            errorHandler(error, req, res, mockNext);

            expect(res.json).toHaveBeenCalledTimes(1);
            const response = (res as any).jsonData;

            // Verify consistent format
            expect(response).toHaveProperty('success', false);
            expect(response).toHaveProperty('message');
            expect(response).toHaveProperty('status');
            expect(typeof response.message).toBe('string');
            expect(typeof response.status).toBe('number');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: taskmgr-backend, Property 50: Validation errors return 400
  describe('Property 50: Validation errors return 400', () => {
    it('should return 400 status for any validation error with field-specific messages', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 3 })
          ),
          async (message, errors) => {
            const req = createMockRequest() as Request;
            const res = createMockResponse() as Response;
            const error = new ValidationError(message, errors);

            errorHandler(error, req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(400);
            const response = (res as any).jsonData;
            expect(response.status).toBe(400);
            expect(response.success).toBe(false);
            expect(response.message).toBe(message);
            expect(response.errors).toEqual(errors);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: taskmgr-backend, Property 52: Authorization errors return 403
  describe('Property 52: Authorization errors return 403', () => {
    it('should return 403 status for any authorization error', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (message) => {
            const req = createMockRequest() as Request;
            const res = createMockResponse() as Response;
            const error = new AuthorizationError(message);

            errorHandler(error, req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            const response = (res as any).jsonData;
            expect(response.status).toBe(403);
            expect(response.success).toBe(false);
            expect(response.message).toBe(message);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: taskmgr-backend, Property 53: Not found errors return 404
  describe('Property 53: Not found errors return 404', () => {
    it('should return 404 status for any not found error', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (message) => {
            const req = createMockRequest() as Request;
            const res = createMockResponse() as Response;
            const error = new NotFoundError(message);

            errorHandler(error, req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(404);
            const response = (res as any).jsonData;
            expect(response.status).toBe(404);
            expect(response.success).toBe(false);
            expect(response.message).toBe(message);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Additional test for Property 51: Authentication errors return 401
  // (Not in the task requirements but included for completeness)
  describe('Property 51: Authentication errors return 401', () => {
    it('should return 401 status for any authentication error', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (message) => {
            const req = createMockRequest() as Request;
            const res = createMockResponse() as Response;
            const error = new AuthenticationError(message);

            errorHandler(error, req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            const response = (res as any).jsonData;
            expect(response.status).toBe(401);
            expect(response.success).toBe(false);
            expect(response.message).toBe(message);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Test for generic errors returning 500
  describe('Generic errors return 500', () => {
    it('should return 500 status for any generic error', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (message) => {
            const req = createMockRequest() as Request;
            const res = createMockResponse() as Response;
            const error = new Error(message);

            errorHandler(error, req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(500);
            const response = (res as any).jsonData;
            expect(response.status).toBe(500);
            expect(response.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
