import useSWR, { useSWRConfig } from 'swr';
import { notificationService } from '../services/notificationService';
import { showSuccess, showError } from '../utils/toast';

const NOTIFICATIONS_KEY = '/notifications';

export const useNotifications = () => {
  const { data, error, isLoading, mutate } = useSWR(
    NOTIFICATIONS_KEY,
    notificationService.getNotifications
  );

  const { mutate: globalMutate } = useSWRConfig();

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      await mutate(
        (notifications) => 
          notifications?.map(n => n.id === id ? { ...n, read: true } : n),
        { revalidate: false }
      );
      
      await notificationService.markAsRead(id);
      globalMutate(NOTIFICATIONS_KEY);
    } catch (error) {
      console.error('Failed to mark notification as read', error);
      mutate(); // Revert
    }
  };

  const markAllAsRead = async () => {
    try {
      await mutate(
        (notifications) => notifications?.map(n => ({ ...n, read: true })),
        { revalidate: false }
      );
      
      await notificationService.markAllAsRead();
      globalMutate(NOTIFICATIONS_KEY);
      showSuccess('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read', error);
      mutate();
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await mutate(
        (notifications) => notifications?.filter(n => n.id !== id),
        { revalidate: false }
      );
      
      await notificationService.deleteNotification(id);
      globalMutate(NOTIFICATIONS_KEY);
      showSuccess('Notification removed');
    } catch (error) {
      console.error('Failed to delete notification', error);
      mutate();
    }
  };

  const unreadCount = data?.filter(n => !n.read).length || 0;

  return {
    notifications: data || [],
    unreadCount,
    isLoading,
    isError: error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};