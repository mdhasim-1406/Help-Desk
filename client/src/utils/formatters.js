import { STATUS_CONFIG, PRIORITY_CONFIG, ROLE_CONFIG, SLA_CONFIG } from './constants';
import { formatDuration, getTimeRemaining } from './helpers';

// ============================================
// Ticket Formatters
// ============================================

/**
 * Format ticket number as "TKT-2026-00001"
 */
export function formatTicketNumber(number) {
  if (!number) return '';
  
  // If already formatted, return as is
  if (typeof number === 'string' && number.startsWith('TKT-')) {
    return number;
  }
  
  // If it's a number, format it
  const year = new Date().getFullYear();
  const paddedNumber = String(number).padStart(5, '0');
  return `TKT-${year}-${paddedNumber}`;
}

/**
 * Get human-readable status label
 */
export function formatStatus(status) {
  if (!status) return '';
  return STATUS_CONFIG[status]?.label || status;
}

/**
 * Get human-readable priority label
 */
export function formatPriority(priority) {
  if (!priority) return '';
  return PRIORITY_CONFIG[priority]?.label || priority;
}

// ============================================
// User Formatters
// ============================================

/**
 * Format user's full name
 */
export function formatUserName(user) {
  if (!user) return 'Unknown User';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.firstName) return user.firstName;
  if (user.lastName) return user.lastName;
  if (user.email) return user.email.split('@')[0];
  
  return 'Unknown User';
}

/**
 * Get human-readable role label
 */
export function formatRole(role) {
  if (!role) return '';
  return ROLE_CONFIG[role]?.label || role;
}

// ============================================
// SLA Formatters
// ============================================

/**
 * Format SLA time remaining/overdue
 * Returns: "2h 30m remaining" or "1h 15m overdue"
 */
export function formatSLATime(deadline) {
  if (!deadline) return '';
  
  const { hours, minutes, isOverdue } = getTimeRemaining(deadline);
  const duration = formatDuration(hours * 60 + minutes);
  
  if (isOverdue) {
    return `${duration} overdue`;
  }
  
  return `${duration} remaining`;
}

/**
 * Format SLA status with label and color
 */
export function formatSLAStatus(status) {
  if (!status) return { label: '', color: '' };
  
  const config = SLA_CONFIG[status];
  return {
    label: config?.label || status,
    color: config?.color || '#6b7280',
  };
}

/**
 * Get SLA status from time remaining
 */
export function getSLAStatus(deadline) {
  if (!deadline) return 'ON_TRACK';
  
  const { hours, minutes, isOverdue } = getTimeRemaining(deadline);
  
  if (isOverdue) return 'BREACHED';
  
  const totalMinutes = hours * 60 + minutes;
  
  // At risk if less than 2 hours remaining
  if (totalMinutes < 120) return 'AT_RISK';
  
  return 'ON_TRACK';
}
