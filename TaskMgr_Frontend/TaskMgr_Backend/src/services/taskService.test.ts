import fc from 'fast-check';
import mongoose from 'mongoose';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  CreateTaskData,
  UpdateTaskData,
} from './taskService';
import { Task } from '../models/Task';
import { User, IUser } from '../models/User';
import { hashPassword } from '../utils/password';
import { ValidationError, AuthorizationError, NotFoundError } from '../middleware/errors';

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/taskmgr-test';
  await mongoose.connect(mongoUri);
}, 30000);

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Task.deleteMany({});
  await User.deleteMany({});
});

// Arbitraries for generating test data
const validTitleArb = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);
const validDescriptionArb = fc.option(fc.string({ maxLength: 1000 }));
const validDueDateArb = fc.option(fc.date());
const validPriorityArb = fc.constantFrom('LOW' as const, 'MEDIUM' as const, 'HIGH' as const, 'URGENT' as const);
const validStatusArb = fc.constantFrom('TODO' as const, 'IN_PROGRESS' as const, 'REVIEW' as const, 'COMPLETED' as const);

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

describe('Task Service Property Tests', () => {
  // Feature: taskmgr-backend, Property 11: Task creation with creator
  describe('Property 11: Task creation with creator', () => {
    it('should set creatorId to authenticated user for any valid task data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: validTitleArb,
            description: validDescriptionArb,
            dueDate: validDueDateArb,
            priority: validPriorityArb,
            status: validStatusArb,
          }),
          async (taskData) => {
            const user = await createTestUser();
            const userId = user._id.toString();

            const createData: CreateTaskData = {
              title: taskData.title,
              ...(taskData.description !== null && { description: taskData.description }),
              ...(taskData.dueDate !== null && { dueDate: taskData.dueDate }),
              priority: taskData.priority,
              status: taskData.status,
            };

            const task = await createTask(userId, createData);

            expect(task.creatorId.toString()).toBe(userId);
          }
        ),
        { numRuns: 100 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 14: User access control
  describe('Property 14: User access control', () => {
    it('should only return tasks where user is creator or assignee', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          async (createdCount, assignedCount) => {
            const user = await createTestUser();
            const otherUser = await createTestUser();
            const userId = user._id.toString();

            // Create tasks where user is creator
            for (let i = 0; i < createdCount; i++) {
              await createTask(userId, { title: `Created Task ${i}` });
            }

            // Create tasks where user is assignee
            for (let i = 0; i < assignedCount; i++) {
              await createTask(otherUser._id.toString(), {
                title: `Assigned Task ${i}`,
                assignedToId: userId,
              });
            }

            // Create tasks where user has no access
            await createTask(otherUser._id.toString(), { title: 'No Access Task' });

            const result = await getTasks(userId);

            // User should see exactly createdCount + assignedCount tasks
            expect(result.items.length).toBe(createdCount + assignedCount);

            // Verify all returned tasks have user as creator or assignee
            result.items.forEach((task) => {
              const isCreator = task.creatorId._id.toString() === userId;
              const isAssignee = task.assignedToId && task.assignedToId._id.toString() === userId;
              expect(isCreator || isAssignee).toBe(true);
            });
          }
        ),
        { numRuns: 50 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 15: Filter matching
  describe('Property 15: Filter matching', () => {
    it('should return only tasks matching status filter', async () => {
      await fc.assert(
        fc.asyncProperty(validStatusArb, async (filterStatus) => {
          const user = await createTestUser();
          const userId = user._id.toString();

          // Create tasks with different statuses
          const statuses: Array<'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'> = [
            'TODO',
            'IN_PROGRESS',
            'REVIEW',
            'COMPLETED',
          ];
          for (const status of statuses) {
            await createTask(userId, { title: `Task ${status}`, status });
          }

          const result = await getTasks(userId, { status: filterStatus });

          // All returned tasks should have the filtered status
          result.items.forEach((task) => {
            expect(task.status).toBe(filterStatus);
          });

          // Should have at least one task with the filtered status
          expect(result.items.length).toBeGreaterThan(0);
        }),
        { numRuns: 50 }
      );
    }, 120000);

    it('should return only tasks matching priority filter', async () => {
      await fc.assert(
        fc.asyncProperty(validPriorityArb, async (filterPriority) => {
          const user = await createTestUser();
          const userId = user._id.toString();

          // Create tasks with different priorities
          const priorities: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = [
            'LOW',
            'MEDIUM',
            'HIGH',
            'URGENT',
          ];
          for (const priority of priorities) {
            await createTask(userId, { title: `Task ${priority}`, priority });
          }

          const result = await getTasks(userId, { priority: filterPriority });

          // All returned tasks should have the filtered priority
          result.items.forEach((task) => {
            expect(task.priority).toBe(filterPriority);
          });

          // Should have at least one task with the filtered priority
          expect(result.items.length).toBeGreaterThan(0);
        }),
        { numRuns: 50 }
      );
    }, 120000);

    it('should return only tasks matching search filter', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 10 }).filter(s => /^[a-zA-Z]+$/.test(s)),
          async (searchTerm) => {
            const user = await createTestUser();
            const userId = user._id.toString();

            // Create tasks with and without the search term
            await createTask(userId, { title: `Task with ${searchTerm} in title` });
            await createTask(userId, { title: 'Task without search term', description: `Description with ${searchTerm}` });
            await createTask(userId, { title: 'Unrelated task', description: 'Unrelated description' });

            const result = await getTasks(userId, { search: searchTerm });

            // All returned tasks should contain the search term in title or description
            result.items.forEach((task) => {
              const inTitle = task.title.toLowerCase().includes(searchTerm.toLowerCase());
              const inDescription = task.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
              expect(inTitle || inDescription).toBe(true);
            });

            // Should have at least the two tasks with the search term
            expect(result.items.length).toBeGreaterThanOrEqual(2);
          }
        ),
        { numRuns: 30 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 16: Pagination correctness
  describe('Property 16: Pagination correctness', () => {
    it('should return correct subset of tasks and accurate total count', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 5, max: 20 }),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 2, max: 10 }),
          async (totalTasks, page, limit) => {
            const user = await createTestUser();
            const userId = user._id.toString();

            // Create tasks
            for (let i = 0; i < totalTasks; i++) {
              await createTask(userId, { title: `Task ${i}` });
            }

            const result = await getTasks(userId, {}, { page, limit });

            // Verify pagination metadata
            expect(result.total).toBe(totalTasks);
            expect(result.page).toBe(page);
            expect(result.limit).toBe(limit);
            expect(result.totalPages).toBe(Math.ceil(totalTasks / limit));

            // Verify correct number of items returned
            const expectedItems = Math.min(limit, Math.max(0, totalTasks - (page - 1) * limit));
            expect(result.items.length).toBe(expectedItems);
          }
        ),
        { numRuns: 50 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 17: Authorized task retrieval
  describe('Property 17: Authorized task retrieval', () => {
    it('should return task data when user is creator', async () => {
      await fc.assert(
        fc.asyncProperty(validTitleArb, async (title) => {
          const user = await createTestUser();
          const userId = user._id.toString();

          const task = await createTask(userId, { title });
          const taskId = task._id.toString();

          const retrievedTask = await getTaskById(taskId, userId);

          expect(retrievedTask).toBeDefined();
          expect(retrievedTask._id.toString()).toBe(taskId);
          // Title is trimmed by the model
          expect(retrievedTask.title).toBe(title.trim());
        }),
        { numRuns: 100 }
      );
    }, 120000);

    it('should return task data when user is assignee', async () => {
      await fc.assert(
        fc.asyncProperty(validTitleArb, async (title) => {
          const creator = await createTestUser();
          const assignee = await createTestUser();
          const assigneeId = assignee._id.toString();

          const task = await createTask(creator._id.toString(), {
            title,
            assignedToId: assigneeId,
          });
          const taskId = task._id.toString();

          const retrievedTask = await getTaskById(taskId, assigneeId);

          expect(retrievedTask).toBeDefined();
          expect(retrievedTask._id.toString()).toBe(taskId);
          // Title is trimmed by the model
          expect(retrievedTask.title).toBe(title.trim());
        }),
        { numRuns: 100 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 18: Unauthorized task access denied
  describe('Property 18: Unauthorized task access denied', () => {
    it('should return 403 forbidden when user is neither creator nor assignee', async () => {
      await fc.assert(
        fc.asyncProperty(validTitleArb, async (title) => {
          const creator = await createTestUser();
          const unauthorizedUser = await createTestUser();

          const task = await createTask(creator._id.toString(), { title });
          const taskId = task._id.toString();

          await expect(
            getTaskById(taskId, unauthorizedUser._id.toString())
          ).rejects.toThrow(AuthorizationError);
        }),
        { numRuns: 100 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 19: Task update applies changes
  describe('Property 19: Task update applies changes', () => {
    it('should apply all provided update fields to the task', async () => {
      await fc.assert(
        fc.asyncProperty(
          validTitleArb,
          fc.record({
            title: validTitleArb,
            description: validDescriptionArb,
            priority: validPriorityArb,
            status: validStatusArb,
          }),
          async (originalTitle, updateData) => {
            const user = await createTestUser();
            const userId = user._id.toString();

            const task = await createTask(userId, { title: originalTitle });
            const taskId = task._id.toString();

            const updatePayload: UpdateTaskData = {
              title: updateData.title,
              ...(updateData.description !== null && { description: updateData.description }),
              priority: updateData.priority,
              status: updateData.status,
            };

            const updatedTask = await updateTask(taskId, userId, updatePayload);

            // Title is trimmed by the model
            expect(updatedTask.title).toBe(updateData.title.trim());
            expect(updatedTask.priority).toBe(updateData.priority);
            expect(updatedTask.status).toBe(updateData.status);
            if (updateData.description !== null) {
              expect(updatedTask.description).toBe(updateData.description);
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 20: UpdatedAt timestamp changes
  describe('Property 20: UpdatedAt timestamp changes', () => {
    it('should update the updatedAt timestamp on task update', async () => {
      await fc.assert(
        fc.asyncProperty(validTitleArb, validTitleArb, async (originalTitle, newTitle) => {
          fc.pre(originalTitle !== newTitle);

          const user = await createTestUser();
          const userId = user._id.toString();

          const task = await createTask(userId, { title: originalTitle });
          const taskId = task._id.toString();
          const originalUpdatedAt = task.updatedAt;

          // Wait a bit to ensure timestamp difference
          await new Promise(resolve => setTimeout(resolve, 10));

          const updatedTask = await updateTask(taskId, userId, { title: newTitle });

          expect(updatedTask.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        }),
        { numRuns: 50 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 22: Unauthorized update denied
  describe('Property 22: Unauthorized update denied', () => {
    it('should return 403 forbidden when user is neither creator nor assignee', async () => {
      await fc.assert(
        fc.asyncProperty(validTitleArb, validTitleArb, async (originalTitle, newTitle) => {
          const creator = await createTestUser();
          const unauthorizedUser = await createTestUser();

          const task = await createTask(creator._id.toString(), { title: originalTitle });
          const taskId = task._id.toString();

          await expect(
            updateTask(taskId, unauthorizedUser._id.toString(), { title: newTitle })
          ).rejects.toThrow(AuthorizationError);
        }),
        { numRuns: 100 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 23: Invalid update data rejected
  describe('Property 23: Invalid update data rejected', () => {
    it('should reject update with invalid status', async () => {
      await fc.assert(
        fc.asyncProperty(validTitleArb, async (title) => {
          const user = await createTestUser();
          const userId = user._id.toString();

          const task = await createTask(userId, { title });
          const taskId = task._id.toString();

          await expect(
            updateTask(taskId, userId, { status: 'INVALID_STATUS' as any })
          ).rejects.toThrow(ValidationError);
        }),
        { numRuns: 50 }
      );
    }, 120000);

    it('should reject update with invalid priority', async () => {
      await fc.assert(
        fc.asyncProperty(validTitleArb, async (title) => {
          const user = await createTestUser();
          const userId = user._id.toString();

          const task = await createTask(userId, { title });
          const taskId = task._id.toString();

          await expect(
            updateTask(taskId, userId, { priority: 'INVALID_PRIORITY' as any })
          ).rejects.toThrow(ValidationError);
        }),
        { numRuns: 50 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 24: Task deletion removes from database
  describe('Property 24: Task deletion removes from database', () => {
    it('should remove task from database and return 404 on subsequent queries', async () => {
      await fc.assert(
        fc.asyncProperty(validTitleArb, async (title) => {
          const user = await createTestUser();
          const userId = user._id.toString();

          const task = await createTask(userId, { title });
          const taskId = task._id.toString();

          await deleteTask(taskId, userId);

          await expect(getTaskById(taskId, userId)).rejects.toThrow(NotFoundError);
        }),
        { numRuns: 100 }
      );
    }, 120000);
  });

  // Feature: taskmgr-backend, Property 26: Unauthorized deletion denied
  describe('Property 26: Unauthorized deletion denied', () => {
    it('should return 403 forbidden when user is not the creator', async () => {
      await fc.assert(
        fc.asyncProperty(validTitleArb, async (title) => {
          const creator = await createTestUser();
          const assignee = await createTestUser();

          const task = await createTask(creator._id.toString(), {
            title,
            assignedToId: assignee._id.toString(),
          });
          const taskId = task._id.toString();

          // Assignee should not be able to delete
          await expect(
            deleteTask(taskId, assignee._id.toString())
          ).rejects.toThrow(AuthorizationError);

          // Task should still exist
          const stillExists = await getTaskById(taskId, creator._id.toString());
          expect(stillExists).toBeDefined();
        }),
        { numRuns: 100 }
      );
    }, 120000);

    it('should return 403 forbidden when user has no access to task', async () => {
      await fc.assert(
        fc.asyncProperty(validTitleArb, async (title) => {
          const creator = await createTestUser();
          const unauthorizedUser = await createTestUser();

          const task = await createTask(creator._id.toString(), { title });
          const taskId = task._id.toString();

          await expect(
            deleteTask(taskId, unauthorizedUser._id.toString())
          ).rejects.toThrow(AuthorizationError);

          // Task should still exist
          const stillExists = await getTaskById(taskId, creator._id.toString());
          expect(stillExists).toBeDefined();
        }),
        { numRuns: 100 }
      );
    }, 120000);
  });
});
