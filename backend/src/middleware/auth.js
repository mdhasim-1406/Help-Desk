// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prismaClient');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Extract JWT token from Authorization header or cookies
 */
function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.substring(7);
  }
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }
  return null;
}

/**
 * Get user from token with role and permissions
 */
async function getUserFromToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true, department: true }
    });

    if (!user || !user.isActive) return null;

    // Parse permissions (stored as JSON in role)
    let permissions = [];
    try {
      if (typeof user.role.permissions === 'string') {
        permissions = JSON.parse(user.role.permissions);
      } else if (Array.isArray(user.role.permissions)) {
        permissions = user.role.permissions;
      }
    } catch (e) {
      permissions = [];
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      isActive: user.isActive,
      role: user.role.name, // Flatten role to string for frontend compatibility
      roleId: user.role.id,
      roleDisplayName: user.role.displayName,
      departmentId: user.departmentId,
      departmentName: user.department?.name,
      permissions
    };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { expired: true };
    }
    console.error('Token verification error:', err.message);
    return null;
  }
}

/**
 * Middleware to authenticate and attach user to request
 */
async function authMiddleware(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No token provided',
        code: 'NO_TOKEN'
      });
    }

    const user = await getUserFromToken(token);

    if (user?.expired) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Check if user has a permission
 */
function hasPermission(userPermissions = [], permission) {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;

  // Admin wildcard
  if (userPermissions.includes('*')) return true;

  // Exact match
  if (userPermissions.includes(permission)) return true;

  // Resource wildcard (e.g., 'tickets:*' covers 'tickets:read', 'tickets:write')
  const [resource] = permission.split(':');
  if (userPermissions.includes(`${resource}:*`)) return true;

  return false;
}

/**
 * Middleware to check permissions
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 'NO_USER'
      });
    }

    if (!hasPermission(req.user.permissions, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Insufficient permissions',
        code: 'FORBIDDEN',
        required: permission
      });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  requirePermission,
  extractToken,
  getUserFromToken,
  hasPermission,
  JWT_SECRET
};
