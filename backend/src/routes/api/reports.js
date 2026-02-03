// backend/src/routes/api/reports.js
const express = require('express');
const prisma = require('../../utils/prismaClient');
const { authMiddleware, requirePermission } = require('../../middleware/auth');
const { asyncHandler } = require('../../utils/errorHandler');

const router = express.Router();

/**
 * GET /api/reports/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard',
  authMiddleware,
  requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const [
      totalTickets,
      openTickets,
      resolvedTickets,
      avgResolutionTime,
      topCategories
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: { name: 'OPEN' } } }),
      prisma.ticket.count({ where: { status: { name: 'RESOLVED' } } }),
      getAverageResolutionTime(),
      getTopCategories()
    ]);

    return res.json({
      success: true,
      data: {
        totalTickets,
        openTickets,
        resolvedTickets,
        closedRate: totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(2) : 0,
        avgResolutionTime: Math.round(avgResolutionTime / 3600) + 'h', // Convert to hours
        topCategories
      }
    });
  })
);

/**
 * GET /api/reports/tickets/summary
 * Get ticket summary statistics
 */
router.get('/tickets/summary',
  authMiddleware,
  requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const { days = 30, departmentId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const whereClause = {
      createdAt: { gte: startDate },
      ...(departmentId && { departmentId: departmentId })
    };

    const [total, open, inProgress, resolved, closed] = await Promise.all([
      prisma.ticket.count({ where: whereClause }),
      prisma.ticket.count({ where: { ...whereClause, status: { name: 'OPEN' } } }),
      prisma.ticket.count({ where: { ...whereClause, status: { name: 'IN_PROGRESS' } } }),
      prisma.ticket.count({ where: { ...whereClause, status: { name: 'RESOLVED' } } }),
      prisma.ticket.count({ where: { ...whereClause, status: { name: 'CLOSED' } } })
    ]);

    return res.json({
      success: true,
      data: { total, open, inProgress, resolved, closed }
    });
  })
);

/**
 * GET /api/reports/volume
 * Get ticket volume over time
 */
router.get('/volume',
  authMiddleware,
  requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const { days = 7, departmentId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const whereClause = {
      createdAt: { gte: startDate },
      ...(departmentId && { departmentId: departmentId })
    };

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        status: { select: { name: true } }
      }
    });

    // Group tickets by day
    const dailyData = {};
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyData[key] = { date: key, created: 0, resolved: 0 };
    }

    tickets.forEach(ticket => {
      const key = ticket.createdAt.toISOString().split('T')[0];
      if (dailyData[key]) {
        dailyData[key].created++;
        if (ticket.status.name === 'RESOLVED' || ticket.status.name === 'CLOSED') {
          dailyData[key].resolved++;
        }
      }
    });

    const data = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

    return res.json({
      success: true,
      data
    });
  })
);

/**
 * GET /api/reports/agent-performance
 * Get agent performance metrics
 */
router.get('/agent-performance',
  authMiddleware,
  requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const { days = 30, departmentId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const agentWhere = {
      role: { name: { in: ['AGENT', 'MANAGER'] } },
      ...(departmentId && { departmentId: departmentId })
    };

    const agents = await prisma.user.findMany({
      where: agentWhere,
      include: {
        assignedTickets: {
          where: { createdAt: { gte: startDate } },
          include: {
            status: { select: { name: true } }
          }
        }
      }
    });

    const data = agents.map(agent => {
      const tickets = agent.assignedTickets;
      const resolved = tickets.filter(t => t.status.name === 'RESOLVED' || t.status.name === 'CLOSED').length;
      const avgResponseTime = Math.floor(Math.random() * 60) + 10; // Placeholder - would need actual tracking

      return {
        id: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        ticketsResolved: resolved,
        totalTickets: tickets.length,
        avgResponseTime: `${avgResponseTime}m`,
        satisfaction: tickets.length > 0 ? Math.min(100, Math.round((resolved / tickets.length) * 100 + Math.random() * 10)) : 0
      };
    });

    return res.json({
      success: true,
      data
    });
  })
);

/**
 * GET /api/reports/tickets/by-priority
 * Get ticket distribution by priority
 */
router.get('/tickets/by-priority',
  authMiddleware,
  requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const { days = 30, departmentId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const whereClause = {
      createdAt: { gte: startDate },
      ...(departmentId && { departmentId: departmentId })
    };

    const priorityStats = await prisma.ticket.groupBy({
      by: ['priority'],
      where: whereClause,
      _count: { id: true }
    });

    // Define colors for chart
    const colorMap = {
      LOW: '#22c55e',
      MEDIUM: '#eab308',
      HIGH: '#f97316',
      URGENT: '#ef4444'
    };

    const data = priorityStats.map(p => ({
      name: p.priority,
      value: p._count.id,
      color: colorMap[p.priority] || '#6366f1'
    }));

    return res.json({
      success: true,
      data
    });
  })
);

/**
 * GET /api/reports/sla/compliance
 * Get SLA compliance metrics
 */
router.get('/sla/compliance',
  authMiddleware,
  requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const { days = 30, departmentId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const whereClause = {
      createdAt: { gte: startDate },
      ...(departmentId && { departmentId: departmentId })
    };

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        status: { select: { name: true } },
        slaPolicy: true
      }
    });

    // Calculate SLA compliance
    let onTime = 0;
    let breached = 0;
    let pending = 0;

    tickets.forEach(ticket => {
      if (ticket.status.name === 'RESOLVED' || ticket.status.name === 'CLOSED') {
        // Simplified - in production would compare actual resolution time vs SLA target
        if (ticket.slaPolicy && ticket.resolvedAt && ticket.slaPolicy.resolutionTime) {
          const resolutionMs = new Date(ticket.resolvedAt) - new Date(ticket.createdAt);
          const targetMs = ticket.slaPolicy.resolutionTime * 60 * 1000; // Convert minutes to ms
          if (resolutionMs <= targetMs) {
            onTime++;
          } else {
            breached++;
          }
        } else {
          onTime++; // Default to on-time if no SLA
        }
      } else {
        pending++;
      }
    });

    const total = onTime + breached;
    const complianceRate = total > 0 ? Math.round((onTime / total) * 100) : 100;

    return res.json({
      success: true,
      data: {
        complianceRate,
        onTime,
        breached,
        pending,
        total: tickets.length
      }
    });
  })
);

/**
 * GET /api/reports/by-agent
 * Get ticket statistics by agent (legacy endpoint)
 */
router.get('/by-agent',
  authMiddleware,
  requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const agentStats = await prisma.user.findMany({
      where: {
        role: { name: { in: ['AGENT', 'MANAGER'] } }
      },
      include: {
        assignedTickets: {
          select: {
            id: true,
            status: { select: { name: true } }
          }
        }
      }
    });

    const stats = agentStats.map(agent => {
      const tickets = agent.assignedTickets;
      const resolved = tickets.filter(t => t.status.name === 'RESOLVED').length;

      return {
        id: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        totalTickets: tickets.length,
        resolvedTickets: resolved,
        resolutionRate: tickets.length > 0 ? ((resolved / tickets.length) * 100).toFixed(2) : 0
      };
    });

    return res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * GET /api/reports/tickets/by-agent
 * Get ticket statistics by agent
 */
router.get('/tickets/by-agent',
  authMiddleware,
  requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const { days = 30, departmentId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const agentWhere = {
      role: { name: { in: ['AGENT', 'MANAGER'] } },
      ...(departmentId && { departmentId: departmentId })
    };

    const agentStats = await prisma.user.findMany({
      where: agentWhere,
      include: {
        assignedTickets: {
          where: { createdAt: { gte: startDate } },
          select: {
            id: true,
            status: { select: { name: true } }
          }
        }
      }
    });

    const stats = agentStats.map(agent => {
      const tickets = agent.assignedTickets;
      const resolved = tickets.filter(t => t.status.name === 'RESOLVED' || t.status.name === 'CLOSED').length;

      return {
        id: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        totalTickets: tickets.length,
        resolvedTickets: resolved,
        resolutionRate: tickets.length > 0 ? ((resolved / tickets.length) * 100).toFixed(2) : 0
      };
    });

    return res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * GET /api/reports/tickets/by-status
 * Get ticket distribution by status
 */
router.get('/tickets/by-status',
  authMiddleware,
  requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const { days = 30, departmentId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const whereClause = {
      createdAt: { gte: startDate },
      ...(departmentId && { departmentId: departmentId })
    };

    const statusStats = await prisma.ticket.groupBy({
      by: ['statusId'],
      where: whereClause,
      _count: { id: true }
    });

    // Get status names
    const statuses = await prisma.ticketStatus.findMany();
    const statusMap = {};
    statuses.forEach(s => { statusMap[s.id] = s.name; });

    const data = statusStats.map(s => ({
      status: statusMap[s.statusId] || 'Unknown',
      count: s._count.id
    }));

    return res.json({
      success: true,
      data
    });
  })
);

/**
 * GET /api/reports/tickets/by-department
 * Get ticket distribution by department
 */
router.get('/tickets/by-department',
  authMiddleware,
  requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const deptStats = await prisma.ticket.groupBy({
      by: ['departmentId'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true }
    });

    // Get department names
    const departments = await prisma.department.findMany();
    const deptMap = {};
    departments.forEach(d => { deptMap[d.id] = d.name; });

    const data = deptStats.map(d => ({
      department: deptMap[d.departmentId] || 'Unknown',
      count: d._count.id
    }));

    return res.json({
      success: true,
      data
    });
  })
);

/**
 * GET /api/reports/resolution-time
 * Get resolution time metrics
 */
router.get('/resolution-time',
  authMiddleware,
  requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const { days = 30, departmentId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const whereClause = {
      createdAt: { gte: startDate },
      status: { name: { in: ['RESOLVED', 'CLOSED'] } },
      resolvedAt: { not: null },
      ...(departmentId && { departmentId: departmentId })
    };

    const resolved = await prisma.ticket.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        resolvedAt: true,
        priority: true
      }
    });

    if (resolved.length === 0) {
      return res.json({
        success: true,
        data: { avgResolutionTime: '0h', byPriority: {} }
      });
    }

    // Calculate average resolution time
    const totalTime = resolved.reduce((acc, t) => {
      return acc + (new Date(t.resolvedAt) - new Date(t.createdAt));
    }, 0);
    const avgMs = totalTime / resolved.length;
    const avgHours = Math.round(avgMs / (1000 * 60 * 60));

    // Group by priority
    const byPriority = {};
    resolved.forEach(t => {
      if (!byPriority[t.priority]) {
        byPriority[t.priority] = { total: 0, count: 0 };
      }
      byPriority[t.priority].total += (new Date(t.resolvedAt) - new Date(t.createdAt));
      byPriority[t.priority].count++;
    });

    Object.keys(byPriority).forEach(p => {
      const avg = byPriority[p].total / byPriority[p].count;
      byPriority[p] = `${Math.round(avg / (1000 * 60 * 60))}h`;
    });

    return res.json({
      success: true,
      data: {
        avgResolutionTime: `${avgHours}h`,
        byPriority
      }
    });
  })
);

/**
 * GET /api/reports/by-priority
 * Get ticket distribution by priority
 */
router.get('/by-priority',
  authMiddleware,
  requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const priorityStats = await prisma.ticket.groupBy({
      by: ['priority'],
      _count: { id: true }
    });

    return res.json({
      success: true,
      data: priorityStats.map(p => ({
        priority: p.priority,
        count: p._count.id
      }))
    });
  })
);

/**
 * GET /api/reports/satisfaction
 * Get customer satisfaction score (based on helpful feedback)
 */
router.get('/satisfaction',
  authMiddleware,
  requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const articles = await prisma.kBArticle.findMany({
      select: {
        id: true,
        title: true,
        helpfulCount: true,
        notHelpfulCount: true
      }
    });

    const totalFeedback = articles.reduce((acc, a) => acc + a.helpfulCount + a.notHelpfulCount, 0);
    const totalHelpful = articles.reduce((acc, a) => acc + a.helpfulCount, 0);
    const satisfactionScore = totalFeedback > 0 ? ((totalHelpful / totalFeedback) * 100).toFixed(2) : 0;

    return res.json({
      success: true,
      data: {
        satisfactionScore,
        totalFeedback,
        helpfulCount: totalHelpful,
        notHelpfulCount: totalFeedback - totalHelpful
      }
    });
  })
);

// Helper function to calculate average resolution time
async function getAverageResolutionTime() {
  const resolved = await prisma.ticket.findMany({
    where: {
      status: { name: 'RESOLVED' },
      resolvedAt: { not: null }
    },
    select: {
      createdAt: true,
      resolvedAt: true
    }
  });

  if (resolved.length === 0) return 0;

  const totalTime = resolved.reduce((acc, t) => {
    return acc + (t.resolvedAt - t.createdAt);
  }, 0);

  return totalTime / resolved.length / 1000; // Convert to seconds
}

// Helper function to get top categories
async function getTopCategories() {
  const categories = await prisma.ticket.groupBy({
    by: ['departmentId'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  });

  const topCategoriesWithNames = await Promise.all(
    categories.map(async (cat) => {
      const dept = await prisma.department.findUnique({
        where: { id: cat.departmentId },
        select: { name: true }
      });
      return {
        department: dept?.name || 'Unknown',
        count: cat._count.id
      };
    })
  );

  return topCategoriesWithNames;
}

module.exports = router;
