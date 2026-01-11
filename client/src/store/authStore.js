import { create } from 'zustand';
import { USER_ROLES, ROLE_HIERARCHY } from '@/utils/constants';
import authService from '@/services/authService';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,
  
  // Actions
  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isLoading: false,
    error: null,
  }),
  
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const data = await authService.login(email, password);
      
      const { user, token, refreshToken } = data;
      
      localStorage.setItem('accessToken', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
      
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ 
        isLoading: false, 
        error: message 
      });
      return false;
    }
  },
  
  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({
        user: null,
        isAuthenticated: false,
        isInitialized: true,
        error: null,
      });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, isInitialized: true });
      return;
    }

    try {
      set({ isLoading: true });
      const data = await authService.getProfile();
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true
      });
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true
      });
    }
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  // Getters (as functions)
  getRole: () => get().user?.role || null,
  
  getFullName: () => {
    const user = get().user;
    if (!user) return 'User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
  },
  
  getDepartmentId: () => get().user?.departmentId || null,
  
  hasRole: (role) => {
    const userRole = get().user?.role;
    if (!userRole || !role) return false;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[role] || 0;
    return userLevel >= requiredLevel;
  },
  
  isCustomer: () => get().user?.role === USER_ROLES.CUSTOMER,
  
  isAgent: () => {
    const userRole = get().user?.role;
    return userRole && ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[USER_ROLES.AGENT];
  },
  
  isManager: () => {
    const userRole = get().user?.role;
    return userRole && ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[USER_ROLES.MANAGER];
  },
  
  isAdmin: () => get().user?.role === USER_ROLES.ADMIN,

  // Initialize auth state on app load (alias for checkAuth)
  initialize: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, isInitialized: true });
      return;
    }

    try {
      set({ isLoading: true });
      const data = await authService.getProfile();
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true
      });
    }
  },
}));

export { useAuthStore };
export default useAuthStore;
