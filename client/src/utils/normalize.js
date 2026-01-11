/**
 * Safely extracts string value from prop that might be string OR object
 * Prevents "toLowerCase is not a function" and "Objects are not valid as React child"
 * 
 * @param {*} value - The value to normalize (could be string, object, null, undefined)
 * @param {string} fallback - Default value if extraction fails
 * @returns {string} Normalized string value
 */
export function normalizeToString(value, fallback = 'unknown') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value.name || value.displayName || value.label || value.title || fallback;
  }
  return String(value);
}

/**
 * Normalizes and lowercases for key lookups
 * Converts spaces to underscores for consistent lookup keys
 * 
 * @param {*} value - The value to normalize
 * @param {string} fallback - Default value if extraction fails
 * @returns {string} Normalized lowercase key
 */
export function normalizeToKey(value, fallback = 'unknown') {
  return normalizeToString(value, fallback).toLowerCase().replace(/\s+/g, '_');
}
