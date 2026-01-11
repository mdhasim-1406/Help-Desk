import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye,
  EyeOff,
  Folder,
  FileText,
  Globe,
  Lock
} from 'lucide-react';
import * as kbService from '@/services/kbService';
import Button from '@/components/common/Button';
import SearchInput from '@/components/common/SearchInput';
import Select from '@/components/common/Select';
import Input from '@/components/common/Input';
import Textarea from '@/components/common/Textarea';
import RichTextEditor from '@/components/common/RichTextEditor';
import { Card } from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import Tabs from '@/components/common/Tabs';
import { useUIStore } from '@/store/uiStore';

const AdminKBPage = () => {
  const { addToast } = useUIStore();
  
  // State
  const [activeTab, setActiveTab] = useState('articles');
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Category modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    icon: 'Folder'
  });
  const [categoryFormErrors, setCategoryFormErrors] = useState({});
  
  // Article modal
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [articleFormData, setArticleFormData] = useState({
    title: '',
    content: '',
    categoryId: '',
    visibility: 'PUBLIC',
    tags: '',
    status: 'DRAFT'
  });
  const [articleFormErrors, setArticleFormErrors] = useState({});
  
  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    type: null, // 'category' or 'article'
    id: null,
    name: ''
  });

  // Fetch data
  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await kbService.getCategories();
      setCategories(response.data || response.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      addToast({
        type: 'error',
        message: 'Failed to load categories'
      });
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await kbService.getArticles();
      setArticles(response.data || response.articles || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      addToast({
        type: 'error',
        message: 'Failed to load articles'
      });
    } finally {
      setLoading(false);
    }
  };

  // Category handlers
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: '', description: '', icon: 'Folder' });
    setCategoryFormErrors({});
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name || '',
      description: category.description || '',
      icon: category.icon || 'Folder'
    });
    setCategoryFormErrors({});
    setIsCategoryModalOpen(true);
  };

  const validateCategoryForm = () => {
    const errors = {};
    if (!categoryFormData.name.trim()) {
      errors.name = 'Category name is required';
    }
    setCategoryFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!validateCategoryForm()) return;

    try {
      if (editingCategory) {
        await kbService.updateCategory(editingCategory.id, categoryFormData);
        addToast({
          type: 'success',
          message: 'Category updated successfully'
        });
      } else {
        await kbService.createCategory(categoryFormData);
        addToast({
          type: 'success',
          message: 'Category created successfully'
        });
      }
      setIsCategoryModalOpen(false);
      fetchCategories();
    } catch (error) {
      addToast({
        type: 'error',
        message: error.response?.data?.message || 'Failed to save category'
      });
    }
  };

  // Article handlers
  const handleCreateArticle = () => {
    setEditingArticle(null);
    setArticleFormData({
      title: '',
      content: '',
      categoryId: '',
      visibility: 'PUBLIC',
      tags: '',
      status: 'DRAFT'
    });
    setArticleFormErrors({});
    setIsArticleModalOpen(true);
  };

  const handleEditArticle = (article) => {
    setEditingArticle(article);
    setArticleFormData({
      title: article.title || '',
      content: article.content || '',
      categoryId: article.categoryId || '',
      visibility: article.visibility || 'PUBLIC',
      tags: article.tags?.join(', ') || '',
      status: article.status || 'DRAFT'
    });
    setArticleFormErrors({});
    setIsArticleModalOpen(true);
  };

  const validateArticleForm = () => {
    const errors = {};
    if (!articleFormData.title.trim()) {
      errors.title = 'Title is required';
    } else if (articleFormData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }
    
    if (!articleFormData.content.trim()) {
      errors.content = 'Content is required';
    } else if (articleFormData.content.length < 50) {
      errors.content = 'Content must be at least 50 characters';
    }
    
    if (!articleFormData.categoryId) {
      errors.categoryId = 'Category is required';
    }
    
    setArticleFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    if (!validateArticleForm()) return;

    try {
      const payload = {
        ...articleFormData,
        tags: articleFormData.tags ? articleFormData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      
      if (editingArticle) {
        await kbService.updateArticle(editingArticle.id, payload);
        addToast({
          type: 'success',
          message: 'Article updated successfully'
        });
      } else {
        await kbService.createArticle(payload);
        addToast({
          type: 'success',
          message: 'Article created successfully'
        });
      }
      setIsArticleModalOpen(false);
      fetchArticles();
    } catch (error) {
      addToast({
        type: 'error',
        message: error.response?.data?.message || 'Failed to save article'
      });
    }
  };

  // Delete handlers
  const handleDeleteClick = (type, item) => {
    setDeleteDialog({
      isOpen: true,
      type,
      id: item.id,
      name: item.name || item.title
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteDialog.type === 'category') {
        await kbService.deleteCategory(deleteDialog.id);
        addToast({
          type: 'success',
          message: 'Category deleted successfully'
        });
        fetchCategories();
      } else {
        await kbService.deleteArticle(deleteDialog.id);
        addToast({
          type: 'success',
          message: 'Article deleted successfully'
        });
        fetchArticles();
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete item'
      });
    }
    setDeleteDialog({ isOpen: false, type: null, id: null, name: '' });
  };

  // Filter articles
  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchQuery || 
      article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || article.categoryId === categoryFilter;
    const matchesVisibility = !visibilityFilter || article.visibility === visibilityFilter;
    const matchesStatus = !statusFilter || article.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesVisibility && matchesStatus;
  });

  const getVisibilityIcon = (visibility) => {
    return visibility === 'PUBLIC' ? <Globe size={16} /> : <Lock size={16} />;
  };

  const getVisibilityColor = (visibility) => {
    return visibility === 'PUBLIC' 
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  };

  const getStatusColor = (status) => {
    return status === 'PUBLISHED'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Knowledge Base Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Create and manage articles and categories for your knowledge base.
          </p>
        </div>
        <Button 
          icon={Plus} 
          onClick={activeTab === 'articles' ? handleCreateArticle : handleCreateCategory}
        >
          Add {activeTab === 'articles' ? 'Article' : 'Category'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'articles', label: 'Articles', icon: FileText },
          { id: 'categories', label: 'Categories', icon: Folder }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Articles Tab */}
      {activeTab === 'articles' && (
        <>
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <SearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  onClear={() => setSearchQuery('')}
                />
              </div>
              <div className="w-full lg:w-48">
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Categories' },
                    ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                  ]}
                />
              </div>
              <div className="w-full lg:w-40">
                <Select
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Visibility' },
                    { value: 'PUBLIC', label: 'Public' },
                    { value: 'INTERNAL', label: 'Internal' }
                  ]}
                />
              </div>
              <div className="w-full lg:w-40">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'DRAFT', label: 'Draft' },
                    { value: 'PUBLISHED', label: 'Published' }
                  ]}
                />
              </div>
            </div>
          </Card>

          {/* Articles List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No articles found"
              description={searchQuery ? 'Try adjusting your search or filters.' : 'Create your first article to get started.'}
              action={
                !searchQuery && (
                  <Button icon={Plus} onClick={handleCreateArticle}>
                    Create Article
                  </Button>
                )
              }
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Author</th>
                      <th className="px-6 py-4">Visibility</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Views</th>
                      <th className="px-6 py-4">Last Updated</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredArticles.map((article) => (
                      <tr 
                        key={article.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {article.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {article.category?.name || 'Uncategorized'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {article.author?.firstName} {article.author?.lastName}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getVisibilityColor(article.visibility)}`}>
                            {getVisibilityIcon(article.visibility)}
                            {article.visibility}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(article.status)}`}>
                            {article.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {article.viewCount || 0}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs">
                          {new Date(article.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              title="Edit"
                              onClick={() => handleEditArticle(article)}
                            >
                              <Edit2 size={14} className="text-slate-500" />
                            </button>
                            <button
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete"
                              onClick={() => handleDeleteClick('article', article)}
                            >
                              <Trash2 size={14} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={Folder}
                title="No categories found"
                description="Create your first category to organize articles."
                action={
                  <Button icon={Plus} onClick={handleCreateCategory}>
                    Create Category
                  </Button>
                }
              />
            </div>
          ) : (
            categories.map((category) => (
              <Card key={category.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-primary-50 text-primary-600 dark:bg-slate-800">
                    <Folder size={24} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick('category', category)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                  {category.name}
                </h3>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                  {category.description || 'No description provided'}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <FileText size={16} />
                    <span>{category._count?.articles || 0} articles</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <Input
            label="Category Name"
            value={categoryFormData.name}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
            error={categoryFormErrors.name}
            placeholder="e.g., Getting Started"
            required
          />
          
          <Textarea
            label="Description"
            value={categoryFormData.description}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
            placeholder="Brief description of this category..."
            rows={3}
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingCategory ? 'Update' : 'Create'} Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Article Modal */}
      <Modal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        title={editingArticle ? 'Edit Article' : 'Create Article'}
        size="2xl"
      >
        <form onSubmit={handleArticleSubmit} className="space-y-4">
          <Input
            label="Article Title"
            value={articleFormData.title}
            onChange={(e) => setArticleFormData({ ...articleFormData, title: e.target.value })}
            error={articleFormErrors.title}
            placeholder="e.g., How to reset your password"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={articleFormData.categoryId}
              onChange={(e) => setArticleFormData({ ...articleFormData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {articleFormErrors.categoryId && (
              <p className="mt-1 text-sm text-red-600">{articleFormErrors.categoryId}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              content={articleFormData.content}
              onChange={(content) => setArticleFormData({ ...articleFormData, content })}
              error={articleFormErrors.content}
              placeholder="Write your article content here..."
              showCharCount={true}
              minHeight="350px"
            />
            {articleFormErrors.content && (
              <p className="mt-1 text-sm text-red-600">{articleFormErrors.content}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visibility
              </label>
              <select
                value={articleFormData.visibility}
                onChange={(e) => setArticleFormData({ ...articleFormData, visibility: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="PUBLIC">Public (Customers can see)</option>
                <option value="INTERNAL">Internal (Staff only)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={articleFormData.status}
                onChange={(e) => setArticleFormData({ ...articleFormData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>
          
          <Input
            label="Tags"
            value={articleFormData.tags}
            onChange={(e) => setArticleFormData({ ...articleFormData, tags: e.target.value })}
            placeholder="password, security, authentication"
            helperText="Comma-separated tags"
          />
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsArticleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingArticle ? 'Update' : 'Create'} Article
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, type: null, id: null, name: '' })}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteDialog.type === 'category' ? 'Category' : 'Article'}`}
        message={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
      />
    </div>
  );
};

export default AdminKBPage;
