import { cn } from '@/utils/helpers';

export default function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  className,
}) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full transition-colors duration-300';

  const variants = {
    default: 'bg-secondary text-secondary-foreground border border-transparent',
    primary: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-status-open/10 text-status-open border border-status-open/20',
    warning: 'bg-status-pending/10 text-status-pending border border-status-pending/20',
    error: 'bg-destructive/10 text-destructive border border-destructive/20',
    danger: 'bg-destructive/10 text-destructive border border-destructive/20',
    info: 'bg-status-resolved/10 text-status-resolved border border-status-resolved/20',
    // Status specific
    open: 'bg-status-open/10 text-status-open border border-status-open/20',
    pending: 'bg-status-pending/10 text-status-pending border border-status-pending/20',
    resolved: 'bg-status-resolved/10 text-status-resolved border border-status-resolved/20',
    closed: 'bg-status-closed/10 text-status-closed border border-status-closed/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
  };

  // Safely get variant, fallback to default if not found
  const variantStyle = variants[variant] || variants.default;

  return (
    <span className={cn(baseStyles, variantStyle, sizes[size], className)}>
      {dot && (
        <span className={cn(
          'mr-1.5 h-1.5 w-1.5 rounded-full',
          variant === 'primary' && 'bg-blue-500',
          variant === 'success' && 'bg-green-500',
          variant === 'warning' && 'bg-yellow-500',
          variant === 'error' && 'bg-red-500',
          variant === 'info' && 'bg-blue-500',
          variant === 'default' && 'bg-gray-500'
        )} />
      )}
      {children}
    </span>
  );
}
