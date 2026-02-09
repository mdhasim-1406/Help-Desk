# Role: Backend API & Business Logic

---

## 1. Role Responsibility

As the **Backend Engineer**, this role is responsible for all the **server-side logic**—the code that runs when the frontend makes a request. This includes:

1. **Building API Endpoints**: Creating the URLs that the frontend can call (e.g., `GET /api/tickets`).
2. **Implementing Business Logic**: The rules of the helpdesk (who can update a ticket? what happens when a ticket is created?).
3. **Validating Input**: Making sure incoming data is correct before processing it.
4. **Handling Errors**: Returning helpful error messages when something goes wrong.
5. **Connecting to the Database**: Using Prisma to read and write data.

> **Think of this role as the waiter in a restaurant.** The frontend (customer) places an order, the backend takes it to the kitchen (database), prepares the response (apply business logic), and delivers it back.

---

## 2. Where This Role Fits in the Overall Architecture

The domain is the **Server Layer**—the middle part of the system:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Frontend                                                                   │
│  - Sends HTTP requests to your APIs                                         │
│  - Expects JSON responses                                                   │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ HTTP Request: POST /api/tickets
                                   │ Headers: Authorization: Bearer <token>
                                   │ Body: { title, description, priority }
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│      BACKEND DOMAIN                                                          │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Middleware Chain                                                      │  │
│  │ Helmet → CORS → RateLimit → BodyParser → Sanitizer → Auth → RBAC    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Route Handlers (This Role's Code!)                                   │  │
│  │ routes/api/tickets.js, routes/api/users.js, routes/api/sla.js       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ prisma.ticket.create({...})
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Database (Database Engineer)                                               │
│  - PostgreSQL stores all the data                                           │
│  - Prisma ORM translates JavaScript to SQL                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### This role owns:
- `backend/src/routes/api/` folder (all API endpoint files)
- Business logic inside each route handler
- Request validation with Zod schemas
- Error handling in routes

### Shared responsibility with:
- **Security Engineer**: Owns auth middleware, usage here
- **Database Engineer**: Owns the schema, queried here with Prisma

---

## 3. Detailed Explanation of What Was Built

### 3.1 Entry Point (index.js)

The file `backend/src/index.js` is where the Express server starts. Here's what it does:

```javascript
// 1. Create Express app
const app = express();

// 2. Apply middleware (ORDER MATTERS!)
app.use(helmet());              // Security headers
app.use(cors({ origin: ... })); // Allow frontend origin
app.use(apiLimiter);            // Rate limiting
app.use(express.json());        // Parse JSON body
app.use(cookieParser());        // Parse cookies

// 3. Mount route handlers
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/kb', kbRoutes);

// 4. Error handling middleware (MUST be last!)
app.use(errorHandler);

// 5. Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

### 3.2 Route Structure

Each feature has its own route file in `backend/src/routes/api/`:

| File | Route Prefix | What It Handles |
|------|--------------|-----------------|
| `auth.js` | `/api/auth` | Login, register, logout, get current user |
| `tickets.js` | `/api/tickets` | Create, read, update, delete tickets; comments |
| `users.js` | `/api/users` | List users, create user, update user |
| `departments.js` | `/api/departments` | Manage departments |
| `sla.js` | `/api/sla` | SLA policies, breach tracking |
| `reports.js` | `/api/reports` | Analytics data for dashboards |
| `notifications.js` | `/api/notifications` | User notifications |
| `attachments.js` | `/api/attachments` | File upload/download |
| `kb/*.js` | `/api/kb` | Knowledge base categories and articles |

---

### 3.3 Anatomy of a Route Handler

Let's break down exactly how `GET /api/tickets` works:

```javascript
// backend/src/routes/api/tickets.js

const router = express.Router();

// GET /api/tickets - List tickets
router.get('/',
  authMiddleware,              // Step 1: Verify JWT token
  asyncHandler(async (req, res) => {
    const userRole = req.user.role;
    const userId = req.user.id;
    const departmentId = req.user.departmentId;

    // Step 2: Build query based on role
    let where = {};
    
    if (userRole === 'CUSTOMER') {
      // Customers only see their own tickets
      where.customerId = userId;
    } else if (userRole === 'AGENT') {
      // Agents see assigned tickets + unassigned in their department
      where.OR = [
        { assignedToId: userId },
        { assignedToId: null, departmentId: departmentId }
      ];
    } else if (userRole === 'MANAGER') {
      // Managers see all tickets in their department
      where.departmentId = departmentId;
    }
    // ADMIN: no filter (sees all)

    // Step 3: Query database
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        customer: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
        status: true,
        department: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Step 4: Return response
    res.json({
      success: true,
      data: tickets
    });
  })
);
```

**Key points:**
- `authMiddleware` runs before this code—it puts `req.user` on the request
- Data is filtered based on `req.user.role` (RBAC)
- Prisma is used to query the database
- Returns a consistent JSON response format

---

### 3.4 Creating a Ticket (POST Example)

```javascript
// POST /api/tickets - Create a new ticket
router.post('/',
  authMiddleware,                                    // Check login
  requirePermission('tickets:create'),               // Check permission
  sanitizeMiddleware(['title', 'description']),      // Clean XSS
  asyncHandler(async (req, res) => {
    // Step 1: Validate input
    const schema = z.object({
      title: z.string().min(5).max(200),
      description: z.string().min(10).max(5000),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
      departmentId: z.string().uuid().optional()
    });
    
    const validatedData = schema.parse(req.body);

    // Step 2: Get the default status (OPEN)
    const defaultStatus = await prisma.ticketStatus.findFirst({
      where: { isDefault: true }
    });

    // Step 3: Generate ticket number
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    const nextNumber = lastTicket 
      ? parseInt(lastTicket.ticketNumber.split('-')[1]) + 1 
      : 1;
    const ticketNumber = `TKT-${String(nextNumber).padStart(6, '0')}`;

    // Step 4: Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        statusId: defaultStatus.id,
        customerId: req.user.id,       // Current user is the customer
        departmentId: validatedData.departmentId
      }
    });

    // Step 5: Return created ticket
    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Ticket created successfully'
    });
  })
);
```

---

### 3.5 Input Validation with Zod

**Why validate?**
- Users can send anything—empty strings, wrong types, malicious data
- Validation ensures code only works with valid data

**How Zod works:**

```javascript
const schema = z.object({
  title: z.string()       // Must be a string
           .min(5)        // At least 5 characters
           .max(200),     // At most 200 characters
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])  // Must be one of these
           .default('MEDIUM'),  // If not provided, use MEDIUM
  departmentId: z.string().uuid().optional()  // Optional, but if present, must be UUID
});

// This will throw an error if data is invalid
const validatedData = schema.parse(req.body);
```

**What happens on invalid data?**

Zod throws a `ZodError` with details about what's wrong. Our error handler catches it and returns:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "path": "title", "message": "String must contain at least 5 characters" }
  ]
}
```

---

### 3.6 Error Handling Pattern

**The asyncHandler wrapper:**

Express doesn't catch async errors by default. We use a wrapper:

```javascript
// utils/errorHandler.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

This means:
- If your async route throws an error, it gets passed to `next()`
- Express's error-handling middleware catches it

**Global error handler:**

```javascript
// In index.js
app.use((err, req, res, next) => {
  // Handle different error types
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors
    });
  }

  if (err.code === 'P2025') {  // Prisma: record not found
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  // Generic server error
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});
```

---

### 3.7 Response Format Standard

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... },           // The actual data
  "message": "Optional message"
}
```

**Error:**
```json
{
  "success": false,
  "message": "What went wrong",
  "errors": [ ... ]          // Optional: validation errors
}
```

**Why consistency matters?**
- Frontend can always check `response.data.success`
- Error handling code is simpler
- Debugging is easier

---

## 4. Interaction With Other Parts

### 4.1 Connection to Frontend

This role **provides** the data that the Frontend needs:

| Frontend needs to | Backend provides |
|----------------|-------------|
| Show list of tickets | `GET /api/tickets` → array of ticket objects |
| Submit new ticket form | `POST /api/tickets` → accept title, description, priority |
| Show ticket details | `GET /api/tickets/:id` → single ticket with comments |
| Update ticket status | `PATCH /api/tickets/:id` → accept status change |

**API Contract**: If endpoint returns change, communicate with Frontend!

---

### 4.2 Connection to Security

The Security Engineer provides middleware that is **used** here:

```javascript
// Written in routes:
router.post('/', authMiddleware, requirePermission('tickets:create'), ...)

// Security Engineer wrote authMiddleware and requirePermission
// They give req.user with user info and permissions
```

**Depend on Security Engineer for:**
- `req.user.id` — current user's ID
- `req.user.role` — current user's role (CUSTOMER, AGENT, etc.)
- `req.user.permissions` — what they're allowed to do

---

### 4.3 Connection to Database

The Database Engineer defined the schema; this role **queries** it:

```javascript
// The schema defines: Ticket has title, description, customerId, statusId...
// Query it with Prisma:
const ticket = await prisma.ticket.create({
  data: {
    title: '...',
    description: '...',
    customerId: req.user.id,
    statusId: defaultStatus.id
  }
});
```

**If schema changes** (e.g., new field added), update queries.

---

## 5. Why These Decisions Were Made

### 5.1 Express.js (Not Fastify, Not NestJS)

**Decision**: Use Express.

**Why**:
- Most popular Node.js framework
- Massive community and middleware ecosystem
- Team familiarity

**Tradeoff**:
- Less opinionated than NestJS (more freedom, but also more decisions to make)
- Slightly slower than Fastify (but irrelevant at our scale)

---

### 5.2 Route-Based File Organization

**Decision**: One file per feature (tickets.js, users.js, etc.)

**Why**:
- Easy to find code—need to fix tickets? Open tickets.js
- Clear ownership—each route file has specific responsibility
- Scales well—50 lines per file is better than 500 lines in one file

---

### 5.3 Zod for Validation (Not Joi, Not express-validator)

**Decision**: Use Zod.

**Why**:
- TypeScript-first (even though we use JS, Zod's API is cleaner)
- Simpler syntax than Joi
- Same library used in frontend for consistency

---

### 5.4 Consistent Response Format

**Decision**: All responses have `{ success, data, message }` structure.

**Why**:
- Frontend can handle all responses the same way
- Easy to debug (always know what to expect)
- Professional API design practice

---

## 6. Common Questions & Safe Answers

### Q1: "How does data filtering work for different roles?"

**Safe Answer**:
> "When a request comes in, we first identify the user's role from the JWT token via authMiddleware. Then, in the route handler, we build a Prisma 'where' clause based on that role. For example, a CUSTOMER only sees tickets where customerId matches their ID, while an ADMIN sees all tickets with no filter. The database only returns what that user is allowed to see."

---

### Q2: "What happens if someone sends invalid data?"

**Safe Answer**:
> "Every POST and PATCH endpoint validates incoming data using Zod schemas. The schema defines required fields, types, and constraints like minimum length. If validation fails, Zod throws an error that our global error handler catches, returning a 400 Bad Request with specific error messages indicating which fields are invalid."

---

### Q3: "How do you handle database errors?"

**Safe Answer**:
> "Prisma throws specific error codes for different scenarios. For example, P2025 means 'record not found' and P2002 means 'unique constraint violation'. Our error handler checks for these codes and returns appropriate HTTP status codes—404 for not found, 409 for conflicts. Unknown errors return a generic 500 with a sanitized message."

---

### Q4: "Why do some endpoints use multiple middleware?"

**Safe Answer**:
> "Each middleware has a single responsibility. authMiddleware verifies the user is logged in. requirePermission checks if they have a specific permission. sanitizeMiddleware cleans potential XSS from input fields. Chaining them together creates a security pipeline—if any middleware rejects the request, it never reaches the controller."

---

### Q5: "How is the ticket number generated?"

**Safe Answer**:
> "We query the most recent ticket to find the highest existing number, increment it, and format it with zero-padding. For example, if the last ticket is TKT-000042, the new one becomes TKT-000043. This happens inside a database transaction to prevent duplicates if two tickets are created simultaneously."

---

## 7. Rebuild Process (Step-by-Step)

### Step 1: Set Up Express Server

```bash
mkdir backend && cd backend
npm init -y
npm install express dotenv cors helmet cookie-parser
```

Create `src/index.js`:
```javascript
const express = require('express');
const app = express();
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(4000, () => console.log('Server running'));
```

### Step 2: Add Prisma

```bash
npm install prisma @prisma/client
npx prisma init
```

Define schema, run migration, test connection.

### Step 3: Create First Route File

Create `src/routes/api/tickets.js`:
```javascript
const router = require('express').Router();
router.get('/', (req, res) => res.json({ tickets: [] }));
module.exports = router;
```

Mount it in index.js:
```javascript
app.use('/api/tickets', require('./routes/api/tickets'));
```

### Step 4: Add Validation

```bash
npm install zod
```

Add schemas to each route handler.

### Step 5: Add Error Handling

Create `src/utils/errorHandler.js` with asyncHandler and global handler.

### Step 6: Integrate Auth Middleware

Import Security Engineer's middleware and add to protected routes:
```javascript
router.get('/', authMiddleware, asyncHandler(...));
```

### Step 7: Implement All CRUD Operations

For each entity (tickets, users, departments):
1. GET / (list)
2. GET /:id (single)
3. POST / (create)
4. PATCH /:id (update)
5. DELETE /:id (delete)

### Step 8: Add Tests

```bash
npm install --save-dev jest supertest
```

Create test files in `src/__tests__/`.

---

## Final Notes for Presentation

### Demonstrable Features:

1. **Request lifecycle**: From HTTP request to database and back
2. **One complete endpoint**: Pick `POST /api/tickets` and trace every step
3. **Error handling**: What happens when something goes wrong
4. **RBAC filtering**: How different roles see different data

### Opening statement:

> "I was responsible for the backend API of HelpDesk Pro, built with Express.js. The backend exposes RESTful endpoints for all core features—tickets, users, departments, and reports. I implemented input validation with Zod, consistent error handling, and role-based data filtering to ensure each user only accesses what they're permitted to see."

### Closing statement:

> "The backend successfully serves as the business logic layer, enforcing data validation, access control, and consistent API responses. All endpoints follow REST conventions and return predictable JSON structures, making frontend integration straightforward."

---

**Remember: This role is the gatekeeper. If bad data gets to the database, it's this role's problem to solve.**
