import React from 'react';
import { cn } from '@/utils/helpers';
import { normalizeToString, normalizeToKey } from '@/utils/normalize';
import Badge from '../common/Badge';

const TicketStatusBadge = ({ status, className }) => {
  // ===== NORMALIZATION LAYER =====
  // Safely extract the status string regardless of input format
  const statusName = normalizeToString(status, 'unknown');
  const safeStatus = normalizeToKey(status, 'unknown');

  // ===== LOGIC LAYER =====
  const statusStyles = {
    open: {
      color: 'success',
      label: 'Open'
    },
    pending: {
      color: 'warning',
      label: 'Pending'
    },
    waiting_customer: {
      color: 'warning',
      label: 'Waiting'
    },
    in_progress: {
      color: 'warning',
      label: 'In Progress'
    },
    resolved: {
      color: 'primary',
      label: 'Resolved'
    },
    closed: {
      color: 'info',
      label: 'Closed'
    },
    unknown: {
      color: 'info',
      label: 'Unknown'
    }
  };

  const current = statusStyles[safeStatus] || { color: 'info', label: statusName.charAt(0).toUpperCase() + statusName.slice(1) };

  // ===== RENDER LAYER =====
  return (
    <Badge 
      variant={current.color} 
      className={cn("capitalize", className)}
    >
      {current.label}
    </Badge>
  );
};

export default TicketStatusBadge;
