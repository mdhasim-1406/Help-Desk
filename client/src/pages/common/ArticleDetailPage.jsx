import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  Clock,
  User,
  Eye,
  ChevronRight,
  FileText,
  Home
} from 'lucide-react';
import * as kbService from '@/services/kbService';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import { SafeHtml } from '@/utils/sanitize.jsx';
import { useUIStore } from '@/store/uiStore';
import { formatDate } from '@/utils/helpers';

const ArticleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null); // 'helpful' or 'not-helpful'
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      // Fetch article details
      const response = await kbService.getArticleById(id);
      const articleData = response.data || response.article || response;
      setArticle(articleData);

      // Fetch related articles from same category
      if (articleData.categoryId) {
        const relatedResponse = await kbService.getArticles({
          categoryId: articleData.categoryId,
          visibility: 'PUBLIC',
          status: 'PUBLISHED',
          limit: 5
        });
        const related = (relatedResponse.data || relatedResponse.articles || [])
          .filter(a => a.id !== id)
          .slice(0, 4);
        setRelatedArticles(related);
      }

      // Increment view count
      await kbService.incrementArticleViews(id).catch(err => 
        console.error('Error incrementing view count:', err)
      );
    } catch (error) {
      console.error('Error fetching article:', error);
      addToast('Failed to load article', 'error');
      navigate('/kb');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (isHelpful) => {
    if (hasVoted) {
      addToast('You have already voted on this article', 'info');
      return;
    }

    try {
      await kbService.markArticleHelpful(id, isHelpful);
      setFeedback(isHelpful ? 'helpful' : 'not-helpful');
      setHasVoted(true);
      addToast(
        isHelpful 
          ? 'Thank you for your feedback!' 
          : 'Thank you. We\'ll work on improving this article.',
        'success'
      );
      
      // Update local article state
      setArticle(prev => ({
        ...prev,
        helpfulCount: isHelpful ? (prev.helpfulCount || 0) + 1 : prev.helpfulCount,
        notHelpfulCount: !isHelpful ? (prev.notHelpfulCount || 0) + 1 : prev.notHelpfulCount
      }));
    } catch (error) {
      console.error('Error submitting feedback:', error);
      addToast('Failed to submit feedback', 'error');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.content?.substring(0, 100),
        url: window.location.href
      }).catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      addToast('Link copied to clipboard!', 'success');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Article not found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <button 
            onClick={() => navigate('/kb')}
            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Knowledge Base
          </button>
          <ChevronRight size={14} />
          {article.category && (
            <>
              <button 
                onClick={() => navigate(`/kb/categories/${article.category.id}`)}
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {article.category.name}
              </button>
              <ChevronRight size={14} />
            </>
          )}
          <span className="text-gray-900 dark:text-white truncate">{article.title}</span>
        </nav>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Article Header */}
        <Card className="p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {article.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 pb-6 border-b border-gray-200 dark:border-gray-700">
            {article.author && (
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>{article.author.firstName} {article.author.lastName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>Updated {formatDate(article.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye size={16} />
              <span>{article.viewCount || 0} views</span>
            </div>
            {article.helpfulCount > 0 && (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <ThumbsUp size={16} />
                <span>{article.helpfulCount} found this helpful</span>
              </div>
            )}
          </div>

          {/* Article Content */}
          <SafeHtml 
            html={article.content} 
            className="mt-6"
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Feedback Section */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Was this article helpful?
          </h2>
          
          {!hasVoted ? (
            <div className="flex items-center gap-4">
              <Button
                variant={feedback === 'helpful' ? 'primary' : 'outline'}
                onClick={() => handleFeedback(true)}
                className="flex items-center gap-2"
              >
                <ThumbsUp size={18} />
                Yes, helpful
              </Button>
              <Button
                variant={feedback === 'not-helpful' ? 'danger' : 'outline'}
                onClick={() => handleFeedback(false)}
                className="flex items-center gap-2"
              >
                <ThumbsDown size={18} />
                Not helpful
              </Button>
            </div>
          ) : (
            <div className="text-gray-600 dark:text-gray-400">
              {feedback === 'helpful' ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <ThumbsUp size={18} />
                  <span>Thank you for your feedback!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <ThumbsDown size={18} />
                  <span>Thank you. We'll work on improving this article.</span>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="outline"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share2 size={18} />
            Share
          </Button>
          <Button
            variant="outline"
            onClick={() => addToast('Bookmark feature coming soon!', 'info')}
            className="flex items-center gap-2"
          >
            <Bookmark size={18} />
            Bookmark
          </Button>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedArticles.map((relatedArticle) => (
                <Card
                  key={relatedArticle.id}
                  className="p-4 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/kb/articles/${relatedArticle.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-1 line-clamp-2">
                        {relatedArticle.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{relatedArticle.viewCount || 0} views</span>
                        {relatedArticle.helpfulCount > 0 && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <ThumbsUp size={12} /> {relatedArticle.helpfulCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Still Need Help CTA */}
        <Card className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
          <p className="text-indigo-100 mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/tickets/new')}
            className="bg-white text-indigo-600 hover:bg-gray-100 border-none font-semibold"
          >
            Create a Support Ticket
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default ArticleDetailPage;
