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
    <div className={cn('bg-card rounded-2xl shadow-soft border border-border/50 hover:shadow-medium transition-shadow duration-300', className)}>
      {(title || subtitle || actions) && (
        <div className="px-6 py-5 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="ml-4 flex items-center gap-2">
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
        <div className="px-6 py-4 bg-secondary/30 border-t border-border/40 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  );
}

export { Card };
export default Card;
