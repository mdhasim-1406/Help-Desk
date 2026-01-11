import { create } from 'zustand';
import * as departmentService from '@/services/departmentService';

const useDepartmentStore = create((set, get) => ({
  // State
  departments: [],
  department: null,
  isLoading: false,
  error: null,

  // Basic Actions
  setDepartments: (departments) => set({ departments }),

  setDepartment: (department) => set({ department }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  // Async Methods
  fetchDepartments: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await departmentService.getDepartments();
      set({ departments: data, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },

  fetchDepartmentById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await departmentService.getDepartmentById(id);
      set({ department: data, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },

  createDepartment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: newDept } = await departmentService.createDepartment(data);
      set((state) => ({
        departments: [...state.departments, newDept],
        isLoading: false,
      }));
      return newDept;
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message,
        isLoading: false,
      });
      throw error;
    }
  },

  updateDepartment: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: updated } = await departmentService.updateDepartment(id, data);
      set((state) => ({
        departments: state.departments.map((d) => (d.id === id ? updated : d)),
        department: state.department?.id === id ? updated : state.department,
        isLoading: false,
      }));
      return updated;
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message,
        isLoading: false,
      });
      throw error;
    }
  },

  deleteDepartment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await departmentService.deleteDepartment(id);
      set((state) => ({
        departments: state.departments.filter((d) => d.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message,
        isLoading: false,
      });
      throw error;
    }
  },
}));

export { useDepartmentStore };
export default useDepartmentStore;
