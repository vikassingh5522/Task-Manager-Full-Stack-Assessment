import fc from 'fast-check';
import mongoose from 'mongoose';
import { register, login, changePassword } from './authService';
import { User } from '../models/User';
import { ValidationError, AuthenticationError } from '../middleware/errors';
import { verifyToken } from '../utils/jwt';

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/taskmgr-test';
  await mongoose.connect(mongoUri);
}, 30000);

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
});

const validEmailArb = fc.emailAddress();
const validPasswordArb = fc.string({ minLength: 8, maxLength: 50 }).filter(pwd => /[a-zA-Z]/.test(pwd) && /\d/.test(pwd));
// Names should have no leading/trailing whitespace since the model trims them
const validNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0 && s === s.trim());

const validRegisterDataArb = fc.record({
  email: validEmailArb,
  password: validPasswordArb,
  firstName: validNameArb,
  lastName: validNameArb,
});

describe('Authentication Service Property Tests', () => {
  describe('Property 2: Registration returns token and user data', () => {
    it('should return both JWT token and user profile data for any valid registration', async () => {
      await fc.assert(
        fc.asyncProperty(validRegisterDataArb, async (registerData) => {
          // Clean up before registration to handle fast-check shrinking replays
          await User.deleteMany({ email: registerData.email.toLowerCase() });
          
          const response = await register(registerData);
          expect(response.token).toBeDefined();
          expect(typeof response.token).toBe('string');
          expect(response.token.length).toBeGreaterThan(0);
          const decoded = verifyToken(response.token);
          expect(decoded.userId).toBeDefined();
          expect(decoded.email).toBe(registerData.email.toLowerCase());
          expect(response.user).toBeDefined();
          expect(response.user.email).toBe(registerData.email.toLowerCase());
          expect(response.user.firstName).toBe(registerData.firstName);
          expect(response.user.lastName).toBe(registerData.lastName);
          expect(response.user.id).toBeDefined();
          expect((response.user as any).password).toBeUndefined();
          expect(response.expiresIn).toBeDefined();
        }),
        { numRuns: 100 }
      );
    }, 120000);
  });

  describe('Property 3: Missing required fields rejected', () => {
    it('should reject registration when email is missing', async () => {
      await fc.assert(
        fc.asyncProperty(validPasswordArb, validNameArb, validNameArb, async (password, firstName, lastName) => {
          const invalidData = { email: '', password, firstName, lastName };
          await expect(register(invalidData)).rejects.toThrow();
        }),
        { numRuns: 50 }
      );
    }, 60000);

    it('should reject registration when password is missing', async () => {
      await fc.assert(
        fc.asyncProperty(validEmailArb, validNameArb, validNameArb, async (email, firstName, lastName) => {
          const invalidData = { email, password: '', firstName, lastName };
          await expect(register(invalidData)).rejects.toThrow(ValidationError);
        }),
        { numRuns: 50 }
      );
    }, 60000);

    it('should reject registration when firstName is missing', async () => {
      await fc.assert(
        fc.asyncProperty(validEmailArb, validPasswordArb, validNameArb, async (email, password, lastName) => {
          const invalidData = { email, password, firstName: '', lastName };
          await expect(register(invalidData)).rejects.toThrow();
        }),
        { numRuns: 50 }
      );
    }, 60000);

    it('should reject registration when lastName is missing', async () => {
      await fc.assert(
        fc.asyncProperty(validEmailArb, validPasswordArb, validNameArb, async (email, password, firstName) => {
          const invalidData = { email, password, firstName, lastName: '' };
          await expect(register(invalidData)).rejects.toThrow();
        }),
        { numRuns: 50 }
      );
    }, 60000);
  });

  describe('Property 6: Invalid credentials rejected', () => {
    it('should reject login with incorrect password for any registered user', async () => {
      await fc.assert(
        fc.asyncProperty(validRegisterDataArb, validPasswordArb, async (registerData, wrongPassword) => {
          fc.pre(wrongPassword !== registerData.password);
          await register(registerData);
          const loginData = { email: registerData.email, password: wrongPassword };
          await expect(login(loginData)).rejects.toThrow(AuthenticationError);
          await User.deleteMany({ email: registerData.email.toLowerCase() });
        }),
        { numRuns: 100 }
      );
    }, 120000);

    it('should reject login with non-existent email', async () => {
      await fc.assert(
        fc.asyncProperty(validEmailArb, validPasswordArb, async (email, password) => {
          await User.deleteMany({ email: email.toLowerCase() });
          const loginData = { email, password };
          await expect(login(loginData)).rejects.toThrow(AuthenticationError);
        }),
        { numRuns: 100 }
      );
    }, 120000);
  });

  describe('Property 7: Login returns complete user data', () => {
    it('should return token and complete user profile for any valid login', async () => {
      await fc.assert(
        fc.asyncProperty(validRegisterDataArb, async (registerData) => {
          // Clean up before registration to handle fast-check shrinking replays
          await User.deleteMany({ email: registerData.email.toLowerCase() });
          
          await register(registerData);
          const loginData = { email: registerData.email, password: registerData.password };
          const response = await login(loginData);
          expect(response.token).toBeDefined();
          expect(typeof response.token).toBe('string');
          const decoded = verifyToken(response.token);
          expect(decoded.userId).toBeDefined();
          expect(response.user).toBeDefined();
          expect(response.user.id).toBeDefined();
          expect(response.user.email).toBe(registerData.email.toLowerCase());
          expect(response.user.firstName).toBe(registerData.firstName);
          expect(response.user.lastName).toBe(registerData.lastName);
          expect(response.user.role).toBeDefined();
          expect(response.user.createdAt).toBeDefined();
          expect(response.user.updatedAt).toBeDefined();
          expect((response.user as any).password).toBeUndefined();
          expect(response.expiresIn).toBeDefined();
        }),
        { numRuns: 100 }
      );
    }, 120000);
  });

  describe('Property 9: Current password verification', () => {
    it('should successfully change password when current password is correct', async () => {
      await fc.assert(
        fc.asyncProperty(validRegisterDataArb, validPasswordArb, async (registerData, newPassword) => {
          fc.pre(newPassword !== registerData.password);
          const registerResponse = await register(registerData);
          const userId = registerResponse.user.id;
          const changeData = { currentPassword: registerData.password, newPassword };
          const result = await changePassword(userId, changeData);
          expect(result.message).toBeDefined();
          const loginData = { email: registerData.email, password: newPassword };
          const loginResponse = await login(loginData);
          expect(loginResponse.token).toBeDefined();
          await User.deleteMany({ email: registerData.email.toLowerCase() });
        }),
        { numRuns: 100 }
      );
    }, 120000);
  });

  describe('Property 10: Incorrect current password rejected', () => {
    it('should reject password change when current password is incorrect', async () => {
      await fc.assert(
        fc.asyncProperty(validRegisterDataArb, validPasswordArb, validPasswordArb, async (registerData, wrongCurrentPassword, newPassword) => {
          fc.pre(wrongCurrentPassword !== registerData.password);
          fc.pre(newPassword !== registerData.password);
          const registerResponse = await register(registerData);
          const userId = registerResponse.user.id;
          const changeData = { currentPassword: wrongCurrentPassword, newPassword };
          await expect(changePassword(userId, changeData)).rejects.toThrow(AuthenticationError);
          const loginData = { email: registerData.email, password: registerData.password };
          const loginResponse = await login(loginData);
          expect(loginResponse.token).toBeDefined();
          await User.deleteMany({ email: registerData.email.toLowerCase() });
        }),
        { numRuns: 100 }
      );
    }, 120000);
  });
});