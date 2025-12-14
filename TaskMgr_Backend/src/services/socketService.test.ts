import fc from 'fast-check';
import { Server as HTTPServer } from 'http';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import express from 'express';
import { initializeSocketIO, closeSocketIO } from '../socket';
import { emitTaskCreated, emitTaskUpdated, emitTaskDeleted, emitNotification } from './socketService';
import { createTask } from './taskService';
import { updateTask } from './taskService';
import { deleteTask } from './taskService';
import { createNotification } from './notificationService';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { Notification } from '../models/Notification';
import { generateToken } from '../utils/jwt';
import { hashPassword } from '../utils/password';
import { config } from '../config/env';

describe('Socket Service Property Tests', () => {
  let httpServer: HTTPServer;
  let app: express.Application;
  let serverPort: number;

  // Increase timeout for all tests in this suite
  jest.setTimeout(60000);

  beforeAll(async () => {
    // Connect to test database
    await connectDatabase(config.mongodbUri);
  });

  afterAll(async () => {
    // Disconnect from test database
    await disconnectDatabase();
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    await Task.deleteMany({});
    await Notification.deleteMany({});

    // Create Express app and HTTP server
    app = express();
    httpServer = app.listen(0); // Use random available port
    const address = httpServer.address();
    serverPort = typeof address === 'object' && address ? address.port : 3000;

    // Initialize Socket.IO
    initializeSocketIO(httpServer);
  });

  afterEach(async () => {
    // Close Socket.IO and HTTP server
    closeSocketIO();
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
  });

  /**
   * Helper function to create a test user
   */
  async function createTestUser(email: string = 'test@example.com') {
    const hashedPassword = await hashPassword('Password123!');
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
    });
    return user;
  }

  /**
   * Helper function to create authenticated socket client
   */
  async function createAuthenticatedClient(userId: string, email: string): Promise<ClientSocket> {
    const token = generateToken({ userId, email, role: 'USER' });
    
    return new Promise((resolve, reject) => {
      const client = ioClient(`http://localhost:${serverPort}`, {
        auth: { token },
        transports: ['websocket'],
      });

      client.on('connect', () => {
        resolve(client);
      });

      client.on('connect_error', (error) => {
        reject(error);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
    });
  }

  describe('Property-Based Tests', () => {
    // Feature: taskmgr-backend, Property 13: Task creation emits event
    // Validates: Requirements 3.5
    it('should emit task:created event for any task creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
            priority: fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'URGENT') as fc.Arbitrary<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>,
            status: fc.constantFrom('TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED') as fc.Arbitrary<'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'>,
          }),
          async (taskData) => {
            // Create test user
            const user = await createTestUser(`test-${Date.now()}@example.com`);
            const userId = user._id.toString();

            // Create authenticated client
            const client = await createAuthenticatedClient(userId, user.email);

            try {
              // Set up event listener
              const eventPromise = new Promise<any>((resolve) => {
                client.on('task:created', (data) => {
                  resolve(data);
                });
              });

              // Create task
              const task = await createTask(userId, taskData);

              // Emit the event
              emitTaskCreated(task);

              // Wait for event with timeout
              const receivedData = await Promise.race([
                eventPromise,
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Event timeout')), 2000)
                ),
              ]);

              // Verify event data
              expect(receivedData).toBeDefined();
              expect(receivedData.id).toBe(task._id.toString());
              // Title is trimmed by the model, so compare against trimmed value
              expect(receivedData.title).toBe(taskData.title.trim());
              expect(receivedData.priority).toBe(taskData.priority);
              expect(receivedData.status).toBe(taskData.status);
            } finally {
              client.close();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    // Feature: taskmgr-backend, Property 21: Task update emits event
    // Validates: Requirements 5.3
    it('should emit task:updated event for any task update', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            initialTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            updatedTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            updatedStatus: fc.constantFrom('TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED') as fc.Arbitrary<'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'>,
          }),
          async (testData) => {
            // Create test user
            const user = await createTestUser(`test-${Date.now()}@example.com`);
            const userId = user._id.toString();

            // Create initial task
            const task = await createTask(userId, { title: testData.initialTitle });
            const taskId = task._id.toString();

            // Create authenticated client
            const client = await createAuthenticatedClient(userId, user.email);

            try {
              // Set up event listener
              const eventPromise = new Promise<any>((resolve) => {
                client.on('task:updated', (data) => {
                  resolve(data);
                });
              });

              // Update task
              const updatedTask = await updateTask(taskId, userId, {
                title: testData.updatedTitle,
                status: testData.updatedStatus,
              });

              // Emit the event
              emitTaskUpdated(updatedTask);

              // Wait for event with timeout
              const receivedData = await Promise.race([
                eventPromise,
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Event timeout')), 2000)
                ),
              ]);

              // Verify event data
              expect(receivedData).toBeDefined();
              expect(receivedData.id).toBe(taskId);
              expect(receivedData.title).toBe(testData.updatedTitle);
              expect(receivedData.status).toBe(testData.updatedStatus);
            } finally {
              client.close();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    // Feature: taskmgr-backend, Property 25: Task deletion emits event
    // Validates: Requirements 6.2
    it('should emit task:deleted event for any task deletion', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (taskTitle) => {
            // Create test user
            const user = await createTestUser(`test-${Date.now()}@example.com`);
            const userId = user._id.toString();

            // Create task
            const task = await createTask(userId, { title: taskTitle });
            const taskId = task._id.toString();

            // Create authenticated client
            const client = await createAuthenticatedClient(userId, user.email);

            try {
              // Set up event listener
              const eventPromise = new Promise<any>((resolve) => {
                client.on('task:deleted', (data) => {
                  resolve(data);
                });
              });

              // Delete task
              await deleteTask(taskId, userId);

              // Emit the event
              emitTaskDeleted(taskId);

              // Wait for event with timeout
              const receivedData = await Promise.race([
                eventPromise,
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Event timeout')), 2000)
                ),
              ]);

              // Verify event data
              expect(receivedData).toBeDefined();
              expect(receivedData.taskId).toBe(taskId);
            } finally {
              client.close();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    // Feature: taskmgr-backend, Property 38: Notification creation emits event
    // Validates: Requirements 10.5
    it('should emit notification:new event for any notification creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            type: fc.constantFrom('TASK_ASSIGNED', 'TASK_UPDATED', 'DEADLINE_APPROACHING', 'MENTION') as fc.Arbitrary<'TASK_ASSIGNED' | 'TASK_UPDATED' | 'DEADLINE_APPROACHING' | 'MENTION'>,
            title: fc.string({ minLength: 1, maxLength: 200 }),
            message: fc.string({ minLength: 1, maxLength: 500 }),
          }),
          async (notificationData) => {
            // Create test user
            const user = await createTestUser(`test-${Date.now()}@example.com`);
            const userId = user._id.toString();

            // Create authenticated client
            const client = await createAuthenticatedClient(userId, user.email);

            try {
              // Set up event listener
              const eventPromise = new Promise<any>((resolve) => {
                client.on('notification:new', (data) => {
                  resolve(data);
                });
              });

              // Create notification
              const notification = await createNotification({
                userId,
                type: notificationData.type,
                title: notificationData.title,
                message: notificationData.message,
              });

              // Emit the event
              emitNotification(notification);

              // Wait for event with timeout
              const receivedData = await Promise.race([
                eventPromise,
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Event timeout')), 2000)
                ),
              ]);

              // Verify event data
              expect(receivedData).toBeDefined();
              expect(receivedData.id).toBe(notification._id.toString());
              expect(receivedData.type).toBe(notificationData.type);
              expect(receivedData.title).toBe(notificationData.title);
              expect(receivedData.message).toBe(notificationData.message);
            } finally {
              client.close();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    // Feature: taskmgr-backend, Property 46: Task events emitted
    // Validates: Requirements 14.2
    it('should emit corresponding socket events for all task operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            updatedTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          }),
          async (testData) => {
            // Create test user
            const user = await createTestUser(`test-${Date.now()}@example.com`);
            const userId = user._id.toString();

            // Create authenticated client
            const client = await createAuthenticatedClient(userId, user.email);

            try {
              const eventsReceived: string[] = [];

              // Set up event listeners
              client.on('task:created', () => {
                eventsReceived.push('task:created');
              });

              client.on('task:updated', () => {
                eventsReceived.push('task:updated');
              });

              client.on('task:deleted', () => {
                eventsReceived.push('task:deleted');
              });

              // Create task
              const task = await createTask(userId, { title: testData.title });
              emitTaskCreated(task);
              await new Promise(resolve => setTimeout(resolve, 100));

              // Update task
              const taskId = task._id.toString();
              const updatedTask = await updateTask(taskId, userId, { title: testData.updatedTitle });
              emitTaskUpdated(updatedTask);
              await new Promise(resolve => setTimeout(resolve, 100));

              // Delete task
              await deleteTask(taskId, userId);
              emitTaskDeleted(taskId);
              await new Promise(resolve => setTimeout(resolve, 100));

              // Verify all events were emitted
              expect(eventsReceived).toContain('task:created');
              expect(eventsReceived).toContain('task:updated');
              expect(eventsReceived).toContain('task:deleted');
            } finally {
              client.close();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    // Feature: taskmgr-backend, Property 47: Notification events to specific user
    // Validates: Requirements 14.3
    it('should emit notification events only to the specific user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }),
            message: fc.string({ minLength: 1, maxLength: 500 }),
          }),
          async (notificationData) => {
            // Create two test users
            const user1 = await createTestUser(`test1-${Date.now()}@example.com`);
            const user2 = await createTestUser(`test2-${Date.now()}@example.com`);
            const userId1 = user1._id.toString();
            const userId2 = user2._id.toString();

            // Create authenticated clients for both users
            const client1 = await createAuthenticatedClient(userId1, user1.email);
            const client2 = await createAuthenticatedClient(userId2, user2.email);

            try {
              let user1ReceivedNotification = false;
              let user2ReceivedNotification = false;

              // Set up event listeners
              client1.on('notification:new', () => {
                user1ReceivedNotification = true;
              });

              client2.on('notification:new', () => {
                user2ReceivedNotification = true;
              });

              // Create notification for user1 only
              const notification = await createNotification({
                userId: userId1,
                type: 'TASK_ASSIGNED',
                title: notificationData.title,
                message: notificationData.message,
              });

              // Emit the event
              emitNotification(notification);

              // Wait for events to be processed
              await new Promise(resolve => setTimeout(resolve, 500));

              // Verify only user1 received the notification
              expect(user1ReceivedNotification).toBe(true);
              expect(user2ReceivedNotification).toBe(false);
            } finally {
              client1.close();
              client2.close();
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
