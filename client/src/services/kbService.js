import api from './api';
import { generateQueryString } from '@/utils/helpers';

// ============================================
// Categories
// ============================================

/**
 * Get all categories
 */
export async function getCategories() {
  const response = await api.get('/kb/categories');
  return response.data;
}

/**
 * Get category by ID
 */
export async function getCategoryById(id) {
  const response = await api.get(`/kb/categories/${id}`);
  return response.data;
}

/**
 * Create new category
 */
export async function createCategory(data) {
  const response = await api.post('/kb/categories', data);
  return response.data;
}

/**
 * Update category
 */
export async function updateCategory(id, data) {
  const response = await api.put(`/kb/categories/${id}`, data);
  return response.data;
}

/**
 * Delete category
 */
export async function deleteCategory(id) {
  const response = await api.delete(`/kb/categories/${id}`);
  return response.data;
}

// ============================================
// Articles
// ============================================

/**
 * Get articles with filters
 */
export async function getArticles(params = {}) {
  const queryString = generateQueryString(params);
  const response = await api.get(`/kb/articles${queryString}`);
  return response.data;
}

/**
 * Get article by ID
 */
export async function getArticleById(id) {
  const response = await api.get(`/kb/articles/${id}`);
  return response.data;
}

/**
 * Create new article
 */
export async function createArticle(data) {
  const response = await api.post('/kb/articles', data);
  return response.data;
}

/**
 * Update article
 */
export async function updateArticle(id, data) {
  const response = await api.put(`/kb/articles/${id}`, data);
  return response.data;
}

/**
 * Delete article
 */
export async function deleteArticle(id) {
  const response = await api.delete(`/kb/articles/${id}`);
  return response.data;
}

/**
 * Mark article as helpful/not helpful
 */
export async function markArticleHelpful(id, helpful) {
  const response = await api.post(`/kb/articles/${id}/helpful`, { helpful });
  return response.data;
}

/**
 * Increment article view count
 */
export async function incrementArticleViews(id) {
  const response = await api.post(`/kb/articles/${id}/view`);
  return response.data;
}

const kbService = {
  // Categories
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  // Articles
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  markArticleHelpful,
  incrementArticleViews,
};

export default kbService;
