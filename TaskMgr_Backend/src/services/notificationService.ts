import { Notification, INotification } from '../models/Notification';
import { AuthorizationError, NotFoundError } from '../middleware/errors';
import mongoose from 'mongoose';
import * as socketService from './socketService';

/**
 * Notification creation data interface
 */
export interface CreateNotificationData {
  userId: string;
  type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'DEADLINE_APPROACHING' | 'MENTION';
  title: string;
  message: string;
  resourceId?: string;
  resourceType?: 'TASK' | 'COMMENT';
}

/**
 * Create a new notification
 * @param data Notification creation data
 * @returns Created notification
 */
export async function createNotification(data: CreateNotificationData): Promise<INotification> {
  const { userId, type, title, message, resourceId, resourceType } = data;

  // Create notification data
  const notificationData: any = {
    userId: new mongoose.Types.ObjectId(userId),
    type,
    title,
    message,
    read: false,
  };

  // Add optional fields if provided
  if (resourceId !== undefined) {
    notificationData.resourceId = new mongoose.Types.ObjectId(resourceId);
  }
  if (resourceType !== undefined) {
    notificationData.resourceType = resourceType;
  }

  // Create notification
  const notification = await Notification.create(notificationData);

  // Emit socket event to specific user
  socketService.emitNotification(notification);

  return notification;
}

/**
 * Get notifications for a user
 * @param userId User ID
 * @returns Notifications ordered by creation date (newest first)
 */
export async function getNotifications(userId: string): Promise<INotification[]> {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Find notifications for user, ordered by createdAt descending
  const notifications = await Notification.find({ userId: userObjectId })
    .sort({ createdAt: -1 });

  return notifications;
}

/**
 * Mark a notification as read with access control
 * @param notificationId Notification ID
 * @param userId Current user ID
 * @returns Updated notification
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<INotification> {
  // Validate notification ID format
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new NotFoundError('Notification not found');
  }

  // Find notification
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  // Check access control - user must own the notification
  const userObjectId = new mongoose.Types.ObjectId(userId);
  if (!notification.userId.equals(userObjectId)) {
    throw new AuthorizationError('You do not have access to this notification');
  }

  // Update read status
  notification.read = true;
  await notification.save();

  return notification;
}

/**
 * Mark all notifications as read for a user
 * @param userId User ID
 * @returns Number of notifications updated
 */
export async function markAllAsRead(userId: string): Promise<{ count: number }> {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Update all unread notifications for user
  const result = await Notification.updateMany(
    { userId: userObjectId, read: false },
    { $set: { read: true } }
  );

  return {
    count: result.modifiedCount,
  };
}

/**
 * Delete a notification with access control
 * @param notificationId Notification ID
 * @param userId Current user ID
 * @returns Success message
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<{ message: string }> {
  // Validate notification ID format
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new NotFoundError('Notification not found');
  }

  // Find notification
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  // Check access control - user must own the notification
  const userObjectId = new mongoose.Types.ObjectId(userId);
  if (!notification.userId.equals(userObjectId)) {
    throw new AuthorizationError('You do not have access to delete this notification');
  }

  // Delete notification
  await Notification.findByIdAndDelete(notificationId);

  return {
    message: 'Notification deleted successfully',
  };
}
