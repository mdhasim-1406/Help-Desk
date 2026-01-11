// backend/src/routes/api/kb/categories.js
const express = require('express');
const { z } = require('zod');
const prisma = require('../../../utils/prismaClient');
const { authMiddleware, requirePermission, hasPermission } = require('../../../middleware/auth');
const { formatValidationError, asyncHandler } = require('../../../utils/errorHandler');

const router = express.Router();

// Validation schemas
const createKBCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  parentId: z.string().uuid('Invalid parent ID').optional(),
  icon: z.string().max(50, 'Icon is too long').optional(),
  order: z.number().int().min(0, 'Order must be positive').optional(),
  isActive: z.boolean().optional()
});

const updateKBCategorySchema = createKBCategorySchema.partial();

/**
 * GET /api/kb/categories
 * List all active KB categories
 */
router.get('/', asyncHandler(async (req, res) => {
  const categories = await prisma.kBCategory.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { articles: true } },
      parent: { select: { id: true, name: true } }
    }
  });

  return res.json({
    success: true,
    message: 'Categories retrieved successfully',
    data: categories
  });
}));

/**
 * GET /api/kb/categories/:id
 * Get a specific KB category
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const category = await prisma.kBCategory.findUnique({
    where: { id: req.params.id },
    include: {
      _count: { select: { articles: true } },
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true, order: true } }
    }
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found',
      code: 'NOT_FOUND'
    });
  }

  return res.json({
    success: true,
    message: 'Category retrieved successfully',
    data: category
  });
}));

/**
 * POST /api/kb/categories
 * Create a new KB category (protected)
 */
router.post('/',
  authMiddleware,
  requirePermission('kb:create'),
  asyncHandler(async (req, res) => {
    // Validate input
    const parsed = createKBCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const validatedData = parsed.data;

    // Verify parent exists if provided
    if (validatedData.parentId) {
      const parentExists = await prisma.kBCategory.findUnique({
        where: { id: validatedData.parentId }
      });

      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found',
          code: 'PARENT_NOT_FOUND'
        });
      }
    }

    // Auto-assign order if not provided
    if (validatedData.order === undefined) {
      const maxOrder = await prisma.kBCategory.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true }
      });
      validatedData.order = (maxOrder?.order ?? -1) + 1;
    }

    const category = await prisma.kBCategory.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        parentId: validatedData.parentId,
        icon: validatedData.icon,
        order: validatedData.order,
        isActive: validatedData.isActive ?? true
      },
      include: {
        parent: { select: { id: true, name: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  })
);

/**
 * PATCH /api/kb/categories/:id
 * Update a KB category (protected)
 */
router.patch('/:id',
  authMiddleware,
  requirePermission('kb:write'),
  asyncHandler(async (req, res) => {
    // Validate input
    const parsed = updateKBCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const validatedData = parsed.data;

    // Verify category exists
    const existingCategory = await prisma.kBCategory.findUnique({
      where: { id: req.params.id }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        code: 'NOT_FOUND'
      });
    }

    // Verify parent exists if provided
    if (validatedData.parentId && validatedData.parentId !== existingCategory.parentId) {
      const parentExists = await prisma.kBCategory.findUnique({
        where: { id: validatedData.parentId }
      });

      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found',
          code: 'PARENT_NOT_FOUND'
        });
      }
    }

    const updatedCategory = await prisma.kBCategory.update({
      where: { id: req.params.id },
      data: validatedData,
      include: {
        parent: { select: { id: true, name: true } }
      }
    });

    return res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  })
);

/**
 * DELETE /api/kb/categories/:id
 * Delete a KB category (protected)
 */
router.delete('/:id',
  authMiddleware,
  requirePermission('kb:delete'),
  asyncHandler(async (req, res) => {
    // Verify category exists
    const category = await prisma.kBCategory.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { articles: true, children: true } } }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        code: 'NOT_FOUND'
      });
    }

    // Check if category has articles or child categories
    if (category._count.articles > 0 || category._count.children > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with articles or child categories',
        code: 'CATEGORY_NOT_EMPTY'
      });
    }

    await prisma.kBCategory.delete({
      where: { id: req.params.id }
    });

    return res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  })
);

module.exports = router;
