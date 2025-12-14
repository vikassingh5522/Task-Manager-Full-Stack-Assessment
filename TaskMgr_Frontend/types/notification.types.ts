export type NotificationType = 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'DEADLINE_APPROACHING' | 'MENTION';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  resourceId?: string;
  resourceType?: 'TASK' | 'COMMENT';
  createdAt: string;
}