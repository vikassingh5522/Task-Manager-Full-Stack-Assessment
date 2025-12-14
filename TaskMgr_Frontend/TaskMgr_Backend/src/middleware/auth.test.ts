import fc from 'fast-check';
import { Request, Response, NextFunction } from 'express';
import { authenticate } from './auth';
import { generateToken } from '../utils/jwt';

// Feature: taskmgr-backend, Property 51: Authentication errors return 401
describe('Authentication Middleware Property Tests', () => {
  describe('Property 51: Authentication errors return 401', () => {
    // Helper to create mock request
    const createMockRequest = (authHeader?: string): Partial<Request> => ({
      headers: authHeader ? { authorization: authHeader } : {},
    });

    // Helper to create mock response
    const createMockResponse = (): Partial<Response> => {
      const res: any = {
        statusCode: 200,
        jsonData: null,
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

    // Helper to create mock next function
    const createMockNext = (): NextFunction => jest.fn();

    it(
      'should return 401 for any request without authorization header',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.constant(null), // No auth header
            async () => {
              const req = createMockRequest() as Request;
              const res = createMockResponse() as Response;
              const next = createMockNext();

              authenticate(req, res, next);

              // Should return 401 status
              expect(res.status).toHaveBeenCalledWith(401);
              expect((res as any).statusCode).toBe(401);

              // Should return error response
              expect(res.json).toHaveBeenCalled();
              const jsonData = (res as any).jsonData;
              expect(jsonData.success).toBe(false);
              expect(jsonData.status).toBe(401);
              expect(jsonData.message).toBeDefined();

              // Should not call next
              expect(next).not.toHaveBeenCalled();
            }
          ),
          { numRuns: 100 }
        );
      },
      30000
    );

    it(
      'should return 401 for any request with invalid token format',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.oneof(
              // Invalid formats
              fc.string({ minLength: 1, maxLength: 50 }), // No "Bearer" prefix
              fc.string({ minLength: 1, maxLength: 50 }).map(s => `InvalidPrefix ${s}`),
              fc.constant('Bearer'), // Missing token
              fc.constant('Bearer '), // Empty token
              fc.string({ minLength: 1, maxLength: 50 }).map(s => `Bearer ${s} extra`), // Extra parts
            ),
            async (authHeader) => {
              const req = createMockRequest(authHeader) as Request;
              const res = createMockResponse() as Response;
              const next = createMockNext();

              authenticate(req, res, next);

              // Should return 401 status
              expect((res as any).statusCode).toBe(401);

              // Should return error response
              const jsonData = (res as any).jsonData;
              expect(jsonData.success).toBe(false);
              expect(jsonData.status).toBe(401);

              // Should not call next
              expect(next).not.toHaveBeenCalled();
            }
          ),
          { numRuns: 100 }
        );
      },
      30000
    );

    it(
      'should return 401 for any request with invalid JWT token',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 10, maxLength: 100 }),
            async (invalidToken) => {
              // Skip if by chance we generated a valid JWT format with correct signature
              // (extremely unlikely but theoretically possible)
              const authHeader = `Bearer ${invalidToken}`;
              
              const req = createMockRequest(authHeader) as Request;
              const res = createMockResponse() as Response;
              const next = createMockNext();

              authenticate(req, res, next);

              // Should return 401 status
              expect((res as any).statusCode).toBe(401);

              // Should return error response
              const jsonData = (res as any).jsonData;
              expect(jsonData.success).toBe(false);
              expect(jsonData.status).toBe(401);
              expect(jsonData.message).toBeDefined();

              // Should not call next
              expect(next).not.toHaveBeenCalled();
            }
          ),
          { numRuns: 100 }
        );
      },
      30000
    );

    it(
      'should attach user data to request for any valid token',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              userId: fc.uuid(),
              email: fc.emailAddress(),
              role: fc.constantFrom('USER', 'ADMIN'),
            }),
            async (userPayload) => {
              // Generate valid token
              const token = generateToken(userPayload);
              const authHeader = `Bearer ${token}`;

              const req = createMockRequest(authHeader) as Request;
              const res = createMockResponse() as Response;
              const next = createMockNext();

              authenticate(req, res, next);

              // Should attach user data to request
              expect(req.user).toBeDefined();
              expect(req.user?.userId).toBe(userPayload.userId);
              expect(req.user?.email).toBe(userPayload.email);
              expect(req.user?.role).toBe(userPayload.role);

              // Should call next (not return error)
              expect(next).toHaveBeenCalled();

              // Should not call res.status or res.json
              expect(res.status).not.toHaveBeenCalled();
              expect(res.json).not.toHaveBeenCalled();
            }
          ),
          { numRuns: 100 }
        );
      },
      30000
    );

    it(
      'should return 401 for expired tokens',
      async () => {
        // This test verifies that expired tokens are rejected
        // We'll use a token with a very short expiration
        const jwt = require('jsonwebtoken');
        const { config } = require('../config/env');

        await fc.assert(
          fc.asyncProperty(
            fc.record({
              userId: fc.uuid(),
              email: fc.emailAddress(),
              role: fc.constantFrom('USER', 'ADMIN'),
            }),
            async (userPayload) => {
              // Generate token that expires immediately
              const expiredToken = jwt.sign(userPayload, config.jwtSecret, {
                expiresIn: '0s', // Expires immediately
              });

              // Wait a tiny bit to ensure expiration
              await new Promise(resolve => setTimeout(resolve, 10));

              const authHeader = `Bearer ${expiredToken}`;
              const req = createMockRequest(authHeader) as Request;
              const res = createMockResponse() as Response;
              const next = createMockNext();

              authenticate(req, res, next);

              // Should return 401 status
              expect((res as any).statusCode).toBe(401);

              // Should return error response
              const jsonData = (res as any).jsonData;
              expect(jsonData.success).toBe(false);
              expect(jsonData.status).toBe(401);

              // Should not call next
              expect(next).not.toHaveBeenCalled();
            }
          ),
          { numRuns: 100 }
        );
      },
      30000
    );
  });
});
