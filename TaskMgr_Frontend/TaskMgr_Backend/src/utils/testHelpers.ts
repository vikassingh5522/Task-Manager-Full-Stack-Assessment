import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { Task, ITask } from '../models/Task';
import { Notification, INotification } from '../models/Notification';
import { hashPassword } from './password';
import { generateToken } from './jwt';

/**
 * Test Database Connection and Cleanup Functions
 */

/**
 * Connect to test database
 */
export async function connectTestDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/taskmgr-test';
  await mongoose.connect(mongoUri);
}

/**
 * Disconnect from test database
 */
export async function disconnectTestDatabase(): Promise<void> {
  await mongoose.connection.close();
}

/**
 * Clear all collections in the test database
 */
export async function clearTestDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Clear specific collection
 */
export async function clearCollection(collectionName: 'users' | 'tasks' | 'notifications'): Promise<void> {
  switch (collectionName) {
    case 'users':
      await User.deleteMany({});
      break;
    case 'tasks':
      await Task.deleteMany({});
      break;
    case 'notifications':
      await Notification.deleteMany({});
      break;
  }
}

/**
 * Test User Factory
 */

export interface CreateTestUserOptions {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'ADMIN' | 'USER';
  avatarUrl?: string;
  bio?: string;
  phoneNumber?: string;
}

/**
 * Create a test user with default or custom values
 */
export async function createTestUser(options: CreateTestUserOptions = {}): Promise<IUser> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  
  const hashedPassword = await hashPassword(options.password || 'testpassword123');
  
  const user = await User.create({
    email: options.email || `user-${timestamp}-${random}@example.com`,
    password: hashedPassword,
    firstName: options.firstName || 'Test',
    lastName: options.lastName || 'User',
    role: options.role || 'USER',
    ...(options.avatarUrl && { avatarUrl: options.avatarUrl }),
    ...(options.bio && { bio: options.bio }),
    ...(options.phoneNumber && { phoneNumber: options.phoneNumber }),
  });
  
  return user;
}

/**
 * Create multiple test users
 */
export async function createTestUsers(count: number, options: CreateTestUserOptions = {}): Promise<IUser[]> {
  const users: IUser[] = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      ...options,
      email: options.email ? `${i}-${options.email}` : undefined,
    });
    users.push(user);
  }
  return users;
}

/**
 * Test Task Factory
 */

export interface CreateTestTaskOptions {
  title?: string;
  description?: string;
  dueDate?: Date;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  creatorId: string;
  assignedToId?: string;
}

/**
 * Create a test task with default or custom values
 */
export async function createTestTask(options: CreateTestTaskOptions): Promise<ITask> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  
  const task = await Task.create({
    title: options.title || `Test Task ${timestamp}-${random}`,
    description: options.description,
    dueDate: options.dueDate,
    priority: options.priority || 'MEDIUM',
    status: options.status || 'TODO',
    creatorId: options.creatorId,
    assignedToId: options.assignedToId,
  });
  
  return task;
}

/**
 * Create multiple test tasks
 */
export async function createTestTasks(count: number, options: CreateTestTaskOptions): Promise<ITask[]> {
  const tasks: ITask[] = [];
  for (let i = 0; i < count; i++) {
    const task = await createTestTask({
      ...options,
      title: options.title ? `${i}-${options.title}` : undefined,
    });
    tasks.push(task);
  }
  return tasks;
}

/**
 * Test Notification Factory
 */

export interface CreateTestNotificationOptions {
  userId: string;
  type?: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'DEADLINE_APPROACHING' | 'MENTION';
  title?: string;
  message?: string;
  read?: boolean;
  resourceId?: string;
  resourceType?: 'TASK' | 'COMMENT';
}

/**
 * Create a test notification with default or custom values
 */
export async function createTestNotification(options: CreateTestNotificationOptions): Promise<INotification> {
  const timestamp = Date.now();
  
  const notification = await Notification.create({
    userId: options.userId,
    type: options.type || 'TASK_ASSIGNED',
    title: options.title || `Test Notification ${timestamp}`,
    message: options.message || 'This is a test notification',
    read: options.read || false,
    resourceId: options.resourceId,
    resourceType: options.resourceType,
  });
  
  return notification;
}

/**
 * Create multiple test notifications
 */
export async function createTestNotifications(
  count: number,
  options: CreateTestNotificationOptions
): Promise<INotification[]> {
  const notifications: INotification[] = [];
  for (let i = 0; i < count; i++) {
    const notification = await createTestNotification({
      ...options,
      title: options.title ? `${i}-${options.title}` : undefined,
    });
    notifications.push(notification);
  }
  return notifications;
}

/**
 * Test Authentication Helper
 */

/**
 * Generate a JWT token for a test user
 */
export function generateTestToken(user: IUser): string {
  return generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });
}

/**
 * Create a test user and generate a token for them
 */
export async function createTestUserWithToken(
  options: CreateTestUserOptions = {}
): Promise<{ user: IUser; token: string }> {
  const user = await createTestUser(options);
  const token = generateTestToken(user);
  return { user, token };
}

/**
 * Test Data Generators for Property-Based Testing
 */

/**
 * Generate a random valid email
 */
export function generateRandomEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Generate a random valid password
 */
export function generateRandomPassword(): string {
  const length = 8 + Math.floor(Math.random() * 8); // 8-16 characters
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Ensure it has at least one letter and one number
  if (!/[a-zA-Z]/.test(password)) {
    password = 'a' + password.substring(1);
  }
  if (!/\d/.test(password)) {
    password = password.substring(0, password.length - 1) + '1';
  }
  return password;
}

/**
 * Generate a random task title
 */
export function generateRandomTaskTitle(): string {
  const adjectives = ['Important', 'Urgent', 'Critical', 'Simple', 'Complex'];
  const nouns = ['Task', 'Project', 'Assignment', 'Work', 'Job'];
  const timestamp = Date.now();
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
    nouns[Math.floor(Math.random() * nouns.length)]
  } ${timestamp}`;
}
