import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordChange,
} from '../middleware/validation';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 * Public route
 */
router.post('/register', validateUserRegistration, authController.register);

/**
 * POST /api/auth/login
 * Login a user
 * Public route
 */
router.post('/login', validateUserLogin, authController.login);

/**
 * POST /api/auth/logout
 * Logout a user
 * Protected route
 */
router.post('/logout', authenticate, authController.logout);

/**
 * GET /api/auth/me
 * Get current user
 * Protected route
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * PUT /api/auth/change-password
 * Change user password
 * Protected route
 */
router.put('/change-password', authenticate, validatePasswordChange, authController.changePassword);

export default router;
