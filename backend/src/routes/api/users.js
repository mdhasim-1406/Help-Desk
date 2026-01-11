// backend/src/routes/api/users.js
const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const prisma = require('../../utils/prismaClient');
const { authMiddleware, requirePermission } = require('../../middleware/auth');
const { formatValidationError, asyncHandler } = require('../../utils/errorHandler');

const router = express.Router();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  roleId: z.string().uuid('Invalid role ID'),
  departmentId: z.string().uuid('Invalid department ID').optional(),
  phone: z.string().optional()
});

const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(6).optional()
});

/**
 * GET /api/users
 * List users with filtering (admin only)
 */
router.get('/',
  authMiddleware,
  requirePermission('users:read'),
  asyncHandler(async (req, res) => {
    const { role, departmentId, search } = req.query;

    const where = {};
    if (role) {
      where.role = { name: role };
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: { select: { id: true, name: true, displayName: true } },
        department: { select: { id: true, name: true } },
        isActive: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: users
    });
  })
);

/**
 * GET /api/users/agents
 * Get simplified list of agents for assignment
 */
router.get('/agents', authMiddleware, asyncHandler(async (req, res) => {
  const { departmentId } = req.query;
  
  const where = {
    role: {
      name: { in: ['AGENT', 'MANAGER', 'ADMIN'] }
    },
    isActive: true
  };

  if (departmentId) {
    where.departmentId = departmentId;
  }

  const agents = await prisma.user.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      department: { select: { name: true } }
    }
  });

  return res.json({
    success: true,
    data: agents
  });
}));

/**
 * GET /api/users/:id
 * Get user details
 */
router.get('/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    // Users can view themselves, or admins can view anyone
    if (req.user.id !== req.params.id && !requirePermission('users:read')) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        role: true,
        department: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Don't return password hash
    delete user.passwordHash;
    delete user.refreshToken;

    return res.json({
      success: true,
      data: user
    });
  })
);

/**
 * POST /api/users
 * Create a new user (admin only)
 */
router.post('/',
  authMiddleware,
  requirePermission('users:create'),
  asyncHandler(async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...parsed.data,
        passwordHash: hashedPassword
      },
      include: {
        role: true,
        department: true
      }
    });

    delete user.passwordHash;

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  })
);

/**
 * PUT /api/users/:id
 * Update user (admin or self)
 */
router.put('/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    if (req.user.id !== req.params.id && !requirePermission('users:update')) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const updateData = { ...parsed.data };
    if (updateData.password) {
      updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
      delete updateData.password;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        role: true,
        department: true
      }
    });

    delete user.passwordHash;

    return res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  })
);

module.exports = router;
