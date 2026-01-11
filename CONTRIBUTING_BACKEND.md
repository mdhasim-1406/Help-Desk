# Contributing to Helpdesk Backend

Welcome! This guide helps JavaScript developers contribute to the Express backend without needing deep TypeScript knowledge.

## Project Structure

```
backend/
├── src/
│   ├── index.js              # Main Express server entry point
│   ├── middleware/
│   │   └── auth.js           # JWT authentication & permissions
│   ├── routes/
│   │   └── api/
│   │       ├── kb/
│   │       │   └── categories.js
│   │       ├── tickets.js
│   │       └── attachments.js
│   └── utils/
│       ├── prismaClient.js   # Shared database client
│       └── errorHandler.js   # Error formatting utilities
├── .env.example              # Environment variables template
├── package.json
└── README.md
```

## Quick Start

### 1. Clone & Install

```bash
cd backend
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:4000` with source maps enabled for debugging.

## Common Tasks

### Creating a New API Endpoint

#### Step 1: Create Route File

Create `backend/src/routes/api/example.js`:

```javascript
const express = require('express');
const { z } = require('zod');
const prisma = require('../../utils/prismaClient');
const { authMiddleware, requirePermission } = require('../../middleware/auth');
const { formatValidationError, asyncHandler } = require('../../utils/errorHandler');

const router = express.Router();

// Define validation schema
const createExampleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email')
});

// GET endpoint - no auth required
router.get('/', asyncHandler(async (req, res) => {
  const items = await prisma.example.findMany();
  
  return res.json({
    success: true,
    message: 'Items retrieved',
    data: items
  });
}));

// POST endpoint - requires authentication
router.post('/',
  authMiddleware,
  requirePermission('resource:create'),
  asyncHandler(async (req, res) => {
    // Validate input
    const parsed = createExampleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatValidationError(parsed.error));
    }

    const item = await prisma.example.create({
      data: parsed.data
    });

    return res.status(201).json({
      success: true,
      message: 'Item created',
      data: item
    });
  })
);

module.exports = router;
```

#### Step 2: Register Route in Main Server

Edit `backend/src/index.js`:

```javascript
// Add import at the top
const exampleRouter = require('./routes/api/example');

// Add before 404 handler
app.use('/api/example', exampleRouter);
```

#### Step 3: Test the Endpoint

```bash
# List items
curl http://localhost:4000/api/example

# Create item (with JWT token)
curl -X POST http://localhost:4000/api/example \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"John","email":"john@example.com"}'
```

### Working with the Database

The backend uses Prisma ORM. Database operations are simple:

```javascript
// Create
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe'
  }
});

// Read
const user = await prisma.user.findUnique({
  where: { id: 'user-id' }
});

// Update
const user = await prisma.user.update({
  where: { id: 'user-id' },
  data: { name: 'Jane Doe' }
});

// Delete
await prisma.user.delete({
  where: { id: 'user-id' }
});

// List with filtering
const users = await prisma.user.findMany({
  where: {
    role: 'ADMIN'
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: 0
});
```

### Authentication & Authorization

#### Understanding JWT

JWT (JSON Web Token) is automatically handled. You receive it from the frontend after login.

```javascript
// The token looks like: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// It contains user data and can't be modified (signed with JWT_SECRET)
```

#### Using Auth Middleware

```javascript
// Require authentication
router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
  // req.user contains: { id, email, name, role, permissions }
  return res.json({
    success: true,
    data: req.user
  });
}));

// Require specific permission
router.post('/admin', 
  authMiddleware,
  requirePermission('admin:access'),
  asyncHandler(async (req, res) => {
    return res.json({ success: true });
  })
);
```

#### Available Permissions

```javascript
// Check if user has permission
if (hasPermission(req.user, 'tickets:create')) {
  // User can create tickets
}

// All available permissions
const permissions = {
  'kb:read': 'View KB',
  'kb:create': 'Create KB categories',
  'kb:write': 'Edit KB categories',
  'kb:delete': 'Delete KB categories',
  'tickets:read': 'View tickets',
  'tickets:create': 'Create tickets',
  'tickets:write': 'Edit tickets',
  'tickets:admin': 'Admin access',
  'tickets:delete': 'Delete tickets'
};
```

### Error Handling

Always wrap route handlers with `asyncHandler`:

```javascript
// ✅ Correct - errors are caught and formatted
router.get('/', asyncHandler(async (req, res) => {
  const item = await prisma.item.findUnique({ /* ... */ });
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Item not found',
      code: 'NOT_FOUND'
    });
  }
}));

// ❌ Wrong - errors won't be caught
router.get('/', async (req, res) => {
  const item = await prisma.item.findUnique({ /* ... */ });
});
```

### Input Validation

Use Zod for type-safe validation:

```javascript
const schema = z.object({
  // String with requirements
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),
  
  // Email validation
  email: z.string().email('Invalid email'),
  
  // Numbers
  age: z.number().min(18, 'Must be 18+'),
  
  // Enum
  role: z.enum(['ADMIN', 'USER', 'GUEST']),
  
  // Optional fields
  phone: z.string().optional(),
  
  // Boolean
  isActive: z.boolean().optional().default(true)
});

// Use in route
const parsed = schema.safeParse(req.body);
if (!parsed.success) {
  return res.status(400).json(formatValidationError(parsed.error));
}

const validData = parsed.data;
```

### File Uploads

Upload files to ticket attachments:

```javascript
const multer = require('multer');

// In route file
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
  // req.file contains: { filename, size, mimetype, path }
  console.log(req.file);
}));
```

## Best Practices

### 1. Use Descriptive Variable Names

```javascript
// ✅ Good
const userTickets = await prisma.ticket.findMany({
  where: { createdById: req.user.id }
});

// ❌ Avoid
const t = await prisma.ticket.findMany({
  where: { createdById: u.id }
});
```

### 2. Add Comments for Complex Logic

```javascript
// Calculate pagination offset
const offset = (pageNumber - 1) * itemsPerPage;

// Ensure category has no children before deletion
if (categoryChildCount > 0) {
  return res.status(400).json({
    success: false,
    message: 'Cannot delete category with children'
  });
}
```

### 3. Optimize Database Queries

```javascript
// ✅ Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
  }
});

// ❌ Avoid fetching unnecessary fields
const users = await prisma.user.findMany(); // Gets all fields
```

### 4. Use Consistent Response Format

```javascript
// Success response
return res.status(201).json({
  success: true,
  message: 'Resource created',
  data: resource
});

// Error response
return res.status(400).json({
  success: false,
  message: 'Validation failed',
  code: 'VALIDATION_ERROR'
});
```

### 5. Check Authorization First

```javascript
// ✅ Check permission immediately
router.delete('/:id',
  authMiddleware,
  requirePermission('resource:delete'),
  asyncHandler(async (req, res) => {
    // Safe to proceed - user has permission
  })
);
```

## Testing Routes

### Using cURL

```bash
# GET request
curl http://localhost:4000/api/categories

# POST request with data
curl -X POST http://localhost:4000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"New Category"}'

# With authentication
curl -H "Authorization: Bearer TOKEN_HERE" \
  http://localhost:4000/api/tickets
```

### Using Postman

1. Import collection from project
2. Set environment variables (JWT token, base URL)
3. Test each endpoint
4. Export results

### Using Thunder Client (VS Code)

1. Install Thunder Client extension
2. Create request collection
3. Test routes from within VS Code

## Debugging

### Enable Verbose Logging

```javascript
// In route handler
console.log('User:', req.user);
console.log('Request body:', req.body);
console.log('Query params:', req.query);
```

### Check Database State

```bash
# Connect to database
psql postgresql://user:password@localhost:5432/helpdesk_db

# Query data
SELECT * FROM "User";
SELECT * FROM "Ticket" LIMIT 5;
```

### Monitor Request/Response

```javascript
// Already added in src/index.js
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});
```

## Common Patterns

### Checking User Ownership

```javascript
// Before updating resource
if (req.user.id !== resource.createdById) {
  return res.status(403).json({
    success: false,
    message: 'You can only edit your own resources',
    code: 'FORBIDDEN'
  });
}
```

### Filtering Results by User

```javascript
// Show all results for admin, only own for regular users
const where = {};
if (!hasPermission(req.user, 'admin:access')) {
  where.createdById = req.user.id;
}

const items = await prisma.item.findMany({ where });
```

### Pagination

```javascript
const page = parseInt(req.query.page) || 1;
const limit = Math.min(parseInt(req.query.limit) || 20, 100);
const skip = (page - 1) * limit;

const [items, total] = await Promise.all([
  prisma.item.findMany({ skip, take: limit }),
  prisma.item.count()
]);

return res.json({
  success: true,
  data: items,
  pagination: { page, limit, total }
});
```

## Troubleshooting

### "Cannot find module" Error

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Connection refused" Error

Database isn't running. Start PostgreSQL:

```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Check it's running
psql -U postgres -c "\l"
```

### Token Authentication Fails

```javascript
// Check token is being sent
console.log(req.headers.authorization);

// Check token format
// Should be: "Bearer eyJhbGc..."
```

### CORS Errors

Check `FRONTEND_ORIGIN` in `.env` matches your frontend URL.

## Getting Help

1. Check existing route files for similar patterns
2. Read error messages carefully
3. Check database schema in `prisma/schema.prisma`
4. Ask team members
5. Create an issue in the project repository

## Code Review Checklist

Before submitting a PR:

- [ ] Routes use `asyncHandler` wrapper
- [ ] Input validated with Zod
- [ ] Auth middleware applied when needed
- [ ] Error responses use consistent format
- [ ] Only needed database fields selected
- [ ] List endpoints paginated
- [ ] Comments explain complex logic
- [ ] No console.log() left in production code
- [ ] No hardcoded secrets in code
- [ ] Tested with cURL or Postman

## Resources

- [Express.js Guide](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Zod Validation](https://zod.dev/)
- [JWT Explained](https://jwt.io/introduction)
- [HTTP Status Codes](https://httpwg.org/specs/rfc7231.html#status.codes)

## Questions?

Ask in the project chat or create a discussion issue!
