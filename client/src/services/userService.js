import api from './api';
import { generateQueryString } from '@/utils/helpers';

/**
 * Get users with filters
 */
export async function getUsers(params = {}) {
  const queryString = generateQueryString(params);
  const response = await api.get(`/users${queryString}`);
  return response.data;
}

/**
 * Get user by ID
 */
export async function getUserById(id) {
  const response = await api.get(`/users/${id}`);
  return response.data;
}

/**
 * Create new user
 */
export async function createUser(data) {
  const response = await api.post('/users', data);
  return response.data;
}

/**
 * Update user
 */
export async function updateUser(id, data) {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
}

/**
 * Delete (deactivate) user
 */
export async function deleteUser(id) {
  const response = await api.delete(`/users/${id}`);
  return response.data;
}

/**
 * Get agents list
 */
export async function getAgents(departmentId = null) {
  const params = departmentId ? { departmentId } : {};
  const queryString = generateQueryString(params);
  const response = await api.get(`/users/agents${queryString}`);
  return response.data;
}

/**
 * Get available agents in department
 */
export async function getAvailableAgents(departmentId) {
  const response = await api.get(`/users/agents/available?departmentId=${departmentId}`);
  return response.data;
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(userId, formData) {
  const response = await api.post(`/users/${userId}/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

const userService = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAgents,
  getAvailableAgents,
  uploadAvatar,
};

export default userService;
