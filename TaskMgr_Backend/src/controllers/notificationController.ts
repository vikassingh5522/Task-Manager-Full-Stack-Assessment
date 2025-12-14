import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notificationService';

/**
 * Get notifications for the current user
 * GET /api/notifications
 */
export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // User ID is attached to request by authentication middleware
    const userId = req.user!.userId;

    const notifications = await notificationService.getNotifications(userId);

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a notification as read
 * PUT /api/notifications/:id/read
 */
export async function markAsRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // User ID is attached to request by authentication middleware
    const userId = req.user!.userId;
    const notificationId = req.params.id;

    const notification = await notificationService.markAsRead(notificationId, userId);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all notifications as read for the current user
 * PUT /api/notifications/read-all
 */
export async function markAllAsRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // User ID is attached to request by authentication middleware
    const userId = req.user!.userId;

    const result = await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: `${result.count} notification(s) marked as read`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
export async function deleteNotification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // User ID is attached to request by authentication middleware
    const userId = req.user!.userId;
    const notificationId = req.params.id;

    const result = await notificationService.deleteNotification(notificationId, userId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}
