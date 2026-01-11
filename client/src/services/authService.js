import api from './api';

/**
 * Login user
 */
export async function login(email, password) {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}

/**
 * Register new customer
 */
export async function register(userData) {
  const response = await api.post('/auth/register', userData);
  return response.data;
}

/**
 * Logout user
 */
export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Get current user profile
 */
export async function getProfile() {
  const response = await api.get('/auth/me');
  return response.data;
}

/**
 * Update user profile
 */
export async function updateProfile(data) {
  const response = await api.put('/auth/profile', data);
  return response.data;
}

/**
 * Change password
 */
export async function changePassword(data) {
  const response = await api.post('/auth/change-password', {
    currentPassword: data.currentPassword,
    newPassword: data.newPassword,
  });
  return response.data;
}

/**
 * Request password reset
 */
export async function forgotPassword(email) {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
}

/**
 * Reset password with token
 */
export async function resetPassword(token, newPassword) {
  const response = await api.post('/auth/reset-password', {
    token,
    newPassword,
  });
  return response.data;
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken) {
  const response = await api.post('/auth/refresh', { refreshToken });
  return response.data;
}

const authService = {
  login,
  register,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
};

export default authService;
