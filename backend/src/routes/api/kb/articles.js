// backend/src/routes/api/kb/articles.js
const express = require('express');
const { z } = require('zod');
const prisma = require('../../../utils/prismaClient');
const { authMiddleware, requirePermission, hasPermission } = require('../../../middleware/auth');
const { formatValidationError, asyncHandler } = require('../../../utils/errorHandler');

const router = express.Router();

// Validation schemas
const createArticleSchema = z.object({
  title: z.string().min(5, 'Title is too short').max(200, 'Title is too long'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().min(10, 'Content is too short'),
  excerpt: z.string().optional(),
  categoryId: z.string().uuid('Invalid category ID'),
  isPublic: z.boolean().optional().default(true),
  isPublished: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([])
});

const updateArticleSchema = createArticleSchema.partial();

/**
 * GET /api/kb/articles
 * List all articles with search and filtering
 */
router.get('/', asyncHandler(async (req, res) => {
  const { categoryId, search, tags, limit = 20, page = 1 } = req.query;
  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 20, 100);
  const skip = (pageNum - 1) * limitNum;

  const where = {
    // By default, only show published articles to non-admin users
    ...(hasPermission(req.user, 'kb:admin') ? {} : { isPublished: true })
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (tags) {
    const tagsArray = Array.isArray(tags) ? tags : [tags];
    where.tags = { hasSome: tagsArray };
  }

  const [articles, total] = await Promise.all([
    prisma.kBArticle.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        author: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    }),
    prisma.kBArticle.count({ where })
  ]);

  return res.json({
    success: true,
    data: articles,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
}));

/**
 * GET /api/kb/articles/:id
 * Get a specific article
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const article = await prisma.kBArticle.findUnique({
    where: { id: req.params.id },
    include: {
      category: { select: { id: true, name: true } },
      author: { select: { id: true, firstName: true, lastName: true, avatar: true } }
    }
  });

  if (!article) {
    return res.status(404).json({
      success: false,
      message: 'Article not found',
      code: 'NOT_FOUND'
    });
  }

  // Increment view count (simple implementation)
  await prisma.kBArticle.update({
    where: { id: req.params.id },
    data: { views: { increment: 1 } }
  });

  return res.json({
    success: true,
    data: article
  });
}));

/**
 * POST /api/kb/articles
 * Create a new KB article (protected)
 */
router.post('/',
  authMiddleware,
  requirePermission('kb:create'),
  asyncHandler(async (req, res) => {
    const parsed = createArticleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const categoryExists = await prisma.kBCategory.findUnique({
      where: { id: parsed.data.categoryId }
    });

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    const article = await prisma.kBArticle.create({
      data: {
        ...parsed.data,
        authorId: req.user.id
      },
      include: {
        category: { select: { id: true, name: true } },
        author: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article
    });
  })
);

/**
 * PUT /api/kb/articles/:id
 * Update a KB article (protected)
 */
router.put('/:id',
  authMiddleware,
  requirePermission('kb:update'),
  asyncHandler(async (req, res) => {
    const parsed = updateArticleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const article = await prisma.kBArticle.findUnique({
      where: { id: req.params.id }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
        code: 'NOT_FOUND'
      });
    }

    const updatedArticle = await prisma.kBArticle.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: {
        category: { select: { id: true, name: true } }
      }
    });

    return res.json({
      success: true,
      message: 'Article updated successfully',
      data: updatedArticle
    });
  })
);

/**
 * DELETE /api/kb/articles/:id
 * Delete a KB article (protected)
 */
router.delete('/:id',
  authMiddleware,
  requirePermission('kb:delete'),
  asyncHandler(async (req, res) => {
    const article = await prisma.kBArticle.findUnique({
      where: { id: req.params.id }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
        code: 'NOT_FOUND'
      });
    }

    await prisma.kBArticle.delete({
      where: { id: req.params.id }
    });

    return res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  })
);

/**
 * POST /api/kb/articles/:id/helpful
 * Mark an article as helpful or not (public)
 */
router.post('/:id/helpful', asyncHandler(async (req, res) => {
  const { helpful } = req.body;
  
  const article = await prisma.kBArticle.findUnique({
    where: { id: req.params.id }
  });

  if (!article) {
    return res.status(404).json({
      success: false,
      message: 'Article not found'
    });
  }

  const updatedArticle = await prisma.kBArticle.update({
    where: { id: req.params.id },
    data: {
      helpfulCount: helpful ? { increment: 1 } : article.helpfulCount,
      notHelpfulCount: !helpful ? { increment: 1 } : article.notHelpfulCount
    }
  });

  return res.json({
    success: true,
    message: 'Feedback received',
    data: {
      helpfulCount: updatedArticle.helpfulCount,
      notHelpfulCount: updatedArticle.notHelpfulCount
    }
  });
}));

module.exports = router;
