import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/helpers';

/**
 * Dropdown Component
 * 
 * @param {React.Node} trigger - Element that triggers the dropdown
 * @param {Array} items - Array of { label, icon, onClick, className, destructive }
 * @param {string} align - left or right
 */
const Dropdown = ({
  trigger,
  items = [],
  children,
  align = 'right',
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignments = {
    left: 'left-0',
    right: 'right-0'
  };

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger || (
          <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none">
            Options
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className={cn(
          "absolute mt-2 min-w-[14rem] rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100",
          alignments[align] || alignments.right
        )}>
          {children ? (
            children
          ) : (
            <div className="py-1">
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick && item.onClick();
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center w-full px-4 py-2.5 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-left",
                    item.destructive ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20" : "text-slate-700 dark:text-slate-300",
                    item.className
                  )}
                >
                  {item.icon && <item.icon className="w-4 h-4 mr-3" />}
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
