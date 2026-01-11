// backend/src/routes/api/notifications.js
const express = require('express');
const prisma = require('../../utils/prismaClient');
const { authMiddleware } = require('../../middleware/auth');
const { asyncHandler } = require('../../utils/errorHandler');

const router = express.Router();

/**
 * GET /api/notifications
 * List notifications for the current user
 */
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { limit = 20, page = 1, isRead } = req.query;
  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 20, 50);
  const skip = (pageNum - 1) * limitNum;

  const where = {
    userId: req.user.id
  };

  if (isRead !== undefined) {
    where.isRead = isRead === 'true';
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    }),
    prisma.notification.count({ where })
  ]);

  return res.json({
    success: true,
    data: notifications,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  });
}));

/**
 * GET /api/notifications/unread
 * Get unread notification count
 */
router.get('/unread', authMiddleware, asyncHandler(async (req, res) => {
  const count = await prisma.notification.count({
    where: {
      userId: req.user.id,
      isRead: false
    }
  });

  return res.json({
    success: true,
    data: count
  });
}));

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', authMiddleware, asyncHandler(async (req, res) => {
  const notification = await prisma.notification.findUnique({
    where: { id: req.params.id }
  });

  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  return res.json({
    success: true,
    data: updated
  });
}));

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authMiddleware, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: {
      userId: req.user.id,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  return res.json({
    success: true,
    message: 'All notifications marked as read'
  });
}));

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const notification = await prisma.notification.findUnique({
    where: { id: req.params.id }
  });

  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  await prisma.notification.delete({
    where: { id: req.params.id }
  });

  return res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
}));

module.exports = router;
