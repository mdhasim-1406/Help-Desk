import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistance, formatDistanceToNow, differenceInMinutes, isPast } from 'date-fns';

// ============================================
// Class Utilities
// ============================================

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ============================================
// Date Utilities
// ============================================

/**
 * Format date as "Jan 15, 2026"
 */
export function formatDate(date) {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy');
}

/**
 * Format date and time as "Jan 15, 2026 at 2:30 PM"
 */
export function formatDateTime(date) {
  if (!date) return '';
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

/**
 * Format relative time "2 hours ago", "3 days ago"
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Format duration in minutes as "2h 30m"
 */
export function formatDuration(minutes) {
  if (!minutes || minutes < 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
}

/**
 * Check if date is overdue (past current time)
 */
export function isOverdue(date) {
  if (!date) return false;
  return isPast(new Date(date));
}

/**
 * Get time remaining until a date
 */
export function getTimeRemaining(date) {
  if (!date) return { hours: 0, minutes: 0, isOverdue: false };
  
  const now = new Date();
  const target = new Date(date);
  const totalMinutes = differenceInMinutes(target, now);
  
  if (totalMinutes < 0) {
    return {
      hours: Math.floor(Math.abs(totalMinutes) / 60),
      minutes: Math.abs(totalMinutes) % 60,
      isOverdue: true,
    };
  }
  
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    isOverdue: false,
  };
}

// ============================================
// String Utilities
// ============================================

/**
 * Truncate string with ellipsis
 */
export function truncate(str, length = 50) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

/**
 * Get initials from name (max 2 letters)
 */
export function getInitials(name) {
  if (!name) return '??';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert string to URL-safe slug
 */
export function slugify(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// ============================================
// Number Utilities
// ============================================

/**
 * Format number with commas: "1,234"
 */
export function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  return num.toLocaleString();
}

/**
 * Format as percentage: "85%"
 */
export function formatPercentage(num, decimals = 0) {
  if (num == null || isNaN(num)) return '0%';
  return `${num.toFixed(decimals)}%`;
}

/**
 * Clamp number between min and max
 */
export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

// ============================================
// Object Utilities
// ============================================

/**
 * Remove null, undefined, and empty string values from object
 */
export function omitEmpty(obj) {
  if (!obj) return {};
  
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    if (value !== null && value !== undefined && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
}

/**
 * Pick only specified keys from object
 */
export function pick(obj, keys) {
  if (!obj) return {};
  
  return keys.reduce((acc, key) => {
    if (obj.hasOwnProperty(key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

/**
 * Convert object to query string
 */
export function generateQueryString(params) {
  if (!params) return '';
  
  const cleaned = omitEmpty(params);
  const searchParams = new URLSearchParams();
  
  Object.keys(cleaned).forEach(key => {
    const value = cleaned[key];
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(key, v));
    } else {
      searchParams.append(key, value);
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// ============================================
// Array Utilities
// ============================================

/**
 * Group array items by key
 */
export function groupBy(array, key) {
  if (!Array.isArray(array)) return {};
  
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

/**
 * Sort array by key
 */
export function sortBy(array, key, order = 'asc') {
  if (!Array.isArray(array)) return [];
  
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

// ============================================
// Miscellaneous
// ============================================

/**
 * Debounce function
 */
export function debounce(fn, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random ID
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (error) {
        console.error('Failed to copy:', error);
        textArea.remove();
        return false;
      }
    }
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format time ago - alias for formatRelativeTime
 */
export function formatTimeAgo(date) {
  return formatRelativeTime(date);
}
