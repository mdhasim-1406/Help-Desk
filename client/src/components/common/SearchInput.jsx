import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/helpers';
import Input from './Input';

/**
 * SearchInput Component
 * 
 * @param {string} value - Current value
 * @param {function} onChange - Change handler
 * @param {function} onClear - Function to clear search
 * @param {string} placeholder - Input placeholder
 */
const SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  className = "",
  ...props
}) => {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <Input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-10 pr-10"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            // Optional: You could trigger a specific search action here if needed
            // but usually the debounce on change handles it.
          }
          if (props.onKeyDown) props.onKeyDown(e);
        }}
        {...props}
      />
      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
