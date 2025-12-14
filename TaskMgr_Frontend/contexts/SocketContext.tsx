import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSWRConfig } from 'swr';
import { useAuth } from './AuthContext';
import { socketService } from '../services/socketService';
import { showInfo } from '../utils/toast';

interface SocketContextType {
  socketService: typeof socketService;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      if (token) {
        socketService.connect(token);
        socketService.joinRoom(user.id);
      }
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleTaskUpdate = () => {
      // Revalidate all task-related queries
      mutate((key: any) => typeof key === 'string' && key.startsWith('/tasks'));
    };

    const handleNewNotification = (data: any) => {
      mutate('/notifications');
      showInfo(data.message || 'You have a new update.');
    };

    // Attach listeners
    socketService.on('task:created', handleTaskUpdate);
    socketService.on('task:updated', handleTaskUpdate);
    socketService.on('task:deleted', handleTaskUpdate);
    socketService.on('task:assigned', () => {
        handleTaskUpdate();
        showInfo('A new task has been assigned to you!');
    });
    socketService.on('notification:new', handleNewNotification);

    return () => {
      socketService.off('task:created', handleTaskUpdate);
      socketService.off('task:updated', handleTaskUpdate);
      socketService.off('task:deleted', handleTaskUpdate);
      socketService.off('task:assigned', handleTaskUpdate);
      socketService.off('notification:new', handleNewNotification);
    };
  }, [isAuthenticated, mutate]);

  return (
    <SocketContext.Provider value={{ socketService }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};