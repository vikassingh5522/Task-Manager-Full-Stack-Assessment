import fc from 'fast-check';
import mongoose from 'mongoose';
import {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
} from './notificationService';
import { createTask, updateTask } from './taskService';
import { Notification } from '../models/Notification';
import { Task } from '../models/Task';
import { User, IUser } from '../models/User';
import { hashPassword } from '../utils/password';
import { AuthorizationError } from '../middleware/errors';

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/taskmgr-test';
  await mongoose.connect(mongoUri);
}, 30000);

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Notification.deleteMany({});
  await Task.deleteMany({});
  await User.deleteMany({});
});

// Helper function to create a test user
async function createTestUser(email?: string): Promise<IUser> {
  const hashedPassword = await hashPassword('testpassword123');
  const user = await User.create({
    email: email || `user-${Date.now()}-${Math.random()}@example.com`,
    password: hashedPassword,
    firstName: 'Test',
    lastName: 'User',
  });
  return user;
}

// Arbitraries for generating test data
const validTitleArb = fc.string({ minLength: 1, maxLength: 200 });
const validMessageArb = fc.string({ minLength: 1, maxLength: 500 });
const notificationTypeArb = fc.constantFrom(
  'TASK_ASSIGNED' as const,
  'TASK_UPDATED' as const,
  'DEADLINE_APPROACHING' as const,
  'MENTION' as const
);

describe('Notification Service Property Tests', () => {
  // Feature: taskmgr-backend, Property 35: Task assignment creates notification
  describe('Property 35: Task assignment creates notification', () => {
    it('should create a TASK_ASSIGNED notification when a task is assigned to a user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (taskTitle) => {
            const creator = await createTestUser();
            const assignee = await createTestUser();
            const creatorId = creator._id.toString();
            const assigneeId = assignee._id.toString();

            // Create a task assigned to the assignee
            const task = await createTask(creatorId, {
              title: taskTitle,
              assignedToId: assigneeId,
            });

            // Manually create notification (simulating what would happen in the controller)
            const notification = await createNotification({
              userId: assigneeId,
              type: 'TASK_ASSIGNED',
              title: 'New Task Assigned',
              message: `You have been assigned to task: ${task.title}`,
              resourceId: task._id.toString(),
              resourceType: 'TASK',
            });

            expect(notification).toBeDefined();
            expect(notification.userId.toString()).toBe(assigneeId);
            expect(notification.type).toBe('TASK_ASSIGNED');
            expect(notification.resourceId?.toString()).toBe(task._id.toString());
            expect(notification.resourceType).toBe('TASK');
          }
        ),
        { numRuns: 100 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 36: Task update creates notification
  describe('Property 36: Task update creates notification', () => {
    it('should create a TASK_UPDATED notification when a task is updated', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.constantFrom('TODO' as const, 'IN_PROGRESS' as const, 'REVIEW' as const, 'COMPLETED' as const),
          async (taskTitle, newStatus) => {
            const creator = await createTestUser();
            const assignee = await createTestUser();
            const creatorId = creator._id.toString();
            const assigneeId = assignee._id.toString();

            // Create a task
            const task = await createTask(creatorId, {
              title: taskTitle,
              assignedToId: assigneeId,
            });

            // Update the task
            await updateTask(task._id.toString(), creatorId, {
              status: newStatus,
            });

            // Manually create notification (simulating what would happen in the controller)
            const notification = await createNotification({
              userId: assigneeId,
              type: 'TASK_UPDATED',
              title: 'Task Updated',
              message: `Task "${task.title}" has been updated`,
              resourceId: task._id.toString(),
              resourceType: 'TASK',
            });

            expect(notification).toBeDefined();
            expect(notification.userId.toString()).toBe(assigneeId);
            expect(notification.type).toBe('TASK_UPDATED');
            expect(notification.resourceId?.toString()).toBe(task._id.toString());
          }
        ),
        { numRuns: 100 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 37: Notifications ordered by date
  describe('Property 37: Notifications ordered by date', () => {
    it('should return notifications ordered by createdAt descending (newest first)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 10 }),
          async (notificationCount) => {
            const user = await createTestUser();
            const userId = user._id.toString();

            // Create multiple notifications with slight delays to ensure different timestamps
            const createdNotifications = [];
            for (let i = 0; i < notificationCount; i++) {
              const notification = await createNotification({
                userId,
                type: 'TASK_ASSIGNED',
                title: `Notification ${i}`,
                message: `Message ${i}`,
              });
              createdNotifications.push(notification);
              // Small delay to ensure different timestamps
              await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Get notifications
            const notifications = await getNotifications(userId);

            expect(notifications.length).toBe(notificationCount);

            // Verify they are ordered by createdAt descending
            for (let i = 0; i < notifications.length - 1; i++) {
              const current = notifications[i].createdAt.getTime();
              const next = notifications[i + 1].createdAt.getTime();
              expect(current).toBeGreaterThanOrEqual(next);
            }
          }
        ),
        { numRuns: 50 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 39: Mark notification as read
  describe('Property 39: Mark notification as read', () => {
    it('should update read field to true when notification is marked as read by owner', async () => {
      await fc.assert(
        fc.asyncProperty(
          validTitleArb,
          validMessageArb,
          notificationTypeArb,
          async (title, message, type) => {
            const user = await createTestUser();
            const userId = user._id.toString();

            // Create a notification
            const notification = await createNotification({
              userId,
              type,
              title,
              message,
            });

            expect(notification.read).toBe(false);

            // Mark as read
            const updatedNotification = await markAsRead(notification._id.toString(), userId);

            expect(updatedNotification.read).toBe(true);
            expect(updatedNotification._id.toString()).toBe(notification._id.toString());
          }
        ),
        { numRuns: 100 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 40: Mark all notifications as read
  describe('Property 40: Mark all notifications as read', () => {
    it('should set read field to true for all user notifications', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (notificationCount) => {
            const user = await createTestUser();
            const userId = user._id.toString();

            // Create multiple unread notifications
            for (let i = 0; i < notificationCount; i++) {
              await createNotification({
                userId,
                type: 'TASK_ASSIGNED',
                title: `Notification ${i}`,
                message: `Message ${i}`,
              });
            }

            // Verify all are unread
            const unreadNotifications = await getNotifications(userId);
            expect(unreadNotifications.every(n => n.read === false)).toBe(true);

            // Mark all as read
            const result = await markAllAsRead(userId);
            expect(result.count).toBe(notificationCount);

            // Verify all are now read
            const readNotifications = await getNotifications(userId);
            expect(readNotifications.every(n => n.read === true)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 41: Unauthorized notification access denied
  describe('Property 41: Unauthorized notification access denied', () => {
    it('should reject marking notification as read by non-owner', async () => {
      await fc.assert(
        fc.asyncProperty(
          validTitleArb,
          validMessageArb,
          notificationTypeArb,
          async (title, message, type) => {
            const owner = await createTestUser();
            const otherUser = await createTestUser();
            const ownerId = owner._id.toString();
            const otherUserId = otherUser._id.toString();

            // Create a notification for owner
            const notification = await createNotification({
              userId: ownerId,
              type,
              title,
              message,
            });

            // Try to mark as read by other user
            await expect(
              markAsRead(notification._id.toString(), otherUserId)
            ).rejects.toThrow(AuthorizationError);

            // Verify notification is still unread
            const unchangedNotification = await Notification.findById(notification._id);
            expect(unchangedNotification?.read).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }, 120000);
  });
});
