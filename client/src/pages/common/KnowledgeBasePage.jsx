import React, { useState, useEffect } from 'react';
import {
  Search,
  Book,
  MessageCircle,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Folder
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as kbService from '@/services/kbService';
import SearchInput from '@/components/common/SearchInput';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import { debounce } from '@/utils/helpers';
import { useUIStore } from '@/store/uiStore';

const KnowledgeBasePage = () => {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [popularArticles, setPopularArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchPopularArticles();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await kbService.getCategories();
      setCategories(response.data || response.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularArticles = async () => {
    try {
      const response = await kbService.getArticles({
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
        sortBy: 'viewCount',
        sortOrder: 'desc',
        limit: 5
      });
      setPopularArticles(response.data || response.articles || []);
    } catch (error) {
      console.error('Error fetching popular articles:', error);
    }
  };

  const handleSearch = debounce(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await kbService.getArticles({
        search: query,
        visibility: 'PUBLIC',
        status: 'PUBLISHED'
      });
      setSearchResults(response.data || response.articles || []);
    } catch (error) {
      console.error('Error searching articles:', error);
    } finally {
      setSearching(false);
    }
  }, 300);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    handleSearch(value);
  };

  const handleArticleClick = (articleId) => {
    navigate(`/kb/articles/${articleId}`);
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/kb/categories/${categoryId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 py-16 px-6 text-center">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">How can we help?</h1>
          <p className="text-slate-400 text-lg">Search our documentation for answers to common questions.</p>
          <div className="max-w-xl mx-auto relative">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search for articles, guides..."
              className="h-14 text-lg bg-white/10 border-white/20 text-white placeholder-slate-500 rounded-2xl"
            />

            {/* Search Results Dropdown */}
            {search && (
              <Card className="absolute mt-2 w-full z-10 max-h-96 overflow-y-auto">
                {searching ? (
                  <div className="p-8 text-center">
                    <Spinner />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {searchResults.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => handleArticleClick(article.id)}
                        className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-start gap-3"
                      >
                        <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {article.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                            {article.content?.substring(0, 120)}...
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {article.category?.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {article.viewCount || 0} views
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No articles found for "{search}"
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Try different keywords or browse categories below
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Categories */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-2">
            <Folder size={24} className="text-primary-500" />
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.length > 0 ? (
              categories.map((category) => (
                <Card
                  key={category.id}
                  className="p-6 hover:shadow-lg transition-all border-slate-200 dark:border-slate-800 dark:bg-slate-900 group cursor-pointer"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 bg-indigo-50 dark:bg-indigo-900/30">
                    <span className="text-2xl">{category.icon || '📁'}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">{category.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{category.description}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                    {category._count?.articles || 0} Articles
                  </p>
                  <div className="flex items-center text-xs font-bold text-primary-600 group-hover:gap-2 transition-all">
                    View Category <ChevronRight size={14} />
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Folder className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No categories available yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Popular & Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-rose-500" />
                Popular Articles
              </h2>
              <div className="space-y-2">
                {popularArticles.length > 0 ? (
                  popularArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleArticleClick(article.id)}
                      className="group flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900 transition-colors cursor-pointer w-full text-left"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <FileText size={18} className="text-slate-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-slate-700 dark:text-slate-300 block truncate">
                            {article.title}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">{article.category?.name}</span>
                            <span className="text-xs text-slate-400">• {article.viewCount || 0} views</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-500 flex-shrink-0" />
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No popular articles yet</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50 shadow-sm relative overflow-hidden">
              <MessageCircle className="absolute top-[-20px] right-[-20px] h-32 w-32 text-indigo-100 dark:text-indigo-900/20 rotate-12" />
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 text-indigo-900 dark:text-white">Need Further Assistance?</h3>
                <p className="text-indigo-700/80 dark:text-indigo-300 text-sm mb-6 leading-relaxed">
                  Can't find what you're looking for? Our dedicated support team is here to help resolve your specific issue.
                </p>
                <Button
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-medium shadow-sm hover:shadow transition-all"
                  onClick={() => navigate('/tickets/new')}
                >
                  Contact Support
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <HelpCircle size={18} className="text-slate-400" />
                Support Hours
              </h3>
              <div className="text-sm space-y-2 text-slate-600 dark:text-slate-400">
                <div className="flex justify-between font-medium"><span>Mon - Fri</span> <span>09:00 - 18:00</span></div>
                <div className="flex justify-between"><span>Sat - Sun</span> <span>Emergency Only</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LayoutGrid = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>;
const Settings = ({ size }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
const Star = ({ size }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const ShieldCheck = ({ size }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>;

export default KnowledgeBasePage;
