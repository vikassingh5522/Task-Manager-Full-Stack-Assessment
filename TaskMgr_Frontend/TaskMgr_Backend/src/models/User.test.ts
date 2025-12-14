import fc from 'fast-check';
import mongoose from 'mongoose';
import { User } from './User';
import { hashPassword } from '../utils/password';

// Feature: taskmgr-backend, Property 1: Password hashing on registration
describe('User Model Property Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/taskmgr-test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  it(
    'Property 1: Password hashing on registration - stored password should be hashed',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }),
            firstName: fc.string({ minLength: 1, maxLength: 50 }),
            lastName: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          async (userData) => {
            const plaintextPassword = userData.password;
            const hashedPassword = await hashPassword(plaintextPassword);

            const user = await User.create({
              ...userData,
              password: hashedPassword,
            });

            // Fetch user with password field explicitly selected
            const savedUser = await User.findById(user._id).select('+password');

            // The stored password should be hashed (not equal to plaintext)
            expect(savedUser?.password).toBeDefined();
            expect(savedUser?.password).not.toBe(plaintextPassword);
            // Hashed password should start with bcrypt prefix
            expect(savedUser?.password).toMatch(/^\$2[aby]\$/);
          }
        ),
        { numRuns: 100 }
      );
    },
    60000
  ); // 60 second timeout for property-based test
});
