import { create } from 'zustand';
import * as notificationService from '@/services/notificationService';

const useNotificationStore = create((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  // Actions
  setNotifications: (notifications) => set({ notifications }),

  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),

  markAsRead: (id) => set((state) => {
    const notification = state.notifications.find(n => n.id === id);
    const wasUnread = notification && !notification.read;

    return {
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
    };
  }),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),

  removeNotification: (id) => set((state) => {
    const notification = state.notifications.find(n => n.id === id);
    const wasUnread = notification && !notification.read;

    return {
      notifications: state.notifications.filter(n => n.id !== id),
      unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
    };
  }),

  setUnreadCount: (count) => set({ unreadCount: count }),

  setLoading: (loading) => set({ isLoading: loading }),

  // Async Methods
  fetchNotifications: async (params) => {
    set({ isLoading: true });
    try {
      const { data } = await notificationService.getNotifications(params);
      // Ensure it is always an array
      const notifications = Array.isArray(data) ? data : [];
      set({ notifications, isLoading: false });
    } catch (error) {
      set({ isLoading: false, notifications: [] });
      console.error('Failed to fetch notifications:', error);
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await notificationService.getUnreadCount();
      set({ unreadCount: typeof data === 'number' ? data : 0 });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      set({ unreadCount: 0 });
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationService.markAsRead(id);
      set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        const wasUnread = notification && !notification.read;

        return {
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  removeNotification: async (id) => {
    try {
      await notificationService.deleteNotification(id);
      set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        const wasUnread = notification && !notification.read;

        return {
          notifications: state.notifications.filter(n => n.id !== id),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    } catch (error) {
      console.error('Failed to remove notification:', error);
    }
  },
}));

export { useNotificationStore };
export default useNotificationStore;
