import { getIO } from '../socket';
import { ITask } from '../models/Task';
import { INotification } from '../models/Notification';

/**
 * Socket service for emitting real-time events to connected clients
 * Handles task and notification events
 */

/**
 * Emit task created event to all connected clients
 * @param task - The created task
 */
export function emitTaskCreated(task: ITask): void {
  const io = getIO();
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit task:created event');
    return;
  }

  // Convert task to JSON to ensure proper formatting
  const taskData = task.toJSON();
  
  // Emit to all connected clients
  io.emit('task:created', taskData);
  console.log(`Emitted task:created event for task ${taskData.id}`);
}

/**
 * Emit task updated event to all connected clients
 * @param task - The updated task
 */
export function emitTaskUpdated(task: ITask): void {
  const io = getIO();
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit task:updated event');
    return;
  }

  // Convert task to JSON to ensure proper formatting
  const taskData = task.toJSON();
  
  // Emit to all connected clients
  io.emit('task:updated', taskData);
  console.log(`Emitted task:updated event for task ${taskData.id}`);
}

/**
 * Emit task deleted event to all connected clients
 * @param taskId - The ID of the deleted task
 */
export function emitTaskDeleted(taskId: string): void {
  const io = getIO();
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit task:deleted event');
    return;
  }

  // Emit to all connected clients with just the task ID
  io.emit('task:deleted', { taskId });
  console.log(`Emitted task:deleted event for task ${taskId}`);
}

/**
 * Emit notification event to a specific user
 * @param notification - The notification to emit
 */
export function emitNotification(notification: INotification): void {
  const io = getIO();
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit notification:new event');
    return;
  }

  // Convert notification to JSON to ensure proper formatting
  const notificationData = notification.toJSON();
  
  // Get the user ID as a string
  const userId = notification.userId.toString();
  
  // Emit to specific user's room
  // Users should join a room with their userId when they connect
  io.to(userId).emit('notification:new', notificationData);
  console.log(`Emitted notification:new event to user ${userId}`);
}
