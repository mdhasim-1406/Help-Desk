// backend/src/routes/api/sla.js
const express = require('express');
const prisma = require('../../utils/prismaClient');
const { authMiddleware, requirePermission } = require('../../middleware/auth');
const { asyncHandler } = require('../../utils/errorHandler');

const router = express.Router();

/**
 * GET /api/sla/policies
 * Get all SLA policies
 */
router.get('/policies', asyncHandler(async (req, res) => {
  const policies = await prisma.sLAPolicy.findMany({
    where: { isActive: true },
    orderBy: { priority: 'asc' }
  });

  return res.json({
    success: true,
    data: policies
  });
}));

/**
 * GET /api/sla/breaches
 * Get SLA breaches for tickets (admin only)
 */
router.get('/breaches',
  authMiddleware,
  requirePermission('sla:read'),
  asyncHandler(async (req, res) => {
    const breaches = await prisma.ticket.findMany({
      where: {
        OR: [
          { responseBreached: true },
          { resolutionBreached: true }
        ]
      },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        priority: true,
        status: { select: { name: true } },
        customer: { select: { firstName: true, lastName: true } },
        responseBreached: true,
        resolutionBreached: true,
        responseDueAt: true,
        resolutionDueAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: breaches
    });
  })
);

/**
 * GET /api/sla/stats
 * Get SLA statistics (admin only)
 */
router.get('/stats',
  authMiddleware,
  requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const totalTickets = await prisma.ticket.count();
    const breachedTickets = await prisma.ticket.count({
      where: {
        OR: [
          { responseBreached: true },
          { resolutionBreached: true }
        ]
      }
    });

    const byPriority = await prisma.ticket.groupBy({
      by: ['priority'],
      _count: { id: true }
    });

    const stats = {
      totalTickets,
      breachedTickets,
      breachRate: totalTickets > 0 ? ((breachedTickets / totalTickets) * 100).toFixed(2) : 0,
      byPriority: byPriority.map(p => ({
        priority: p.priority,
        count: p._count.id
      }))
    };

    return res.json({
      success: true,
      data: stats
    });
  })
);

module.exports = router;
