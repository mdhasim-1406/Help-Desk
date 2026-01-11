import React, { useState } from 'react';
import { cn } from '@/utils/helpers';

/**
 * Tooltip Component
 * 
 * @param {string} text - Tooltip content
 * @param {string} position - top, bottom, left, right
 * @param {React.Node} children - Trigger element
 */
const Tooltip = ({
  text,
  position = 'top',
  children,
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  };

  const arrows = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-900",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-900",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-900"
  };

  if (!text) return children;

  return (
    <div 
      className={cn("relative inline-block", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div className={cn(
          "absolute z-[100] px-2 py-1 text-xs font-medium text-white bg-slate-900 rounded shadow-sm whitespace-nowrap animate-in fade-in duration-200",
          positions[position] || positions.top
        )}>
          {text}
          <div className={cn(
            "absolute border-4 border-transparent",
            arrows[position] || arrows.top
          )} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
