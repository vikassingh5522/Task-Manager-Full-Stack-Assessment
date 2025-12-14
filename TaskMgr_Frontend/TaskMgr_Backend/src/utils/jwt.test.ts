import fc from 'fast-check';
import { generateToken, verifyToken, isTokenExpired } from './jwt';

// Feature: taskmgr-backend, Property 5: Valid login returns token
describe('JWT Utilities Property Tests', () => {
  describe('Property 5: Valid login returns token', () => {
    it(
      'should generate a valid JWT token for any user payload',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              userId: fc.uuid(),
              email: fc.emailAddress(),
              role: fc.constantFrom('USER', 'ADMIN'),
            }),
            async (userPayload) => {
              // Generate token
              const token = generateToken(userPayload);

              // Token should be a non-empty string
              expect(token).toBeDefined();
              expect(typeof token).toBe('string');
              expect(token.length).toBeGreaterThan(0);

              // Token should have three parts separated by dots (JWT format)
              const parts = token.split('.');
              expect(parts.length).toBe(3);

              // Should be able to verify the token
              const decoded = verifyToken(token);
              expect(decoded).toBeDefined();
              expect(decoded.userId).toBe(userPayload.userId);
              expect(decoded.email).toBe(userPayload.email);
              expect(decoded.role).toBe(userPayload.role);

              // Token should have expiration time
              expect(decoded.exp).toBeDefined();
              expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));

              // Token should have issued at time
              expect(decoded.iat).toBeDefined();

              // Token should not be expired
              expect(isTokenExpired(token)).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      },
      30000
    );

    it(
      'should reject invalid tokens',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 10, maxLength: 100 }),
            async (invalidToken) => {
              // Skip if by chance we generated a valid JWT format
              if (invalidToken.split('.').length === 3) {
                return;
              }

              // Should throw error for invalid token
              expect(() => verifyToken(invalidToken)).toThrow();
            }
          ),
          { numRuns: 100 }
        );
      },
      30000
    );

    it(
      'should generate different tokens for different users',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.tuple(
              fc.record({
                userId: fc.uuid(),
                email: fc.emailAddress(),
                role: fc.constantFrom('USER', 'ADMIN'),
              }),
              fc.record({
                userId: fc.uuid(),
                email: fc.emailAddress(),
                role: fc.constantFrom('USER', 'ADMIN'),
              })
            ),
            async ([user1, user2]) => {
              // Skip if users are identical
              if (user1.userId === user2.userId && user1.email === user2.email) {
                return;
              }

              const token1 = generateToken(user1);
              const token2 = generateToken(user2);

              // Tokens should be different for different users
              expect(token1).not.toBe(token2);

              // Both tokens should be valid
              const decoded1 = verifyToken(token1);
              const decoded2 = verifyToken(token2);

              expect(decoded1.userId).toBe(user1.userId);
              expect(decoded2.userId).toBe(user2.userId);
            }
          ),
          { numRuns: 100 }
        );
      },
      30000
    );
  });
});
