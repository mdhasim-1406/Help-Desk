import { cn } from '@/utils/helpers';

function Card({
  title,
  subtitle,
  actions,
  footer,
  noPadding = false,
  className,
  children,
}) {
  return (
    <div className={cn('bg-white dark:bg-slate-900 rounded-lg shadow border border-slate-200 dark:border-slate-700', className)}>
      {(title || subtitle || actions) && (
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="ml-4 flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={cn(!noPadding && 'p-6')}>
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
}

export { Card };
export default Card;
