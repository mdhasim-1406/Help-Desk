import React from 'react';
import { cn } from '@/utils/helpers';
import { Loader2 } from 'lucide-react';

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  isLoading,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  icon,
  fullWidth = false,
  children,
  className,
  type = 'button',
  onClick,
  ...props
}) {
  // Normalize loading state (support both 'loading' and 'isLoading' props)
  const isLoadingState = loading || isLoading || false;
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 border border-transparent',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent',
    outline: 'border border-border bg-transparent hover:bg-secondary text-foreground hover:border-primary/20',
    ghost: 'bg-transparent hover:bg-secondary text-muted-foreground hover:text-foreground',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
    success: 'bg-status-open text-white hover:bg-status-open/90 shadow-sm',
  };

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const isDisabled = disabled || isLoadingState;
  const IconComponent = icon || leftIcon;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoadingState && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!isLoadingState && IconComponent && <span className="mr-2">{React.isValidElement(IconComponent) ? IconComponent : <IconComponent size={16} />}</span>}
      {children}
      {!isLoadingState && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}
