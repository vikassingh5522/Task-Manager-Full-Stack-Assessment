import fc from 'fast-check';
import mongoose from 'mongoose';
import { Task } from './Task';
import { User } from './User';
import { hashPassword } from '../utils/password';

// Feature: taskmgr-backend, Property 12: Optional fields preserved
describe('Task Model Property Tests', () => {
  let testUserId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/taskmgr-test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await Task.deleteMany({});
    await User.deleteMany({});

    // Create a test user for task creation
    const hashedPassword = await hashPassword('testpassword123');
    const testUser = await User.create({
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
    });
    testUserId = testUser._id as mongoose.Types.ObjectId;
  });

  it(
    'Property 12: Optional fields preserved - all provided optional fields should be stored',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }),
            description: fc.option(fc.string({ maxLength: 1000 })),
            dueDate: fc.option(fc.date()),
            priority: fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
            status: fc.constantFrom('TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'),
            assignedToId: fc.option(fc.boolean()), // We'll use this to decide whether to assign
          }),
          async (taskData) => {
            // Create assignee if needed
            let assignedToId: mongoose.Types.ObjectId | undefined;
            if (taskData.assignedToId) {
              const hashedPassword = await hashPassword('assigneepassword123');
              const assignee = await User.create({
                email: `assignee-${Date.now()}@example.com`,
                password: hashedPassword,
                firstName: 'Assignee',
                lastName: 'User',
              });
              assignedToId = assignee._id as mongoose.Types.ObjectId;
            }

            // Create task with optional fields
            const taskInput = {
              title: taskData.title,
              creatorId: testUserId,
              ...(taskData.description !== null && { description: taskData.description }),
              ...(taskData.dueDate !== null && { dueDate: taskData.dueDate }),
              priority: taskData.priority,
              status: taskData.status,
              ...(assignedToId && { assignedToId }),
            };

            const task = await Task.create(taskInput);
            const savedTask = await Task.findById(task._id);

            // Verify all provided optional fields are preserved
            expect(savedTask).toBeDefined();
            expect(savedTask?.title).toBe(taskData.title);
            expect(savedTask?.priority).toBe(taskData.priority);
            expect(savedTask?.status).toBe(taskData.status);

            // Check optional fields
            if (taskData.description !== null) {
              expect(savedTask?.description).toBe(taskData.description);
            }

            if (taskData.dueDate !== null) {
              expect(savedTask?.dueDate).toBeDefined();
              // Compare timestamps to handle date equality
              expect(savedTask?.dueDate?.getTime()).toBe(taskData.dueDate?.getTime());
            }

            if (assignedToId) {
              expect(savedTask?.assignedToId).toBeDefined();
              expect(savedTask?.assignedToId?.toString()).toBe(assignedToId.toString());
            }
          }
        ),
        { numRuns: 100 }
      );
    },
    60000
  ); // 60 second timeout for property-based test
});
