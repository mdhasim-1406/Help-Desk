import React from 'react';
import { cn } from '@/utils/helpers';

/**
 * Tabs Component
 * 
 * @param {Array} tabs - Array of { id, label, icon }
 * @param {string} activeTab - Currently active tab id
 * @param {function} onChange - Tab change handler
 * @param {string} variant - default, pills, underline
 */
const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = 'underline',
  className = ""
}) => {
  const baseClasses = "flex items-center gap-1 transition-all focus:outline-none whitespace-nowrap";
  
  const variants = {
    underline: {
      list: "border-b border-slate-200 dark:border-slate-800",
      item: (isActive) => cn(
        baseClasses,
        "px-4 py-3 text-sm font-medium border-b-2 -mb-px",
        isActive 
          ? "border-primary-500 text-primary-600 dark:text-primary-400" 
          : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 hover:border-slate-300"
      )
    },
    pills: {
      list: "p-1 bg-slate-100 dark:bg-slate-800 rounded-lg",
      item: (isActive) => cn(
        baseClasses,
        "px-4 py-2 text-sm font-medium rounded-md",
        isActive 
          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
      )
    }
  };

  const currentVariant = variants[variant] || variants.underline;

  return (
    <div className={cn("flex items-center", currentVariant.list, className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={currentVariant.item(activeTab === tab.id)}
        >
          {tab.icon && <tab.icon className="w-4 h-4" />}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
