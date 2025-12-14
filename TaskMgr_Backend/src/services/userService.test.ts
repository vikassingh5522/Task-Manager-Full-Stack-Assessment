import fc from 'fast-check';
import mongoose from 'mongoose';
import { User } from '../models/User';
import * as userService from './userService';
import { AuthorizationError, NotFoundError, ValidationError } from '../middleware/errors';

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

describe('User Service', () => {
  describe('getUserProfile', () => {
    it('should return user profile for valid user ID', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER'
      });

      const profile = await userService.getUserProfile(user._id.toString());

      expect(profile).toBeDefined();
      expect(profile.email).toBe('test@example.com');
      expect(profile.firstName).toBe('John');
      expect(profile.lastName).toBe('Doe');
      expect((profile as any).password).toBeUndefined();
    });

    it('should throw NotFoundError for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      await expect(userService.getUserProfile(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER'
      });

      const updateData = {
        firstName: 'Jane',
        bio: 'Software developer',
        phoneNumber: '+1234567890'
      };

      const updatedProfile = await userService.updateUserProfile(
        user._id.toString(),
        user._id.toString(),
        updateData
      );

      expect(updatedProfile.firstName).toBe('Jane');
      expect(updatedProfile.lastName).toBe('Doe'); // unchanged
      expect(updatedProfile.bio).toBe('Software developer');
      expect(updatedProfile.phoneNumber).toBe('+1234567890');
    });

    it('should throw AuthorizationError when updating another user profile', async () => {
      const user1 = await User.create({
        email: 'user1@example.com',
        password: 'hashedpassword',
        firstName: 'User',
        lastName: 'One',
        role: 'USER'
      });

      const user2 = await User.create({
        email: 'user2@example.com',
        password: 'hashedpassword',
        firstName: 'User',
        lastName: 'Two',
        role: 'USER'
      });

      const updateData = { firstName: 'Hacker' };

      await expect(
        userService.updateUserProfile(user1._id.toString(), user2._id.toString(), updateData)
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw ValidationError for empty firstName', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER'
      });

      const updateData = { firstName: '   ' };

      await expect(
        userService.updateUserProfile(user._id.toString(), user._id.toString(), updateData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty lastName', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER'
      });

      const updateData = { lastName: '' };

      await expect(
        userService.updateUserProfile(user._id.toString(), user._id.toString(), updateData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const updateData = { firstName: 'Jane' };

      await expect(
        userService.updateUserProfile(fakeId, fakeId, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should allow clearing optional fields', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        bio: 'Old bio',
        phoneNumber: '+1234567890'
      });

      const updateData = {
        bio: '',
        phoneNumber: ''
      };

      const updatedProfile = await userService.updateUserProfile(
        user._id.toString(),
        user._id.toString(),
        updateData
      );

      expect(updatedProfile.bio).toBeUndefined();
      expect(updatedProfile.phoneNumber).toBeUndefined();
    });
  });
});

// Arbitraries for property-based testing
const validNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0 && s === s.trim());
const optionalStringArb = fc.option(fc.string({ maxLength: 200 }), { nil: undefined });
const phoneNumberArb = fc.option(fc.string({ minLength: 10, maxLength: 20 }).filter(s => /^[+\d\s()-]+$/.test(s)), { nil: undefined });
const urlArb = fc.option(fc.webUrl(), { nil: undefined });

const validUpdateDataArb = fc.record({
  firstName: fc.option(validNameArb, { nil: undefined }),
  lastName: fc.option(validNameArb, { nil: undefined }),
  bio: optionalStringArb,
  phoneNumber: phoneNumberArb,
  avatarUrl: urlArb
});

describe('User Service Property Tests', () => {
  // Feature: taskmgr-backend, Property 42: Profile update applies changes
  describe('Property 42: Profile update applies changes', () => {
    it('should apply all provided update fields for any valid profile data', async () => {
      await fc.assert(
        fc.asyncProperty(validUpdateDataArb, async (updateData) => {
          // Create a test user
          const user = await User.create({
            email: `test-${Date.now()}-${Math.random()}@example.com`,
            password: 'hashedpassword123',
            firstName: 'Original',
            lastName: 'Name',
            role: 'USER'
          });

          const userId = user._id.toString();

          // Update the profile
          const updatedProfile = await userService.updateUserProfile(
            userId,
            userId,
            updateData
          );

          // Verify all provided fields were applied
          if (updateData.firstName !== undefined) {
            expect(updatedProfile.firstName).toBe(updateData.firstName.trim());
          } else {
            expect(updatedProfile.firstName).toBe('Original');
          }

          if (updateData.lastName !== undefined) {
            expect(updatedProfile.lastName).toBe(updateData.lastName.trim());
          } else {
            expect(updatedProfile.lastName).toBe('Name');
          }

          if (updateData.bio !== undefined) {
            if (updateData.bio && updateData.bio.trim().length > 0) {
              expect(updatedProfile.bio).toBe(updateData.bio.trim());
            } else {
              expect(updatedProfile.bio).toBeUndefined();
            }
          }

          if (updateData.phoneNumber !== undefined) {
            if (updateData.phoneNumber && updateData.phoneNumber.trim().length > 0) {
              expect(updatedProfile.phoneNumber).toBe(updateData.phoneNumber.trim());
            } else {
              expect(updatedProfile.phoneNumber).toBeUndefined();
            }
          }

          if (updateData.avatarUrl !== undefined) {
            if (updateData.avatarUrl && updateData.avatarUrl.trim().length > 0) {
              expect(updatedProfile.avatarUrl).toBe(updateData.avatarUrl.trim());
            } else {
              expect(updatedProfile.avatarUrl).toBeUndefined();
            }
          }

          // Clean up
          await User.deleteMany({ _id: user._id });
        }),
        { numRuns: 100 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 43: Profile update validation
  describe('Property 43: Profile update validation', () => {
    it('should reject profile updates with empty firstName', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constantFrom('', '   ', '\t', '\n'), async (invalidFirstName) => {
          const user = await User.create({
            email: `test-${Date.now()}-${Math.random()}@example.com`,
            password: 'hashedpassword123',
            firstName: 'Valid',
            lastName: 'Name',
            role: 'USER'
          });

          const userId = user._id.toString();
          const updateData = { firstName: invalidFirstName };

          await expect(
            userService.updateUserProfile(userId, userId, updateData)
          ).rejects.toThrow(ValidationError);

          // Clean up
          await User.deleteMany({ _id: user._id });
        }),
        { numRuns: 100 }
      );
    }, 120000);

    it('should reject profile updates with empty lastName', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constantFrom('', '   ', '\t', '\n'), async (invalidLastName) => {
          const user = await User.create({
            email: `test-${Date.now()}-${Math.random()}@example.com`,
            password: 'hashedpassword123',
            firstName: 'Valid',
            lastName: 'Name',
            role: 'USER'
          });

          const userId = user._id.toString();
          const updateData = { lastName: invalidLastName };

          await expect(
            userService.updateUserProfile(userId, userId, updateData)
          ).rejects.toThrow(ValidationError);

          // Clean up
          await User.deleteMany({ _id: user._id });
        }),
        { numRuns: 100 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 44: Unauthorized profile update denied
  describe('Property 44: Unauthorized profile update denied', () => {
    it('should reject profile updates when user tries to update another user profile', async () => {
      await fc.assert(
        fc.asyncProperty(validUpdateDataArb, async (updateData) => {
          // Create two different users
          const user1 = await User.create({
            email: `user1-${Date.now()}-${Math.random()}@example.com`,
            password: 'hashedpassword123',
            firstName: 'User',
            lastName: 'One',
            role: 'USER'
          });

          const user2 = await User.create({
            email: `user2-${Date.now()}-${Math.random()}@example.com`,
            password: 'hashedpassword123',
            firstName: 'User',
            lastName: 'Two',
            role: 'USER'
          });

          const user1Id = user1._id.toString();
          const user2Id = user2._id.toString();

          // User 1 tries to update User 2's profile
          await expect(
            userService.updateUserProfile(user1Id, user2Id, updateData)
          ).rejects.toThrow(AuthorizationError);

          // Clean up
          await User.deleteMany({ _id: { $in: [user1._id, user2._id] } });
        }),
        { numRuns: 100 }
      );
    }, 120000);
  });
});
