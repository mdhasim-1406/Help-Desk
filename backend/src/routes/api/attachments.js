// backend/src/routes/api/attachments.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const prisma = require('../../utils/prismaClient');
const { authMiddleware } = require('../../middleware/auth');
const { asyncHandler } = require('../../utils/errorHandler');

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../../uploads');

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (err) {
    console.error('Error creating upload directory:', err);
  }
};

ensureUploadDir();

// Multer configuration with file size and count limits
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Restrict file types if needed (optional)
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/csv'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5 // Max 5 files per request
  }
});

/**
 * GET /api/attachments/ticket/:ticketId
 * List all attachments for a ticket
 */
router.get('/ticket/:ticketId', authMiddleware, asyncHandler(async (req, res) => {
  // Verify ticket exists and user has access
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.ticketId }
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found',
      code: 'NOT_FOUND'
    });
  }

  const attachments = await prisma.ticketAttachment.findMany({
    where: { ticketId: req.params.ticketId },
    select: {
      id: true,
      fileName: true,
      fileSize: true,
      fileType: true,
      filePath: true,
      uploadedBy: { select: { id: true, name: true, email: true } },
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.json({
    success: true,
    message: 'Attachments retrieved successfully',
    data: attachments
  });
}));

/**
 * POST /api/attachments/ticket/:ticketId
 * Upload file(s) to a ticket
 */
router.post('/ticket/:ticketId',
  authMiddleware,
  upload.array('files', 5),
  asyncHandler(async (req, res) => {
    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.ticketId }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
        code: 'NOT_FOUND'
      });
    }

    // Verify user has access to the ticket
    const hasAccess = req.user.id === ticket.createdById ||
                      req.user.id === ticket.assignedToId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to upload files to this ticket',
        code: 'FORBIDDEN'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided',
        code: 'NO_FILES'
      });
    }

    // Create attachment records
    const attachments = await Promise.all(
      req.files.map(file =>
        prisma.ticketAttachment.create({
          data: {
            fileName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype,
            filePath: file.filename, // Store only the generated filename
            ticketId: req.params.ticketId,
            uploadedById: req.user.id
          },
          include: {
            uploadedBy: { select: { id: true, name: true, email: true } }
          }
        })
      )
    );

    return res.status(201).json({
      success: true,
      message: `${attachments.length} file(s) uploaded successfully`,
      data: attachments
    });
  })
);

/**
 * DELETE /api/attachments/:id
 * Delete an attachment
 */
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const attachment = await prisma.ticketAttachment.findUnique({
    where: { id: req.params.id }
  });

  if (!attachment) {
    return res.status(404).json({
      success: false,
      message: 'Attachment not found',
      code: 'NOT_FOUND'
    });
  }

  // Verify user owns the attachment
  if (req.user.id !== attachment.uploadedById) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to delete this attachment',
      code: 'FORBIDDEN'
    });
  }

  // Delete file from disk
  const filePath = path.join(uploadDir, attachment.filePath);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.error('Error deleting file:', err);
    // Continue even if file deletion fails
  }

  // Delete database record
  await prisma.ticketAttachment.delete({
    where: { id: req.params.id }
  });

  return res.json({
    success: true,
    message: 'Attachment deleted successfully'
  });
}));

/**
 * GET /api/attachments/:id/download
 * Download an attachment
 */
router.get('/:id/download', authMiddleware, asyncHandler(async (req, res) => {
  const attachment = await prisma.ticketAttachment.findUnique({
    where: { id: req.params.id }
  });

  if (!attachment) {
    return res.status(404).json({
      success: false,
      message: 'Attachment not found',
      code: 'NOT_FOUND'
    });
  }

  const filePath = path.join(uploadDir, attachment.filePath);

  // Verify file exists
  try {
    await fs.access(filePath);
  } catch {
    return res.status(404).json({
      success: false,
      message: 'File not found on server',
      code: 'FILE_NOT_FOUND'
    });
  }

  res.download(filePath, attachment.fileName);
}));

module.exports = router;
