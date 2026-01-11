import { create } from 'zustand';
import { TOAST_DURATION } from '@/utils/constants';
import { generateId } from '@/utils/helpers';

const useUIStore = create((set, get) => ({
  // State
  isSidebarOpen: true,
  sidebarCollapsed: false,
  theme: localStorage.getItem('theme') || 'light',
  toasts: [],
  modals: {},

  // Actions
  toggleSidebar: () => set((state) => ({
    isSidebarOpen: !state.isSidebarOpen,
  })),

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  toggleSidebarCollapse: () => set((state) => ({
    sidebarCollapsed: !state.sidebarCollapsed,
  })),

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },

  addToast: (toast) => {
    const id = toast.id || generateId();
    const newToast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove after duration
    setTimeout(() => {
      get().removeToast(id);
    }, toast.duration || TOAST_DURATION);

    return id;
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),

  clearToasts: () => set({ toasts: [] }),

  openModal: (modalId) => set((state) => ({
    modals: { ...state.modals, [modalId]: true },
  })),

  closeModal: (modalId) => set((state) => ({
    modals: { ...state.modals, [modalId]: false },
  })),

  isModalOpen: (modalId) => get().modals[modalId] || false,
}));

export { useUIStore };
export default useUIStore;
