import React from 'react';
import { cn } from '@/utils/helpers';
import { normalizeToString, normalizeToKey } from '@/utils/normalize';
import Badge from '../common/Badge';

const TicketPriorityBadge = ({ priority, className }) => {
  // ===== NORMALIZATION LAYER =====
  // Safely extract priority string regardless of input format
  const priorityName = normalizeToString(priority, 'unknown');
  const safePriority = normalizeToKey(priority, 'unknown');
  
  // ===== LOGIC LAYER =====
  const priorityStyles = {
    low: {
      color: 'info',
      label: 'Low'
    },
    medium: {
      color: 'primary',
      label: 'Medium'
    },
    high: {
      color: 'warning',
      label: 'High'
    },
    urgent: {
      color: 'danger',
      label: 'Urgent'
    },
    unknown: {
      color: 'info',
      label: 'Unknown'
    }
  };

  const current = priorityStyles[safePriority] || { color: 'info', label: priorityName.charAt(0).toUpperCase() + priorityName.slice(1) };

  return (
    <Badge 
      variant={current.color} 
      className={cn("capitalize", className)}
    >
      {current.label}
    </Badge>
  );
};

export default TicketPriorityBadge;
