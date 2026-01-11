// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'HelpDesk Pro';

// Ticket Status
export const TICKET_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_CUSTOMER: 'WAITING_CUSTOMER',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
};

// Ticket Priority
export const TICKET_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
};

// Status Configuration
export const STATUS_CONFIG = {
  [TICKET_STATUS.OPEN]: {
    label: 'Open',
    color: '#10b981',
    bgColor: '#d1fae5',
    textColor: '#065f46',
    icon: 'circle',
  },
  [TICKET_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    textColor: '#1e40af',
    icon: 'loader',
  },
  [TICKET_STATUS.WAITING_CUSTOMER]: {
    label: 'Waiting Customer',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    textColor: '#92400e',
    icon: 'clock',
  },
  [TICKET_STATUS.RESOLVED]: {
    label: 'Resolved',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    textColor: '#1e40af',
    icon: 'check-circle',
  },
  [TICKET_STATUS.CLOSED]: {
    label: 'Closed',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    textColor: '#374151',
    icon: 'x-circle',
  },
};

// Priority Configuration
export const PRIORITY_CONFIG = {
  [TICKET_PRIORITY.LOW]: {
    label: 'Low',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    textColor: '#374151',
    icon: 'arrow-down',
    level: 1,
  },
  [TICKET_PRIORITY.MEDIUM]: {
    label: 'Medium',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    textColor: '#1e40af',
    icon: 'minus',
    level: 2,
  },
  [TICKET_PRIORITY.HIGH]: {
    label: 'High',
    color: '#f97316',
    bgColor: '#ffedd5',
    textColor: '#9a3412',
    icon: 'arrow-up',
    level: 3,
  },
  [TICKET_PRIORITY.URGENT]: {
    label: 'Urgent',
    color: '#ef4444',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
    icon: 'alert-triangle',
    level: 4,
  },
};

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  AGENT: 'AGENT',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

// Role Hierarchy
export const ROLE_HIERARCHY = {
  [USER_ROLES.CUSTOMER]: 1,
  [USER_ROLES.AGENT]: 2,
  [USER_ROLES.MANAGER]: 3,
  [USER_ROLES.ADMIN]: 4,
  [USER_ROLES.SUPER_ADMIN]: 5,
};

// Role Configuration
export const ROLE_CONFIG = {
  [USER_ROLES.CUSTOMER]: {
    label: 'Customer',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    textColor: '#1e40af',
    description: 'Can create and view own tickets',
  },
  [USER_ROLES.AGENT]: {
    label: 'Agent',
    color: '#10b981',
    bgColor: '#d1fae5',
    textColor: '#065f46',
    description: 'Can handle assigned tickets',
  },
  [USER_ROLES.MANAGER]: {
    label: 'Manager',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    textColor: '#5b21b6',
    description: 'Can manage department and team',
  },
  [USER_ROLES.ADMIN]: {
    label: 'Admin',
    color: '#ef4444',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
    description: 'Full system access',
  },
  [USER_ROLES.SUPER_ADMIN]: {
    label: 'Super Admin',
    color: '#dc2626',
    bgColor: '#fecaca',
    textColor: '#7f1d1d',
    description: 'Complete system control',
  },
};

// SLA Status
export const SLA_STATUS = {
  ON_TRACK: 'ON_TRACK',
  AT_RISK: 'AT_RISK',
  BREACHED: 'BREACHED',
};

// SLA Configuration
export const SLA_CONFIG = {
  [SLA_STATUS.ON_TRACK]: {
    label: 'On Track',
    color: '#10b981',
    bgColor: '#d1fae5',
    textColor: '#065f46',
  },
  [SLA_STATUS.AT_RISK]: {
    label: 'At Risk',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    textColor: '#92400e',
  },
  [SLA_STATUS.BREACHED]: {
    label: 'Breached',
    color: '#ef4444',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
  },
};

// UI Constants
export const ITEMS_PER_PAGE = 10;
export const DEBOUNCE_DELAY = 300;
export const TOAST_DURATION = 5000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
];

// Notification Types
export const NOTIFICATION_TYPES = {
  TICKET_CREATED: 'TICKET_CREATED',
  TICKET_ASSIGNED: 'TICKET_ASSIGNED',
  TICKET_STATUS_CHANGED: 'TICKET_STATUS_CHANGED',
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  SLA_BREACH: 'SLA_BREACH',
  SLA_AT_RISK: 'SLA_AT_RISK',
  TICKET_ESCALATED: 'TICKET_ESCALATED',
};

// KB Article Visibility
export const ARTICLE_VISIBILITY = {
  PUBLIC: 'PUBLIC',
  INTERNAL: 'INTERNAL',
};
