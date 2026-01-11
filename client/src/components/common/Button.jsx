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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border-2 border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
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
