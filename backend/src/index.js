// backend/src/index.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const prisma = require('./utils/prismaClient');

// Import routes
const authRouter = require('./routes/api/auth');
const kbCategoriesRouter = require('./routes/api/kb/categories');
const kbArticlesRouter = require('./routes/api/kb/articles');
const ticketsRouter = require('./routes/api/tickets');
const departmentsRouter = require('./routes/api/departments');
const usersRouter = require('./routes/api/users');
const attachmentsRouter = require('./routes/api/attachments');
const notificationsRouter = require('./routes/api/notifications');
const slaRouter = require('./routes/api/sla');
const reportsRouter = require('./routes/api/reports');

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Request logging middleware (simple version)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRouter);
app.use('/api/kb/categories', kbCategoriesRouter);
app.use('/api/kb/articles', kbArticlesRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/attachments', attachmentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/sla', slaRouter);
app.use('/api/reports', reportsRouter);

/**
 * 404 Not Found handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND'
  });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File size exceeds 10MB limit',
      code: 'FILE_TOO_LARGE'
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      success: false,
      message: 'Too many files. Maximum 5 files allowed',
      code: 'TOO_MANY_FILES'
    });
  }

  if (err.message && err.message.includes('File type') && err.message.includes('not allowed')) {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: 'INVALID_FILE_TYPE'
    });
  }

  // Handle database errors
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
      code: 'NOT_FOUND'
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Unique constraint violation',
      code: 'DUPLICATE_ENTRY'
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connection successful');

    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║  Express Backend Server Started        ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(21)} ║
║  Port: ${PORT.toString().padEnd(30)} ║
║  Frontend Origin: ${FRONTEND_ORIGIN.substring(0, 20).padEnd(23)} ║
╚════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        await prisma.$disconnect();
        console.log('Database disconnected');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        await prisma.$disconnect();
        console.log('Database disconnected');
        process.exit(0);
      });
    });

  } catch (err) {
    console.error('✗ Failed to start server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
