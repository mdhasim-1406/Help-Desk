import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/utils/helpers';
import Input from './Input';

/**
 * DatePicker Component (Styled native date picker)
 * 
 * @param {string} label - Input label
 * @param {string} error - Error message
 * @param {string} className - Additional classes
 */
const DatePicker = ({
  label,
  error,
  className = "",
  ...props
}) => {
  return (
    <div className={cn("w-full", className)}>
      <Input
        type="date"
        label={label}
        error={error}
        icon={Calendar}
        className="appearance-none"
        {...props}
      />
    </div>
  );
};

export default DatePicker;
