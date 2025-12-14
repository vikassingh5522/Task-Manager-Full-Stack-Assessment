import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validateProfileUpdate } from '../middleware/validation';

const router = Router();

/**
 * GET /api/users/profile
 * Get current user profile
 * Protected route
 */
router.get('/profile', authenticate, userController.getUserProfile);

/**
 * PUT /api/users/profile
 * Update current user profile
 * Protected route
 */
router.put('/profile', authenticate, validateProfileUpdate, userController.updateUserProfile);

export default router;
