import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { X, Circle } from 'lucide-react';
import { Notification } from '../../types/notification.types';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRead, onDelete }) => {
  return (
    <div 
      className={`relative p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        !notification.read ? 'bg-blue-50/50' : 'bg-white'
      }`}
      onClick={() => !notification.read && onRead(notification.id)}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {!notification.read && (
              <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />
            )}
            <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
              {notification.title}
            </p>
          </div>
          <p className="text-xs text-gray-600 mb-1">{notification.message}</p>
          <p className="text-[10px] text-gray-400">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
          title="Delete notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};