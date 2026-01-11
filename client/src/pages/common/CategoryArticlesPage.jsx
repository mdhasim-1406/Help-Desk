import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  ChevronRight,
  FileText,
  Eye,
  ThumbsUp,
  Search,
  Folder,
  Home
} from 'lucide-react';
import * as kbService from '@/services/kbService';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import SearchInput from '@/components/common/SearchInput';
import EmptyState from '@/components/common/EmptyState';
import { formatDate } from '@/utils/helpers';

const CategoryArticlesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryAndArticles();
  }, [id]);

  useEffect(() => {
    if (search.trim()) {
      const filtered = articles.filter(article =>
        article.title.toLowerCase().includes(search.toLowerCase()) ||
        article.content?.toLowerCase().includes(search.toLowerCase()) ||
        article.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
      setFilteredArticles(filtered);
    } else {
      setFilteredArticles(articles);
    }
  }, [search, articles]);

  const fetchCategoryAndArticles = async () => {
    setLoading(true);
    try {
      // Fetch category details
      const categoryResponse = await kbService.getCategoryById(id);
      setCategory(categoryResponse.data || categoryResponse.category || categoryResponse);

      // Fetch articles in this category
      const articlesResponse = await kbService.getArticles({
        categoryId: id,
        visibility: 'PUBLIC',
        status: 'PUBLISHED'
      });
      const articlesList = articlesResponse.data || articlesResponse.articles || [];
      setArticles(articlesList);
      setFilteredArticles(articlesList);
    } catch (error) {
      console.error('Error fetching category:', error);
      navigate('/kb');
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = (articleId) => {
    navigate(`/kb/articles/${articleId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Folder className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Category not found
          </h2>
          <Button onClick={() => navigate('/kb')}>
            <Home size={16} className="mr-2" />
            Back to Knowledge Base
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <button 
            onClick={() => navigate('/kb')}
            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Knowledge Base
          </button>
          <ChevronRight size={14} />
          <span className="text-gray-900 dark:text-white">{category.name}</span>
        </nav>

        {/* Back Button */}
        <button
          onClick={() => navigate('/kb')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Categories</span>
        </button>

        {/* Category Header */}
        <Card className="p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-4xl">{category.icon || '📁'}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {category.description}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                {articles.length} {articles.length === 1 ? 'article' : 'articles'} in this category
              </p>
            </div>
          </div>
        </Card>

        {/* Search */}
        <div className="mb-6">
          <SearchInput
            placeholder="Search articles in this category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Articles List */}
        {filteredArticles.length > 0 ? (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <Card
                key={article.id}
                className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => handleArticleClick(article.id)}
              >
                <div className="flex items-start gap-4">
                  <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                      {article.content?.substring(0, 200)}...
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      {article.author && (
                        <span>
                          By {article.author.firstName} {article.author.lastName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {article.viewCount || 0} views
                      </span>
                      {article.helpfulCount > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <ThumbsUp size={14} />
                          {article.helpfulCount} helpful
                        </span>
                      )}
                      <span>Updated {formatDate(article.updatedAt)}</span>
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {article.tags.slice(0, 5).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={search ? Search : FileText}
            title={search ? 'No articles found' : 'No articles yet'}
            description={
              search
                ? `No articles match "${search}" in this category`
                : 'This category doesn\'t have any published articles yet'
            }
          />
        )}

        {/* Back to KB Button */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => navigate('/kb')}
          >
            Browse Other Categories
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CategoryArticlesPage;
