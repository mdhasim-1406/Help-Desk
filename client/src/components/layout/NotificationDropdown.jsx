import React, { useEffect, useState } from 'react';
import { Bell, Check, Clock, Trash2, Info } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { cn, formatTimeAgo } from '@/utils/helpers';
import Dropdown from '../common/Dropdown';
import Button from '../common/Button';
import Spinner from '../common/Spinner';

const NotificationDropdown = () => {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = (id) => {
    markAsRead(id);
  };

  const notificationContent = (
    <div className="w-80 sm:w-96 max-h-[500px] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-primary-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {isLoading && notifications.length === 0 ? (
          <div className="flex justify-center p-8">
            <Spinner size="sm" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Bell className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id}
              className={cn(
                "group relative flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0",
                !notification.read && "bg-primary-50/30 dark:bg-primary-900/10"
              )}
              onClick={() => !notification.read && handleMarkAsRead(notification.id)}
            >
              <div className={cn(
                "mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                notification.read ? "bg-slate-100 text-slate-500" : "bg-primary-100 text-primary-600"
              )}>
                <Info className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm leading-snug",
                  notification.read ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-slate-200 font-medium"
                )}>
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-[11px] text-slate-400 italic">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </div>
              </div>

              {!notification.read && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-500" />
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 p-2 text-center">
        <Button variant="ghost" size="sm" className="w-full text-xs">
          View All Notifications
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown
      trigger={
        <button className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 text-[10px] font-bold text-white bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      }
      align="right"
      items={[]} // Using custom content instead
    >
      {notificationContent}
    </Dropdown>
  );
};

export default NotificationDropdown;
