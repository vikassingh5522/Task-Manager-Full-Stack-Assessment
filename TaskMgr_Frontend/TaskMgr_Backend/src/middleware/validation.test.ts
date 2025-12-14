import request from 'supertest';
import express, { Express, Request, Response } from 'express';
import fc from 'fast-check';
import {
  validateUserRegistration,
  validateUserLogin,
  validateTaskCreation
} from './validation';
import { describe, it, beforeEach } from '@jest/globals';

// Create a test Express app
function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  
  // Test route for user registration
  app.post('/test/register', validateUserRegistration, (req: Request, res: Response) => {
    res.status(200).json({ success: true, data: req.body });
  });
  
  // Test route for user login
  app.post('/test/login', validateUserLogin, (req: Request, res: Response) => {
    res.status(200).json({ success: true, data: req.body });
  });
  
  // Test route for task creation
  app.post('/test/task', validateTaskCreation, (req: Request, res: Response) => {
    res.status(200).json({ success: true, data: req.body });
  });
  
  // Generic test route for custom validation chains
  app.post('/test/custom', (req: Request, res: Response) => {
    res.status(200).json({ success: true, data: req.body });
  });
  
  return app;
}

describe('Validation Middleware Property Tests', () => {
  let app: Express;
  
  beforeEach(() => {
    app = createTestApp();
  });
  
  // Feature: taskmgr-backend, Property 54: Request body validation
  describe('Property 54: Request body validation', () => {
    it('should validate request body against defined schema for any valid input', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }).filter(pwd => 
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwd)
            ),
            firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
          }),
          async (validData) => {
            const response = await request(app)
              .post('/test/register')
              .send(validData);
            
            // Valid data should pass validation
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should validate task creation request body for any valid task data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => {
              const trimmed = s.trim();
              return trimmed.length > 0 && trimmed.length <= 200;
            }),
            description: fc.option(fc.string({ maxLength: 1000 })),
            priority: fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
            status: fc.constantFrom('TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'),
            dueDate: fc.option(
              fc.date({ min: new Date('1900-01-01'), max: new Date('2100-12-31') })
                .map(d => d.toISOString())
            )
          }),
          async (validTaskData) => {
            const response = await request(app)
              .post('/test/task')
              .send(validTaskData);
            
            // Valid task data should pass validation
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // Feature: taskmgr-backend, Property 55: Missing fields error messages
  describe('Property 55: Missing fields error messages', () => {
    it('should return error listing all missing required fields for any subset of required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            includeEmail: fc.boolean(),
            includePassword: fc.boolean(),
            includeFirstName: fc.boolean(),
            includeLastName: fc.boolean()
          }).filter(config => 
            // At least one field should be missing
            !config.includeEmail || !config.includePassword || 
            !config.includeFirstName || !config.includeLastName
          ),
          async (config) => {
            const data: any = {};
            
            if (config.includeEmail) data.email = 'test@example.com';
            if (config.includePassword) data.password = 'ValidPass123';
            if (config.includeFirstName) data.firstName = 'John';
            if (config.includeLastName) data.lastName = 'Doe';
            
            const response = await request(app)
              .post('/test/register')
              .send(data);
            
            // Should return 400 validation error
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
            expect(response.body.errors).toBeDefined();
            
            // Check that error messages exist for missing fields
            if (!config.includeEmail) {
              expect(response.body.errors.email).toBeDefined();
              expect(response.body.errors.email.length).toBeGreaterThan(0);
            }
            if (!config.includePassword) {
              expect(response.body.errors.password).toBeDefined();
              expect(response.body.errors.password.length).toBeGreaterThan(0);
            }
            if (!config.includeFirstName) {
              expect(response.body.errors.firstName).toBeDefined();
              expect(response.body.errors.firstName.length).toBeGreaterThan(0);
            }
            if (!config.includeLastName) {
              expect(response.body.errors.lastName).toBeDefined();
              expect(response.body.errors.lastName.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should list missing title field for task creation', async () => {
      const response = await request(app)
        .post('/test/task')
        .send({ description: 'Some description' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.title).toBeDefined();
      expect(response.body.errors.title).toContain('Title is required');
    });
  });
  
  // Feature: taskmgr-backend, Property 56: Invalid field error descriptions
  describe('Property 56: Invalid field error descriptions', () => {
    it('should describe what is invalid about email field for any invalid email', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter(s => {
            // Generate strings that are NOT valid emails
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return !emailRegex.test(s) && s.length > 0;
          }),
          async (invalidEmail) => {
            const response = await request(app)
              .post('/test/register')
              .send({
                email: invalidEmail,
                password: 'ValidPass123',
                firstName: 'John',
                lastName: 'Doe'
              });
            
            // Should return 400 validation error
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
            expect(response.body.errors.email).toBeDefined();
            
            // Error message should describe the issue
            const errorMessages = response.body.errors.email.join(' ');
            expect(errorMessages.toLowerCase()).toMatch(/email|valid/);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should describe what is invalid about password field for any weak password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 7 }), // Too short
          async (weakPassword) => {
            const response = await request(app)
              .post('/test/register')
              .send({
                email: 'test@example.com',
                password: weakPassword,
                firstName: 'John',
                lastName: 'Doe'
              });
            
            // Should return 400 validation error
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
            expect(response.body.errors.password).toBeDefined();
            
            // Error message should describe the issue
            const errorMessages = response.body.errors.password.join(' ');
            expect(errorMessages.toLowerCase()).toMatch(/password|character|8/);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should describe what is invalid about priority field for any invalid priority', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter(s => !['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(s)),
          async (invalidPriority) => {
            const response = await request(app)
              .post('/test/task')
              .send({
                title: 'Test Task',
                priority: invalidPriority
              });
            
            // Should return 400 validation error
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
            expect(response.body.errors.priority).toBeDefined();
            
            // Error message should describe valid options
            const errorMessages = response.body.errors.priority.join(' ');
            expect(errorMessages).toMatch(/LOW|MEDIUM|HIGH|URGENT/);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should describe what is invalid about status field for any invalid status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter(s => !['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'].includes(s)),
          async (invalidStatus) => {
            const response = await request(app)
              .post('/test/task')
              .send({
                title: 'Test Task',
                status: invalidStatus
              });
            
            // Should return 400 validation error
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
            expect(response.body.errors.status).toBeDefined();
            
            // Error message should describe valid options
            const errorMessages = response.body.errors.status.join(' ');
            expect(errorMessages).toMatch(/TODO|IN_PROGRESS|REVIEW|COMPLETED/);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should describe what is invalid about title length for any oversized title', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 201, maxLength: 500 }).filter(s => s.trim().length > 200),
          async (longTitle) => {
            const response = await request(app)
              .post('/test/task')
              .send({
                title: longTitle
              });
            
            // Should return 400 validation error
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
            expect(response.body.errors.title).toBeDefined();
            
            // Error message should describe the length constraint
            const errorMessages = response.body.errors.title.join(' ');
            expect(errorMessages.toLowerCase()).toMatch(/character|200|length/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
