import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/helpers';

/**
 * Toast Component
 * 
 * @param {string} id - Unique ID
 * @param {string} message - Notification message
 * @param {string} type - success, error, info, warning
 * @param {function} onClose - Function to remove toast
 * @param {number} duration - Auto-close duration in ms
 */
const Toast = ({
  id,
  message,
  type = 'info',
  onClose,
  duration = 5000
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    success: "border-emerald-100 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-900/20",
    error: "border-rose-100 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-900/20",
    warning: "border-amber-100 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/20",
    info: "border-blue-100 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900/20"
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-3 w-full max-w-sm p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full duration-300",
        bgColors[type] || bgColors.info
      )}
    >
      <div className="shrink-0">
        {icons[type] || icons.info}
      </div>
      
      <div className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
        {message}
      </div>

      <button
        onClick={() => onClose(id)}
        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
