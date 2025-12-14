import fc from 'fast-check';
import { hashPassword, comparePassword, validatePasswordStrength } from './password';

// Feature: taskmgr-backend, Property 4: Weak passwords rejected
// Feature: taskmgr-backend, Property 8: Password hashing on change
describe('Password Utilities Property Tests', () => {
  describe('Property 4: Weak passwords rejected', () => {
    it(
      'should reject passwords shorter than 8 characters',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ maxLength: 7 }),
            async (weakPassword) => {
              const result = validatePasswordStrength(weakPassword);
              expect(result.isValid).toBe(false);
              expect(result.message).toBeDefined();
            }
          ),
          { numRuns: 100 }
        );
      },
      30000
    );

    it(
      'should reject passwords without letters',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 10000000, max: 99999999 }).map(String), // Generate 8-digit numbers
            async (weakPassword) => {
              const result = validatePasswordStrength(weakPassword);
              expect(result.isValid).toBe(false);
              expect(result.message).toContain('letter');
            }
          ),
          { numRuns: 100 }
        );
      },
      30000
    );

    it(
      'should reject passwords without numbers',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), { minLength: 8, maxLength: 20 }),
            async (weakPassword) => {
              const result = validatePasswordStrength(weakPassword);
              expect(result.isValid).toBe(false);
              expect(result.message).toContain('number');
            }
          ),
          { numRuns: 100 }
        );
      },
      30000
    );

    it(
      'should accept strong passwords with letters and numbers',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.tuple(
              fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), { minLength: 7, maxLength: 20 }),
              fc.stringOf(fc.constantFrom(...'0123456789'.split('')), { minLength: 1, maxLength: 10 })
            ).map(([letters, numbers]) => letters + numbers),
            async (strongPassword) => {
              const result = validatePasswordStrength(strongPassword);
              expect(result.isValid).toBe(true);
              expect(result.message).toBeUndefined();
            }
          ),
          { numRuns: 100 }
        );
      },
      30000
    );
  });

  describe('Property 8: Password hashing on change', () => {
    it(
      'should hash any valid password and verify it matches',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.tuple(
              fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), { minLength: 7, maxLength: 20 }),
              fc.stringOf(fc.constantFrom(...'0123456789'.split('')), { minLength: 1, maxLength: 10 })
            ).map(([letters, numbers]) => letters + numbers),
            async (password) => {
              // Hash the password
              const hashedPassword = await hashPassword(password);

              // Hashed password should not equal plaintext
              expect(hashedPassword).not.toBe(password);

              // Hashed password should start with bcrypt prefix
              expect(hashedPassword).toMatch(/^\$2[aby]\$/);

              // Should be able to verify the password
              const isMatch = await comparePassword(password, hashedPassword);
              expect(isMatch).toBe(true);

              // Wrong password should not match
              const wrongPassword = password + 'wrong';
              const isWrongMatch = await comparePassword(wrongPassword, hashedPassword);
              expect(isWrongMatch).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      },
      120000
    );
  });
});
