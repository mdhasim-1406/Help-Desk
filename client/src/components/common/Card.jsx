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
    <div className={cn('bg-white rounded-lg shadow border border-gray-200', className)}>
      {(title || subtitle || actions) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
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
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
}

export { Card };
export default Card;
