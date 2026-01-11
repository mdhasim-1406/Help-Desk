// backend/src/utils/errorHandler.js

/**
 * Format API error response
 */
function formatError(message, code = 'ERROR', statusCode = 500, details = null) {
  return {
    success: false,
    message,
    code,
    statusCode,
    ...(details && { details })
  };
}

/**
 * Format validation error from Zod
 */
function formatValidationError(zodError) {
  const errors = (zodError.issues || zodError.errors || []).map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }));
  
  return {
    success: false,
    message: 'Validation error',
    code: 'VALIDATION_ERROR',
    statusCode: 400,
    errors
  };
}

/**
 * Handle async route errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  formatError,
  formatValidationError,
  asyncHandler
};
