import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { validateObjectId, handleValidationErrors } from '../middleware/validation';

const router = Router();

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the current user
 * Protected route
 * Note: This must come before /notifications/:id/read to avoid route conflicts
 */
router.put('/read-all', authenticate, notificationController.markAllAsRead);

/**
 * GET /api/notifications
 * Get all notifications for the current user
 * Protected route
 */
router.get('/', authenticate, notificationController.getNotifications);

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 * Protected route
 */
router.put(
  '/:id/read',
  authenticate,
  [validateObjectId('id'), handleValidationErrors],
  notificationController.markAsRead
);

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 * Protected route
 */
router.delete(
  '/:id',
  authenticate,
  [validateObjectId('id'), handleValidationErrors],
  notificationController.deleteNotification
);

export default router;
