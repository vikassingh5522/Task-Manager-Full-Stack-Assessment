/**
 * Seed Script for Development and Manual Testing
 * 
 * This script populates the database with sample users and tasks
 * for development and manual testing purposes.
 * 
 * Usage:
 *   npm run seed
 *   or
 *   ts-node src/scripts/seed.ts
 */

import { config } from '../config/env';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { Notification } from '../models/Notification';
import { hashPassword } from '../utils/password';

/**
 * Sample user data
 */
const sampleUsers = [
  {
    email: 'admin@taskmgr.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN' as const,
    bio: 'System administrator with full access',
    phoneNumber: '+1-555-0100',
  },
  {
    email: 'john.doe@taskmgr.com',
    password: 'John123!',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER' as const,
    bio: 'Senior developer passionate about clean code',
    phoneNumber: '+1-555-0101',
  },
  {
    email: 'jane.smith@taskmgr.com',
    password: 'Jane123!',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'USER' as const,
    bio: 'Project manager focused on team productivity',
    phoneNumber: '+1-555-0102',
  },
  {
    email: 'bob.wilson@taskmgr.com',
    password: 'Bob123!',
    firstName: 'Bob',
    lastName: 'Wilson',
    role: 'USER' as const,
    bio: 'UX designer creating beautiful interfaces',
    phoneNumber: '+1-555-0103',
  },
  {
    email: 'alice.johnson@taskmgr.com',
    password: 'Alice123!',
    firstName: 'Alice',
    lastName: 'Johnson',
    role: 'USER' as const,
    bio: 'QA engineer ensuring quality',
    phoneNumber: '+1-555-0104',
  },
];

/**
 * Sample task templates
 */
const taskTemplates = [
  {
    title: 'Implement user authentication',
    description: 'Add JWT-based authentication to the API with login and registration endpoints',
    priority: 'HIGH' as const,
    status: 'COMPLETED' as const,
  },
  {
    title: 'Design database schema',
    description: 'Create MongoDB schemas for users, tasks, and notifications',
    priority: 'HIGH' as const,
    status: 'COMPLETED' as const,
  },
  {
    title: 'Set up CI/CD pipeline',
    description: 'Configure automated testing and deployment pipeline',
    priority: 'MEDIUM' as const,
    status: 'IN_PROGRESS' as const,
  },
  {
    title: 'Write API documentation',
    description: 'Document all API endpoints with request/response examples',
    priority: 'MEDIUM' as const,
    status: 'TODO' as const,
  },
  {
    title: 'Implement real-time notifications',
    description: 'Add Socket.IO for real-time task updates and notifications',
    priority: 'HIGH' as const,
    status: 'REVIEW' as const,
  },
  {
    title: 'Add input validation',
    description: 'Implement comprehensive validation for all API endpoints',
    priority: 'HIGH' as const,
    status: 'COMPLETED' as const,
  },
  {
    title: 'Optimize database queries',
    description: 'Add indexes and optimize slow queries for better performance',
    priority: 'MEDIUM' as const,
    status: 'TODO' as const,
  },
  {
    title: 'Implement task filtering',
    description: 'Add filtering by status, priority, and search functionality',
    priority: 'MEDIUM' as const,
    status: 'IN_PROGRESS' as const,
  },
  {
    title: 'Add unit tests',
    description: 'Write comprehensive unit tests for all services',
    priority: 'HIGH' as const,
    status: 'IN_PROGRESS' as const,
  },
  {
    title: 'Security audit',
    description: 'Review and fix security vulnerabilities',
    priority: 'URGENT' as const,
    status: 'TODO' as const,
  },
  {
    title: 'Update dependencies',
    description: 'Update all npm packages to latest stable versions',
    priority: 'LOW' as const,
    status: 'TODO' as const,
  },
  {
    title: 'Implement rate limiting',
    description: 'Add rate limiting to prevent API abuse',
    priority: 'MEDIUM' as const,
    status: 'TODO' as const,
  },
  {
    title: 'Add logging system',
    description: 'Implement structured logging with Winston',
    priority: 'LOW' as const,
    status: 'TODO' as const,
  },
  {
    title: 'Create user profile page',
    description: 'Build frontend page for viewing and editing user profiles',
    priority: 'MEDIUM' as const,
    status: 'REVIEW' as const,
  },
  {
    title: 'Fix overdue task notifications',
    description: 'Bug: Overdue notifications not being sent correctly',
    priority: 'URGENT' as const,
    status: 'TODO' as const,
  },
];

/**
 * Clear existing data from database
 */
async function clearDatabase(): Promise<void> {
  console.log('Clearing existing data...');
  await User.deleteMany({});
  await Task.deleteMany({});
  await Notification.deleteMany({});
  console.log('✓ Database cleared');
}

/**
 * Seed users into database
 */
async function seedUsers(): Promise<Map<string, string>> {
  console.log('\nSeeding users...');
  const userIdMap = new Map<string, string>();

  for (const userData of sampleUsers) {
    const hashedPassword = await hashPassword(userData.password);
    const user = await User.create({
      ...userData,
      password: hashedPassword,
    });
    
    userIdMap.set(userData.email, user._id.toString());
    console.log(`  ✓ Created user: ${userData.firstName} ${userData.lastName} (${userData.email})`);
  }

  console.log(`✓ Created ${sampleUsers.length} users`);
  return userIdMap;
}

/**
 * Seed tasks into database
 */
async function seedTasks(userIdMap: Map<string, string>): Promise<void> {
  console.log('\nSeeding tasks...');
  
  const userEmails = Array.from(userIdMap.keys());
  const tasks = [];

  // Create tasks with various assignments
  for (let i = 0; i < taskTemplates.length; i++) {
    const template = taskTemplates[i];
    
    // Assign creator (rotate through users)
    const creatorEmail = userEmails[i % userEmails.length];
    const creatorId = userIdMap.get(creatorEmail)!;
    
    // Randomly assign some tasks to other users
    let assignedToId: string | undefined;
    if (Math.random() > 0.3) { // 70% chance of being assigned
      const assigneeEmail = userEmails[(i + 1) % userEmails.length];
      assignedToId = userIdMap.get(assigneeEmail);
    }
    
    // Set due dates
    let dueDate: Date | undefined;
    if (Math.random() > 0.2) { // 80% chance of having a due date
      const daysOffset = Math.floor(Math.random() * 30) - 10; // -10 to +20 days
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysOffset);
    }
    
    const task = await Task.create({
      ...template,
      creatorId,
      assignedToId,
      dueDate,
    });
    
    tasks.push(task);
    
    const assigneeInfo = assignedToId 
      ? ` → assigned to ${userEmails.find(e => userIdMap.get(e) === assignedToId)}`
      : ' (unassigned)';
    console.log(`  ✓ Created task: ${template.title}${assigneeInfo}`);
  }

  console.log(`✓ Created ${tasks.length} tasks`);
}

/**
 * Seed notifications into database
 */
async function seedNotifications(userIdMap: Map<string, string>): Promise<void> {
  console.log('\nSeeding notifications...');
  
  const userEmails = Array.from(userIdMap.keys());
  const notifications = [];

  // Get some tasks to reference
  const tasks = await Task.find().limit(5);
  
  // Create sample notifications for each user
  for (const email of userEmails) {
    const userId = userIdMap.get(email)!;
    
    // Task assigned notification
    if (tasks[0]) {
      notifications.push(await Notification.create({
        userId,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `You have been assigned to: ${tasks[0].title}`,
        read: Math.random() > 0.5,
        resourceId: tasks[0]._id,
        resourceType: 'TASK',
      }));
    }
    
    // Task updated notification
    if (tasks[1]) {
      notifications.push(await Notification.create({
        userId,
        type: 'TASK_UPDATED',
        title: 'Task Updated',
        message: `Task "${tasks[1].title}" has been updated`,
        read: Math.random() > 0.5,
        resourceId: tasks[1]._id,
        resourceType: 'TASK',
      }));
    }
    
    // Deadline approaching notification
    if (tasks[2]) {
      notifications.push(await Notification.create({
        userId,
        type: 'DEADLINE_APPROACHING',
        title: 'Deadline Approaching',
        message: `Task "${tasks[2].title}" is due soon`,
        read: false,
        resourceId: tasks[2]._id,
        resourceType: 'TASK',
      }));
    }
  }

  console.log(`✓ Created ${notifications.length} notifications`);
}

/**
 * Main seed function
 */
async function seed(): Promise<void> {
  try {
    console.log('=================================');
    console.log('TaskMgr Database Seeding Script');
    console.log('=================================\n');
    
    // Connect to database
    console.log('Connecting to database...');
    await connectDatabase(config.mongodbUri);
    console.log('✓ Connected to database\n');
    
    // Clear existing data
    await clearDatabase();
    
    // Seed data
    const userIdMap = await seedUsers();
    await seedTasks(userIdMap);
    await seedNotifications(userIdMap);
    
    // Summary
    console.log('\n=================================');
    console.log('Seeding completed successfully!');
    console.log('=================================\n');
    
    console.log('Sample login credentials:');
    console.log('-------------------------');
    for (const user of sampleUsers) {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}\n`);
    }
    
    // Disconnect
    await disconnectDatabase();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed();
}

export { seed };
