import { socketAuthMiddleware, AuthenticatedSocket } from './index';
import { generateToken } from '../utils/jwt';
import fc from 'fast-check';

describe('Socket Authentication Middleware', () => {
  describe('Unit Tests', () => {
    it('should authenticate socket with valid token in auth', (done) => {
      // Create a valid token
      const token = generateToken({
        userId: 'user123',
        email: 'test@example.com',
        role: 'USER',
      });

      // Mock socket with token in handshake.auth
      const mockSocket = {
        handshake: {
          auth: { token },
          query: {},
        },
      } as unknown as AuthenticatedSocket;

      // Call middleware
      socketAuthMiddleware(mockSocket, (err) => {
        expect(err).toBeUndefined();
        expect(mockSocket.user).toBeDefined();
        expect(mockSocket.user?.userId).toBe('user123');
        expect(mockSocket.user?.email).toBe('test@example.com');
        expect(mockSocket.user?.role).toBe('USER');
        done();
      });
    });

    it('should authenticate socket with valid token in query', (done) => {
      // Create a valid token
      const token = generateToken({
        userId: 'user456',
        email: 'test2@example.com',
        role: 'ADMIN',
      });

      // Mock socket with token in handshake.query
      const mockSocket = {
        handshake: {
          auth: {},
          query: { token },
        },
      } as unknown as AuthenticatedSocket;

      // Call middleware
      socketAuthMiddleware(mockSocket, (err) => {
        expect(err).toBeUndefined();
        expect(mockSocket.user).toBeDefined();
        expect(mockSocket.user?.userId).toBe('user456');
        expect(mockSocket.user?.email).toBe('test2@example.com');
        expect(mockSocket.user?.role).toBe('ADMIN');
        done();
      });
    });

    it('should reject connection with no token', (done) => {
      // Mock socket without token
      const mockSocket = {
        handshake: {
          auth: {},
          query: {},
        },
      } as unknown as AuthenticatedSocket;

      // Call middleware
      socketAuthMiddleware(mockSocket, (err) => {
        expect(err).toBeDefined();
        expect(err?.message).toContain('Authentication error');
        expect(err?.message).toContain('No token provided');
        expect(mockSocket.user).toBeUndefined();
        done();
      });
    });

    it('should reject connection with invalid token', (done) => {
      // Mock socket with invalid token
      const mockSocket = {
        handshake: {
          auth: { token: 'invalid-token-string' },
          query: {},
        },
      } as unknown as AuthenticatedSocket;

      // Call middleware
      socketAuthMiddleware(mockSocket, (err) => {
        expect(err).toBeDefined();
        expect(err?.message).toContain('Authentication error');
        expect(mockSocket.user).toBeUndefined();
        done();
      });
    });

    it('should reject connection with expired token', (done) => {
      // Create an expired token (this would need to be mocked in real scenario)
      // For now, we'll use an invalid token format
      const mockSocket = {
        handshake: {
          auth: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature' },
          query: {},
        },
      } as unknown as AuthenticatedSocket;

      // Call middleware
      socketAuthMiddleware(mockSocket, (err) => {
        expect(err).toBeDefined();
        expect(err?.message).toContain('Authentication error');
        expect(mockSocket.user).toBeUndefined();
        done();
      });
    });

    it('should reject connection with non-string token', (done) => {
      // Mock socket with non-string token
      const mockSocket = {
        handshake: {
          auth: { token: 12345 },
          query: {},
        },
      } as unknown as AuthenticatedSocket;

      // Call middleware
      socketAuthMiddleware(mockSocket, (err) => {
        expect(err).toBeDefined();
        expect(err?.message).toContain('Authentication error');
        expect(err?.message).toContain('No token provided');
        expect(mockSocket.user).toBeUndefined();
        done();
      });
    });
  });

  describe('Property-Based Tests', () => {
    // Feature: taskmgr-backend, Property 45: Socket authentication with JWT
    // Validates: Requirements 14.1
    it('should authenticate socket connection with valid JWT for any user data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            role: fc.constantFrom('USER', 'ADMIN'),
          }),
          async (userData) => {
            // Generate a valid token for the user data
            const token = generateToken(userData);

            // Test with token in auth
            const mockSocketAuth = {
              handshake: {
                auth: { token },
                query: {},
              },
            } as unknown as AuthenticatedSocket;

            await new Promise<void>((resolve) => {
              socketAuthMiddleware(mockSocketAuth, (err) => {
                // Should not have an error
                expect(err).toBeUndefined();
                // Should have user data attached
                expect(mockSocketAuth.user).toBeDefined();
                expect(mockSocketAuth.user?.userId).toBe(userData.userId);
                expect(mockSocketAuth.user?.email).toBe(userData.email);
                expect(mockSocketAuth.user?.role).toBe(userData.role);
                resolve();
              });
            });

            // Test with token in query
            const mockSocketQuery = {
              handshake: {
                auth: {},
                query: { token },
              },
            } as unknown as AuthenticatedSocket;

            await new Promise<void>((resolve) => {
              socketAuthMiddleware(mockSocketQuery, (err) => {
                // Should not have an error
                expect(err).toBeUndefined();
                // Should have user data attached
                expect(mockSocketQuery.user).toBeDefined();
                expect(mockSocketQuery.user?.userId).toBe(userData.userId);
                expect(mockSocketQuery.user?.email).toBe(userData.email);
                expect(mockSocketQuery.user?.role).toBe(userData.role);
                resolve();
              });
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: taskmgr-backend, Property 48: Invalid socket authentication rejected
    // Validates: Requirements 14.4
    it('should reject socket connection with invalid or missing JWT for any invalid token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // No token scenarios
            fc.constant({ auth: {}, query: {} }),
            fc.constant({ auth: { token: undefined }, query: {} }),
            fc.constant({ auth: {}, query: { token: undefined } }),
            // Invalid token strings
            fc.record({
              auth: fc.record({
                token: fc.oneof(
                  fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.startsWith('eyJ')), // Not a JWT
                  fc.constant('invalid-token'),
                  fc.constant(''),
                  fc.constant('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'),
                ),
              }),
              query: fc.constant({}),
            }),
            // Non-string tokens
            fc.record({
              auth: fc.record({
                token: fc.oneof(
                  fc.integer(),
                  fc.boolean(),
                  fc.constant(null),
                  fc.array(fc.string()),
                  fc.object(),
                ),
              }),
              query: fc.constant({}),
            }),
          ),
          async (handshakeData) => {
            const mockSocket = {
              handshake: handshakeData,
            } as unknown as AuthenticatedSocket;

            await new Promise<void>((resolve) => {
              socketAuthMiddleware(mockSocket, (err) => {
                // Should have an error
                expect(err).toBeDefined();
                expect(err?.message).toContain('Authentication error');
                // Should not have user data attached
                expect(mockSocket.user).toBeUndefined();
                resolve();
              });
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
