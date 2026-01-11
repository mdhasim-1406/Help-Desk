// ============================================
// Field Validators
// ============================================

/**
 * Validate required field
 */
export function validateRequired(value) {
  const isValid = value !== null && value !== undefined && value !== '';
  return {
    valid: isValid,
    message: isValid ? '' : 'This field is required',
  };
}

/**
 * Validate email format
 */
export function validateEmail(value) {
  if (!value) {
    return { valid: false, message: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(value);
  
  return {
    valid: isValid,
    message: isValid ? '' : 'Please enter a valid email address',
  };
}

/**
 * Validate minimum length
 */
export function validateMinLength(value, min) {
  if (!value) {
    return { valid: false, message: 'This field is required' };
  }
  
  const isValid = value.length >= min;
  return {
    valid: isValid,
    message: isValid ? '' : `Must be at least ${min} characters`,
  };
}

/**
 * Validate maximum length
 */
export function validateMaxLength(value, max) {
  if (!value) {
    return { valid: true, message: '' };
  }
  
  const isValid = value.length <= max;
  return {
    valid: isValid,
    message: isValid ? '' : `Must be no more than ${max} characters`,
  };
}

/**
 * Validate password strength
 */
export function validatePassword(value) {
  if (!value) {
    return {
      valid: false,
      message: 'Password is required',
      strength: 'weak',
    };
  }
  
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  
  const checks = [
    value.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
  ];
  
  const passedChecks = checks.filter(Boolean).length;
  
  let strength = 'weak';
  if (passedChecks >= 4) strength = 'strong';
  else if (passedChecks >= 3) strength = 'medium';
  
  const isValid = value.length >= minLength && passedChecks >= 3;
  
  let message = '';
  if (!isValid) {
    const missing = [];
    if (value.length < minLength) missing.push(`${minLength}+ characters`);
    if (!hasUpperCase) missing.push('uppercase letter');
    if (!hasLowerCase) missing.push('lowercase letter');
    if (!hasNumber) missing.push('number');
    if (!hasSpecialChar) missing.push('special character');
    
    message = `Password must contain: ${missing.slice(0, 3).join(', ')}`;
  }
  
  return {
    valid: isValid,
    message,
    strength,
  };
}

/**
 * Validate password match
 */
export function validatePasswordMatch(password, confirmPassword) {
  if (!confirmPassword) {
    return { valid: false, message: 'Please confirm your password' };
  }
  
  const isValid = password === confirmPassword;
  return {
    valid: isValid,
    message: isValid ? '' : 'Passwords do not match',
  };
}

/**
 * Validate file size
 */
export function validateFileSize(file, maxMB = 10) {
  if (!file) {
    return { valid: false, message: 'No file selected' };
  }
  
  const maxBytes = maxMB * 1024 * 1024;
  const isValid = file.size <= maxBytes;
  
  return {
    valid: isValid,
    message: isValid ? '' : `File size must be less than ${maxMB}MB`,
  };
}

/**
 * Validate file type
 */
export function validateFileType(file, allowedTypes = []) {
  if (!file) {
    return { valid: false, message: 'No file selected' };
  }
  
  if (allowedTypes.length === 0) {
    return { valid: true, message: '' };
  }
  
  const isValid = allowedTypes.includes(file.type);
  
  return {
    valid: isValid,
    message: isValid ? '' : 'File type not allowed',
  };
}

// ============================================
// Password Strength
// ============================================

/**
 * Get password strength level
 */
export function getPasswordStrength(password) {
  if (!password) return 'weak';
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const checks = [
    password.length >= 8,
    password.length >= 12,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
  ];
  
  const passedChecks = checks.filter(Boolean).length;
  
  if (passedChecks >= 5) return 'strong';
  if (passedChecks >= 3) return 'medium';
  return 'weak';
}

// ============================================
// Form Helpers
// ============================================

/**
 * Validate entire form with rules
 * 
 * @param {Object} values - Form values
 * @param {Object} rules - Validation rules
 * @returns {Object} - { isValid, errors }
 * 
 * Example rules:
 * {
 *   email: ['required', 'email'],
 *   password: ['required', { min: 8 }],
 *   name: ['required', { max: 50 }]
 * }
 */
export function validateForm(values, rules) {
  const errors = {};
  let isValid = true;
  
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = values[field];
    
    for (const rule of fieldRules) {
      let result;
      
      if (rule === 'required') {
        result = validateRequired(value);
      } else if (rule === 'email') {
        result = validateEmail(value);
      } else if (typeof rule === 'object') {
        if (rule.min !== undefined) {
          result = validateMinLength(value, rule.min);
        } else if (rule.max !== undefined) {
          result = validateMaxLength(value, rule.max);
        }
      }
      
      if (result && !result.valid) {
        errors[field] = result.message;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  });
  
  return { isValid, errors };
}
