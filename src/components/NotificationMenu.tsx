'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Loader2, Trash2, Check, BellRing } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Notification {
  id: string;
  message: string;
  type: 'CHECK_IN' | 'PICK_UP';
  read: boolean;
  timestamp: string;
  childId: string;
  child: {
    name: string;
  };
  parentId: string;
  parent: {
    name: string;
  };
}

interface NotificationMenuProps {
  className?: string;
}

type FilterType = 'all' | 'CHECK_IN' | 'PICK_UP';

export const NotificationMenu: React.FC<NotificationMenuProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  useEffect(() => {
    // Initial fetch of notifications
    fetchNotifications();

    // Set up SSE for real-time updates
    const sse = new EventSource('/api/notifications/sse');
    
    sse.onmessage = (event) => {
      try {
        const newNotifications = JSON.parse(event.data);
        setNotifications(newNotifications);
        
        // Show toast for new unread notifications
        const unreadNotifications = newNotifications.filter((n: Notification) => !n.read);
        if (unreadNotifications.length > 0) {
          const latestNotification = unreadNotifications[0];
          toast.info(latestNotification.message, {
            description: new Date(latestNotification.timestamp).toLocaleTimeString(),
          });
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    sse.onerror = (error) => {
      console.error('SSE error:', error);
      setError('Failed to connect to notification service');
      sse.close();
    };

    setEventSource(sse);

    return () => {
      sse.close();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data);
      setError(null);
    } catch (error) {
      setError('Failed to load notifications');
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to update notification');

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));

      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });

      if (!response.ok) throw new Error('Failed to update notifications');

      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
      console.error('Error marking all as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to clear notifications');

      setNotifications([]);
      setIsOpen(false);
      toast.success('All notifications cleared');
    } catch (error) {
      toast.error('Failed to clear notifications');
      console.error('Error clearing notifications:', error);
    }
  };

  const getFilteredNotifications = () => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter(n => n.type === activeFilter);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const checkInCount = notifications.filter(n => n.type === 'CHECK_IN').length;
  const pickUpCount = notifications.filter(n => n.type === 'PICK_UP').length;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`relative ${className}`}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 animate-bounce" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-blue-600 hover:text-blue-800"
                disabled={notifications.length === 0 || loading}
              >
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-red-600 hover:text-red-800"
                disabled={notifications.length === 0 || loading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            </div>
          </div>

          <div className="flex space-x-2">
            {['all', 'CHECK_IN', 'PICK_UP'].map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(filter as FilterType)}
                className="rounded-full"
              >
                {filter === 'all' 
                  ? `All (${notifications.length})`
                  : filter === 'CHECK_IN'
                    ? `Check-ins (${checkInCount})`
                    : `Pick-ups (${pickUpCount})`
                }
              </Button>
            ))}
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              {error}
              <Button
                variant="link"
                size="sm"
                onClick={fetchNotifications}
                className="ml-2"
              >
                Retry
              </Button>
            </div>
          ) : getFilteredNotifications().length > 0 ? (
            getFilteredNotifications().map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        notification.type === 'CHECK_IN' 
                          ? 'text-green-600' 
                          : 'text-purple-600'
                      }`}>
                        {notification.type === 'CHECK_IN' ? 'Check-in' : 'Pick-up'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="ml-2"
                    >
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No notifications found</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};