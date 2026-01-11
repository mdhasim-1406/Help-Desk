import React from 'react';
import { cn } from '@/utils/helpers';
import { AlertCircle } from 'lucide-react';

export default function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  icon, // Alias for leftIcon - commonly used
  required = false,
  className,
  ...inputProps
}) {
  // Support both 'icon' and 'leftIcon' props
  const IconComponent = icon || leftIcon;
  const hasLeftIcon = !!IconComponent;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {hasLeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {React.isValidElement(IconComponent) ? IconComponent : <IconComponent size={18} />}
          </div>
        )}

        <input
          className={cn(
            'block w-full rounded-lg border px-3 py-2 text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'dark:bg-slate-800 dark:text-white dark:border-slate-700',
            hasLeftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500',
            'disabled:bg-gray-50 dark:disabled:bg-slate-900 disabled:text-gray-500 disabled:cursor-not-allowed',
            className
          )}
          {...inputProps}
        />

        {rightIcon && !error && (() => {
          const RightIconComponent = rightIcon;
          return (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {React.isValidElement(RightIconComponent) ? RightIconComponent : <RightIconComponent size={18} />}
            </div>
          );
        })()}

        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {!error && helperText && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}
