import { create } from 'zustand';
import * as kbService from '@/services/kbService';

const useKBStore = create((set, get) => ({
  // State
  articles: [],
  article: null,
  categories: [],
  search: '',
  selectedCategory: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  // Basic Actions
  setArticles: (articles, pagination) =>
    set({ articles, pagination }),

  setArticle: (article) => set({ article }),

  setCategories: (categories) => set({ categories }),

  setSearch: (search) => set({ search }),

  setSelectedCategory: (categoryId) =>
    set({ selectedCategory: categoryId, pagination: { ...get().pagination, page: 1 } }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  setPage: (page) =>
    set((state) => ({
      pagination: { ...state.pagination, page },
    })),

  // Async Methods
  fetchArticles: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { data, pagination } = await kbService.getArticles({
        ...params,
        categoryId: get().selectedCategory,
        search: get().search,
      });

      set({
        articles: data,
        pagination,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },

  fetchArticleById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await kbService.getArticleById(id);
      set({ article: data, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },

  fetchCategories: async () => {
    try {
      const { data } = await kbService.getCategories();
      set({ categories: data });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message });
    }
  },

  createArticle: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await kbService.createArticle(data);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message,
        isLoading: false,
      });
      throw error;
    }
  },

  updateArticle: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: updated } = await kbService.updateArticle(id, data);
      set((state) => ({
        articles: state.articles.map((a) => (a.id === id ? updated : a)),
        article: state.article?.id === id ? updated : state.article,
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

  deleteArticle: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await kbService.deleteArticle(id);
      set((state) => ({
        articles: state.articles.filter((a) => a.id !== id),
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

  markHelpful: async (id, helpful) => {
    try {
      const { data } = await kbService.markArticleHelpful(id, helpful);
      set((state) => ({
        article: state.article?.id === id
          ? {
              ...state.article,
              helpfulCount: data.helpfulCount,
              notHelpfulCount: data.notHelpfulCount,
            }
          : state.article,
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || error.message });
    }
  },
}));

export { useKBStore };
export default useKBStore;
