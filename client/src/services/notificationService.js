import api from './api';
import { generateQueryString } from '@/utils/helpers';

/**
 * Get notifications
 */
export async function getNotifications(params = {}) {
  const queryString = generateQueryString(params);
  const response = await api.get(`/notifications${queryString}`);
  return response?.data || [];
}

/**
 * Get unread notification count
 */
export async function getUnreadCount() {
  const response = await api.get('/notifications/unread');
  return response?.data || 0;
}

/**
 * Mark notification as read
 */
export async function markAsRead(id) {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
  const response = await api.put('/notifications/read-all');
  return response.data;
}

/**
 * Delete notification
 */
export async function deleteNotification(id) {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
}

const notificationService = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

export default notificationService;
