import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import Button from '@/components/common/Button';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="text-center max-w-md">
        <div className="relative mb-6 flex justify-center">
          <span className="text-9xl font-black text-slate-200 dark:text-slate-800 tracking-tighter">404</span>
          <div className="absolute inset-0 flex items-center justify-center mt-8">
            <Search className="w-16 h-16 text-primary-500 animate-bounce" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Page Not Found</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            icon={ArrowLeft}
          >
            Go Back
          </Button>
          <Button 
            variant="primary" 
            onClick={() => navigate('/')}
            icon={Home}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
