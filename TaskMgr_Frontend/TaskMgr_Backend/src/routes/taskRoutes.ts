import { Router } from 'express';
import * as taskController from '../controllers/taskController';
import { authenticate } from '../middleware/auth';
import {
  validateTaskCreation,
  validateTaskUpdate,
  validateObjectId,
  validatePagination,
  handleValidationErrors,
} from '../middleware/validation';
import { query } from 'express-validator';

const router = Router();

/**
 * GET /api/tasks/assigned
 * Get tasks assigned to the current user
 * Protected route
 * Note: This must come before /tasks/:id to avoid route conflicts
 */
router.get('/assigned', authenticate, taskController.getAssignedTasks);

/**
 * GET /api/tasks/created
 * Get tasks created by the current user
 * Protected route
 */
router.get('/created', authenticate, taskController.getCreatedTasks);

/**
 * GET /api/tasks/overdue
 * Get overdue tasks for the current user
 * Protected route
 */
router.get('/overdue', authenticate, taskController.getOverdueTasks);

/**
 * GET /api/tasks
 * Get all tasks with filtering and pagination
 * Protected route
 */
router.get(
  '/',
  authenticate,
  [
    ...validatePagination(),
    query('status')
      .optional()
      .isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'])
      .withMessage('Status must be one of: TODO, IN_PROGRESS, REVIEW, COMPLETED'),
    query('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Priority must be one of: LOW, MEDIUM, HIGH, URGENT'),
    query('search')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Search query must not exceed 200 characters'),
    handleValidationErrors,
  ],
  taskController.getTasks
);

/**
 * GET /api/tasks/:id
 * Get a single task by ID
 * Protected route
 */
router.get(
  '/:id',
  authenticate,
  [validateObjectId('id'), handleValidationErrors],
  taskController.getTaskById
);

/**
 * POST /api/tasks
 * Create a new task
 * Protected route
 */
router.post('/', authenticate, validateTaskCreation, taskController.createTask);

/**
 * PUT /api/tasks/:id
 * Update a task
 * Protected route
 */
router.put(
  '/:id',
  authenticate,
  [validateObjectId('id'), ...validateTaskUpdate],
  taskController.updateTask
);

/**
 * DELETE /api/tasks/:id
 * Delete a task
 * Protected route
 */
router.delete(
  '/:id',
  authenticate,
  [validateObjectId('id'), handleValidationErrors],
  taskController.deleteTask
);

export default router;
