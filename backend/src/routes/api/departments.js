// backend/src/routes/api/departments.js
const express = require('express');
const { z } = require('zod');
const prisma = require('../../utils/prismaClient');
const { authMiddleware, requirePermission } = require('../../middleware/auth');
const { formatValidationError, asyncHandler } = require('../../utils/errorHandler');

const router = express.Router();

// Validation schemas
const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  managerId: z.string().uuid('Invalid manager ID').optional()
});

const updateDepartmentSchema = createDepartmentSchema.partial();

/**
 * GET /api/departments
 * List all departments
 */
router.get('/', asyncHandler(async (req, res) => {
  const departments = await prisma.department.findMany({
    include: {
      manager: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { members: true, tickets: true } }
    },
    orderBy: { name: 'asc' }
  });

  return res.json({
    success: true,
    data: departments
  });
}));

/**
 * GET /api/departments/:id
 * Get department details
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const department = await prisma.department.findUnique({
    where: { id: req.params.id },
    include: {
      manager: { select: { id: true, firstName: true, lastName: true, email: true } },
      members: { select: { id: true, firstName: true, lastName: true, email: true, role: { select: { name: true } } } }
    }
  });

  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  return res.json({
    success: true,
    data: department
  });
}));

/**
 * POST /api/departments
 * Create a new department (admin only)
 */
router.post('/',
  authMiddleware,
  requirePermission('departments:create'),
  asyncHandler(async (req, res) => {
    const parsed = createDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    if (parsed.data.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: parsed.data.managerId }
      });

      if (!manager) {
        return res.status(404).json({
          success: false,
          message: 'Manager not found'
        });
      }
    }

    const department = await prisma.department.create({
      data: parsed.data,
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  })
);

/**
 * PUT /api/departments/:id
 * Update a department (admin only)
 */
router.put('/:id',
  authMiddleware,
  requirePermission('departments:update'),
  asyncHandler(async (req, res) => {
    const parsed = updateDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    if (parsed.data.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: parsed.data.managerId }
      });

      if (!manager) {
        return res.status(404).json({
          success: false,
          message: 'Manager not found'
        });
      }
    }

    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    return res.json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  })
);

/**
 * DELETE /api/departments/:id
 * Delete a department (admin only)
 */
router.delete('/:id',
  authMiddleware,
  requirePermission('departments:delete'),
  asyncHandler(async (req, res) => {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { members: true } } }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    if (department._count.members > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with active members'
      });
    }

    await prisma.department.delete({
      where: { id: req.params.id }
    });

    return res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  })
);

module.exports = router;
