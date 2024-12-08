// src/components/NotificationMenu.tsx
'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Notification {
  id: string;
  message: string;
  type: 'CHECK_IN' | 'PICK_UP';
  read: boolean;
  timestamp: string;
}

interface NotificationMenuProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

type FilterType = 'all' | 'CHECK_IN' | 'PICK_UP';

export const NotificationMenu: React.FC<NotificationMenuProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const checkInCount = notifications.filter(n => n.type === 'CHECK_IN').length;
  const pickUpCount = notifications.filter(n => n.type === 'PICK_UP').length;

  const getFilteredNotifications = () => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter(n => n.type === activeFilter);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className="relative cursor-pointer">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex space-x-2">
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
              <button
                onClick={onClearAll}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full text-xs ${
                activeFilter === 'all'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('CHECK_IN')}
              className={`px-3 py-1 rounded-full text-xs ${
                activeFilter === 'CHECK_IN'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Check-ins ({checkInCount})
            </button>
            <button
              onClick={() => setActiveFilter('PICK_UP')}
              className={`px-3 py-1 rounded-full text-xs ${
                activeFilter === 'PICK_UP'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Pick-ups ({pickUpCount})
            </button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {getFilteredNotifications().length > 0 ? (
            getFilteredNotifications().map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b hover:bg-gray-50 ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${
                        notification.type === 'CHECK_IN' 
                          ? 'text-green-600' 
                          : 'text-purple-600'
                      }`}>
                        {notification.type === 'CHECK_IN' ? 'New Check-in' : 'Pick-up'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {notification.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notification.id);
                      }}
                      className="ml-2 p-1 hover:bg-gray-100 rounded"
                    >
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No notifications found
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};