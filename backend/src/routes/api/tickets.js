// backend/src/routes/api/tickets.js
const express = require('express');
const { z } = require('zod');
const prisma = require('../../utils/prismaClient');
const { authMiddleware, requirePermission, hasPermission } = require('../../middleware/auth');
const { formatValidationError, asyncHandler } = require('../../utils/errorHandler');
const { sanitizeMiddleware } = require('../../utils/sanitizer');

const router = express.Router();

// Validation schemas
const createTicketSchema = z.object({
  title: z.string().min(5, 'Title is too short').max(200, 'Title is too long'),
  description: z.string().min(10, 'Description is too short').max(5000, 'Description is too long'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  status: z.string().optional(), // Using status name, we will resolve to statusId
  departmentId: z.string().uuid('Invalid department ID').optional(),
  assignedToId: z.string().uuid('Invalid user ID').optional()
});

const updateTicketSchema = createTicketSchema.partial();

const addCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment is too long'),
  isInternal: z.boolean().optional().default(false)
});

/**
 * GET /api/tickets
 * List all tickets (with pagination and filtering)
 */
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, priority, assignedToId } = req.query;
  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 20, 100);
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  // Add filters if provided
  if (status) {
    where.status = { name: status };
  }
  if (priority) where.priority = priority;
  if (assignedToId) where.assignedToId = assignedToId;

  // Role-based filtering
  const userRole = req.user.role?.toUpperCase();

  if (userRole === 'CUSTOMER') {
    // Customers can only see their own tickets
    where.customerId = req.user.id;
  } else if (userRole === 'AGENT') {
    // Agents can see tickets assigned to them or unassigned tickets in their department
    where.OR = [
      { assignedToId: req.user.id },
      { assignedToId: null, departmentId: req.user.departmentId }
    ];
  } else if (userRole === 'MANAGER') {
    // Managers can see all tickets in their department
    where.departmentId = req.user.departmentId;
  }
  // ADMIN and SUPER_ADMIN can see all tickets (no filter)

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        status: { select: { name: true, displayName: true, color: true } },
        priority: true,
        createdAt: true,
        updatedAt: true,
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { comments: true, attachments: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    }),
    prisma.ticket.count({ where })
  ]);

  return res.json({
    success: true,
    message: 'Tickets retrieved successfully',
    data: tickets,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
}));

/**
 * GET /api/tickets/:id
 * Get ticket details with comments and attachments
 */
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      status: { select: { id: true, name: true, displayName: true, color: true } },
      department: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } }
        }
      },
      attachments: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found',
      code: 'NOT_FOUND'
    });
  }

  // Authorization check - role-based access
  const userRole = req.user.role;
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const isManager = userRole === 'MANAGER' && ticket.departmentId === req.user.departmentId;
  const isAgent = userRole === 'AGENT' && ticket.departmentId === req.user.departmentId;
  const isOwner = req.user.id === ticket.customerId;
  const isAssigned = req.user.id === ticket.assignedToId;

  const canView = isAdmin || isManager || isAgent || isOwner || isAssigned;

  if (!canView) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to view this ticket',
      code: 'FORBIDDEN'
    });
  }

  return res.json({
    success: true,
    message: 'Ticket retrieved successfully',
    data: ticket
  });
}));

/**
 * POST /api/tickets
 * Create a new ticket (protected)
 */
router.post('/',
  authMiddleware,
  requirePermission('tickets:create'),
  sanitizeMiddleware(['title', 'description']),
  asyncHandler(async (req, res) => {
    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const validatedData = parsed.data;

    // Resolve statusId from name or use default
    let statusId;
    if (validatedData.status) {
      const statusObj = await prisma.ticketStatus.findUnique({
        where: { name: validatedData.status }
      });
      if (statusObj) statusId = statusObj.id;
    }

    if (!statusId) {
      const defaultStatus = await prisma.ticketStatus.findFirst({
        where: { isDefault: true }
      });
      if (!defaultStatus) {
        return res.status(500).json({
          success: false,
          message: 'Default ticket status not configured',
          code: 'STATUS_NOT_FOUND'
        });
      }
      statusId = defaultStatus.id;
    }

    // Verify department exists if provided
    if (validatedData.departmentId) {
      const departmentExists = await prisma.department.findUnique({
        where: { id: validatedData.departmentId }
      });

      if (!departmentExists) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }
    }

    // Verify assigned user exists if provided
    if (validatedData.assignedToId) {
      const userExists = await prisma.user.findUnique({
        where: { id: validatedData.assignedToId }
      });

      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
    }

    // Generate ticket number (very basic, in real app use sequence)
    const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        statusId,
        departmentId: validatedData.departmentId,
        customerId: req.user.id
        // assignedToId intentionally omitted - tickets must be assigned by managers via PATCH or /assign endpoint
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        status: { select: { name: true, displayName: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket
    });
  })
);

/**
 * PATCH /api/tickets/:id
 * Update ticket details (protected)
 */
router.patch('/:id',
  authMiddleware,
  requirePermission('tickets:write'),
  sanitizeMiddleware(['title', 'description']),
  asyncHandler(async (req, res) => {
    const parsed = updateTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const validatedData = parsed.data;

    // Verify ticket exists
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: req.params.id }
    });

    if (!existingTicket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
        code: 'NOT_FOUND'
      });
    }

    // Authorization check - role-based access
    const userRole = req.user.role;
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
    const isOwner = req.user.id === existingTicket.customerId;
    const isAssigned = req.user.id === existingTicket.assignedToId;
    const isManager = userRole === 'MANAGER' && existingTicket.departmentId === req.user.departmentId;
    const isAgent = userRole === 'AGENT' && existingTicket.departmentId === req.user.departmentId;

    const canUpdate = isAdmin || isOwner || isAssigned || isManager || isAgent;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this ticket',
        code: 'FORBIDDEN'
      });
    }

    const updateData = {};

    // Copy over fields except status (we'll handle it separately)
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority;
    if (validatedData.departmentId !== undefined) updateData.departmentId = validatedData.departmentId;
    if (validatedData.assignedToId !== undefined) updateData.assignedToId = validatedData.assignedToId;

    // If updating status, resolve statusId
    if (validatedData.status) {
      const statusObj = await prisma.ticketStatus.findUnique({
        where: { name: validatedData.status }
      });
      if (!statusObj) {
        return res.status(400).json({
          success: false,
          message: `Invalid status: ${validatedData.status}`,
          code: 'INVALID_STATUS'
        });
      }
      updateData.statusId = statusObj.id;
    }

    // If updating department, verify it exists
    if (updateData.departmentId) {
      const departmentExists = await prisma.department.findUnique({
        where: { id: updateData.departmentId }
      });

      if (!departmentExists) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND'
        });
      }
    }

    // If reassigning, verify user exists
    if (updateData.assignedToId) {
      const userExists = await prisma.user.findUnique({
        where: { id: updateData.assignedToId }
      });

      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        status: { select: { name: true, displayName: true } }
      }
    });

    return res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: updatedTicket
    });
  })
);

/**
 * POST /api/tickets/:id/assign
 * Assign ticket to an agent (manager/admin only)
 */
router.post('/:id/assign',
  authMiddleware,
  requirePermission('tickets:write'),
  asyncHandler(async (req, res) => {
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: 'agentId is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
        code: 'NOT_FOUND'
      });
    }

    // RBAC: Only managers/admins can assign
    const userRole = req.user.role;
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
    const isManager = userRole === 'MANAGER' && ticket.departmentId === req.user.departmentId;

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'Only managers can assign tickets',
        code: 'FORBIDDEN'
      });
    }

    // Verify agent exists
    const agent = await prisma.user.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { assignedToId: agentId },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        status: { select: { name: true, displayName: true } }
      }
    });

    return res.json({
      success: true,
      message: 'Ticket assigned successfully',
      data: updatedTicket
    });
  })
);

/**
 * GET /api/tickets/:id/messages
 * Get all messages/comments for a ticket
 */
router.get('/:id/messages',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const messages = await prisma.ticketComment.findMany({
      where: { ticketId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } }
      }
    });

    return res.json({
      success: true,
      data: messages
    });
  })
);

/**
 * POST /api/tickets/:id/messages
 * Add a message/comment to a ticket (protected)
 */
router.post('/:id/messages',
  authMiddleware,
  sanitizeMiddleware(['content']),
  asyncHandler(async (req, res) => {
    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
        code: 'NOT_FOUND'
      });
    }

    // Authorization check
    // Authorization check - role-based access
    const userRole = req.user.role?.toUpperCase();
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
    const isOwner = req.user.id === ticket.customerId;
    const isAssigned = req.user.id === ticket.assignedToId;
    const isManager = userRole === 'MANAGER' && ticket.departmentId === req.user.departmentId;
    const isAgent = userRole === 'AGENT' && ticket.departmentId === req.user.departmentId;

    const canComment = isAdmin || isOwner || isAssigned || isManager || isAgent;

    if (!canComment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to comment on this ticket',
        code: 'FORBIDDEN'
      });
    }

    // Validate message
    const parsed = addCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const validatedData = parsed.data;

    const message = await prisma.ticketComment.create({
      data: {
        content: validatedData.content,
        isInternal: validatedData.isInternal,
        ticketId: req.params.id,
        userId: req.user.id
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Message added successfully',
      data: message
    });
  })
);

/**
 * POST /api/tickets/:id/comments
 * Add a comment to a ticket (alias for /messages)
 */
router.post('/:id/comments',
  authMiddleware,
  sanitizeMiddleware(['content']),
  asyncHandler(async (req, res) => {
    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
        code: 'NOT_FOUND'
      });
    }

    // Authorization check - role-based access
    const userRole = req.user.role;
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
    const isOwner = req.user.id === ticket.customerId;
    const isAssigned = req.user.id === ticket.assignedToId;
    const isManager = userRole === 'MANAGER' && ticket.departmentId === req.user.departmentId;
    const isAgent = userRole === 'AGENT' && ticket.departmentId === req.user.departmentId;

    const canComment = isAdmin || isOwner || isAssigned || isManager || isAgent;

    if (!canComment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to comment on this ticket',
        code: 'FORBIDDEN'
      });
    }

    // Validate comment
    const parsed = addCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const validatedData = parsed.data;

    const comment = await prisma.ticketComment.create({
      data: {
        content: validatedData.content,
        isInternal: validatedData.isInternal,
        ticketId: req.params.id,
        userId: req.user.id
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });
  })
);

/**
 * DELETE /api/tickets/:id
 * Delete a ticket (admin only)
 */
router.delete('/:id',
  authMiddleware,
  requirePermission('tickets:delete'),
  asyncHandler(async (req, res) => {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { attachments: true, comments: true } } }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
        code: 'NOT_FOUND'
      });
    }

    // Delete all related attachments and comments first
    await prisma.ticketComment.deleteMany({ where: { ticketId: req.params.id } });
    await prisma.attachment.deleteMany({ where: { ticketId: req.params.id } });

    await prisma.ticket.delete({
      where: { id: req.params.id }
    });

    return res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  })
);

module.exports = router;
