# HelpDesk Pro - System Architecture

## 🏗️ Overview

HelpDesk Pro is a full-stack ticket management system built with a modern, scalable architecture. The system follows a clean separation between the presentation layer (React frontend), business logic layer (Express backend), and data layer (PostgreSQL database).

## 📐 System Diagram

```
┌─────────────────────────────────────────────────────┐
│         Frontend (Vite + React 19)                  │
│         Port: 5173 (dev) / 3000 (prod)              │
│                                                     │
│  • React Router DOM (client-side routing)          │
│  • Zustand (state management)                      │
│  • Axios (HTTP client)                             │
│  • TipTap (rich text editor)                       │
│  • Tailwind CSS (styling)                          │
│  • React Hook Form (form handling)                 │
│  • Recharts (data visualization)                   │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP/REST API
                      │ (axios with interceptors)
                      ▼
┌─────────────────────────────────────────────────────┐
│         Backend (Express.js 4.18)                   │
│         Port: 4000                                  │
│                                                     │
│  Middleware Stack:                                 │
│  1. Helmet (security headers)                      │
│  2. CORS (cross-origin protection)                 │
│  3. express.json() (body parsing)                  │
│  4. cookie-parser (cookie handling)                │
│  5. Request logger                                 │
│  6. authMiddleware (JWT validation)                │
│  7. requirePermission (RBAC)                       │
│  8. Route handlers                                 │
│  9. Error handler (global)                         │
└─────────────────────┬───────────────────────────────┘
                      │ Prisma ORM
                      │ (type-safe queries)
                      ▼
┌─────────────────────────────────────────────────────┐
│         PostgreSQL Database                         │
│         Port: 5432                                  │
│                                                     │
│  Tables: users, roles, departments, tickets,       │
│  ticket_statuses, ticket_comments, attachments,    │
│  sla_policies, notifications, kb_categories,       │
│  kb_articles, ticket_history                       │
└─────────────────────────────────────────────────────┘
```

## 🔐 Authentication Flow

### Login Process

1. **User submits credentials** → `POST /api/auth/login`
   - Email and password validated with Zod schema
   
2. **Backend validates credentials**
   - Fetch user from database with Prisma
   - Compare password hash using bcryptjs
   - Check if user is active

3. **Generate JWT tokens**
   - Access token (1 hour expiry)
   - Refresh token (7 days expiry)
   - Tokens include: `userId`, `email`, `role`

4. **Return tokens to frontend**
   - Access token sent in response body
   - Optional: httpOnly cookie for additional security
   - Refresh token stored in database

5. **Frontend stores tokens**
   - `localStorage.setItem('accessToken', token)`
   - `localStorage.setItem('refreshToken', refreshToken)`
   - User object stored in Zustand auth store

6. **Subsequent requests**
   - Axios interceptor adds `Authorization: Bearer <token>` header
   - Backend `authMiddleware` validates token
   - User object attached to `req.user`

### Token Verification

```javascript
// backend/src/middleware/auth.js
1. Extract token from Authorization header or cookies
2. Verify token with jwt.verify(token, JWT_SECRET)
3. Fetch user from database (includes role and permissions)
4. Attach user to req.user
5. Continue to next middleware/route handler
```

### Logout Process

1. Frontend calls `POST /api/auth/logout`
2. Backend clears cookies (if used)
3. Frontend removes tokens from localStorage
4. Zustand store resets user state
5. Redirect to login page

## 🛡️ Authorization (RBAC)

### Role Hierarchy

```
SUPER_ADMIN (Level 5) - Full system access
    ↓
ADMIN (Level 4) - Manage users, departments, tickets, KB, SLA
    ↓
MANAGER (Level 3) - Manage team, tickets, reports
    ↓
AGENT (Level 2) - Handle tickets, view KB
    ↓
CUSTOMER (Level 1) - Create tickets, view own tickets
```

### Permission System

Permissions are stored as JSON arrays in the `roles` table:

```javascript
// Example role permissions
{
  "SUPER_ADMIN": ["*"],  // Wildcard = all permissions
  "ADMIN": [
    "users:*",           // All user operations
    "tickets:*",         // All ticket operations
    "departments:*",
    "sla:*",
    "kb:*",
    "reports:read",
    "settings:*"
  ],
  "MANAGER": [
    "tickets:*",
    "users:read",
    "departments:read",
    "reports:read",
    "kb:*"
  ],
  "AGENT": [
    "tickets:read",
    "tickets:update",
    "tickets:comment",
    "kb:read"
  ],
  "CUSTOMER": [
    "tickets:create",
    "tickets:read:own",
    "tickets:comment:own",
    "kb:read:public"
  ]
}
```

### Permission Checking

```javascript
// backend/src/middleware/auth.js
function hasPermission(userPermissions, permission) {
  // 1. Check for wildcard (*)
  if (userPermissions.includes('*')) return true;
  
  // 2. Check exact match
  if (userPermissions.includes(permission)) return true;
  
  // 3. Check resource wildcard (e.g., 'tickets:*' matches 'tickets:read')
  const [resource] = permission.split(':');
  if (userPermissions.includes(`${resource}:*`)) return true;
  
  return false;
}
```

### Route Protection

```javascript
// Example protected route
router.post('/tickets',
  authMiddleware,                    // Verify JWT
  requirePermission('tickets:create'), // Check permission
  asyncHandler(async (req, res) => {
    // Route handler
  })
);
```

### Frontend Route Protection

```javascript
// client/src/components/layout/ProtectedRoute.jsx
<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
  <AdminLayout />
</ProtectedRoute>
```

## 🗄️ Database Schema

### Core Models

#### User
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  avatar        String?
  roleId        String
  departmentId  String?
  isActive      Boolean   @default(true)
  lastLogin     DateTime?
  refreshToken  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  role              Role
  department        Department?
  createdTickets    Ticket[]  @relation("TicketCustomer")
  assignedTickets   Ticket[]  @relation("TicketAssignee")
  comments          TicketComment[]
  notifications     Notification[]
}
```

#### Ticket
```prisma
model Ticket {
  id                 String        @id @default(uuid())
  ticketNumber       String        @unique
  title              String
  description        String
  priority           Priority      @default(MEDIUM)
  source             TicketSource  @default(WEB)
  statusId           String
  slaPolicyId        String?
  customerId         String
  assignedToId       String?
  departmentId       String?
  responseDueAt      DateTime?
  resolutionDueAt    DateTime?
  firstResponseAt    DateTime?
  resolvedAt         DateTime?
  responseBreached   Boolean       @default(false)
  resolutionBreached Boolean       @default(false)
  tags               String[]      @default([])
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
  
  // Relations
  status      TicketStatus
  slaPolicy   SLAPolicy?
  customer    User          @relation("TicketCustomer")
  assignedTo  User?         @relation("TicketAssignee")
  department  Department?
  comments    TicketComment[]
  attachments Attachment[]
  history     TicketHistory[]
}
```

### Relationships

```
User 1────────N Ticket (as customer)
User 1────────N Ticket (as assignee)
Ticket 1──────N TicketComment
Ticket 1──────N Attachment
Ticket 1──────N TicketHistory
Department 1──N User
Department 1──N Ticket
Role 1────────N User
TicketStatus 1─N Ticket
SLAPolicy 1───N Ticket
KBCategory 1──N KBArticle
User 1────────N Notification
```

## 🔄 Request Pipeline

### Backend Request Flow

```
1. Request received
   ↓
2. Helmet middleware (security headers)
   ↓
3. CORS middleware (origin validation)
   ↓
4. express.json() (parse JSON body, max 50MB)
   ↓
5. express.urlencoded() (parse URL-encoded data)
   ↓
6. cookie-parser (parse cookies)
   ↓
7. Request logger (log method, path, duration)
   ↓
8. Route matching
   ↓
9. authMiddleware (if protected route)
   - Extract JWT from header/cookie
   - Verify token
   - Fetch user from database
   - Attach to req.user
   ↓
10. requirePermission (if permission required)
    - Check user permissions
    - Return 403 if unauthorized
   ↓
11. Zod validation (request body/query)
   ↓
12. Route handler (business logic)
    - Prisma database queries
    - Business logic processing
   ↓
13. Response sent
   ↓
14. Error handler (if error thrown)
    - Format error response
    - Log error
    - Return appropriate status code
```

### Frontend Request Flow

```
1. User action (button click, form submit)
   ↓
2. Service function called (e.g., ticketService.create())
   ↓
3. Axios request
   - Interceptor adds Authorization header
   - Interceptor adds Content-Type header
   ↓
4. Backend processes request
   ↓
5. Response received
   - Interceptor handles 401 (redirect to login)
   - Interceptor handles errors
   ↓
6. Service function returns data
   ↓
7. Component updates state
   - Zustand store updated
   - UI re-renders
   ↓
8. Toast notification (if applicable)
```

## ❌ Error Handling

### Backend Error Format

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "code": "ERROR_CODE_STRING",
  "statusCode": 400,
  "errors": []  // Optional validation details
}
```

### Error Types

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input (Zod validation failed) |
| 401 | NO_TOKEN | No authentication token provided |
| 401 | INVALID_TOKEN | Invalid or expired token |
| 401 | INVALID_CREDENTIALS | Wrong email/password |
| 403 | ACCOUNT_INACTIVE | User account is deactivated |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 404 | DEPARTMENT_NOT_FOUND | Department doesn't exist |
| 404 | USER_NOT_FOUND | User doesn't exist |
| 409 | EMAIL_EXISTS | Email already registered |
| 409 | DUPLICATE_ENTRY | Unique constraint violation |
| 413 | FILE_TOO_LARGE | File exceeds 10MB limit |
| 413 | TOO_MANY_FILES | More than 5 files uploaded |
| 500 | INTERNAL_ERROR | Server error |

### Global Error Handler

```javascript
// backend/src/index.js
app.use((err, req, res, next) => {
  // Handle multer errors (file uploads)
  if (err.code === 'LIMIT_FILE_SIZE') { ... }
  if (err.code === 'LIMIT_FILE_COUNT') { ... }
  
  // Handle Prisma errors
  if (err.code === 'P2025') { ... }  // Not found
  if (err.code === 'P2002') { ... }  // Unique constraint
  
  // Generic error
  res.status(500).json({ ... });
});
```

### Frontend Error Handling

```javascript
// Axios interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      authStore.logout();
      navigate('/login');
    }
    return Promise.reject(error);
  }
);
```

## 📁 File Upload System

### Configuration

- **Storage**: Local filesystem (`backend/uploads/`)
- **Max file size**: 10MB per file
- **Max files**: 5 per ticket/comment
- **Allowed types**: Images, PDFs, documents
- **Library**: Multer

### Upload Flow

```
1. User selects files (react-dropzone)
   ↓
2. Frontend validates files (size, type)
   ↓
3. FormData created with files
   ↓
4. POST /api/attachments
   ↓
5. Multer middleware processes files
   - Validates file type
   - Validates file size
   - Saves to uploads/ directory
   ↓
6. Database record created (Attachment model)
   ↓
7. File metadata returned to frontend
```

## 🔄 State Management

### Zustand Stores

#### authStore
```javascript
{
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,
  
  // Actions
  login(email, password),
  logout(),
  checkAuth(),
  initialize(),
  hasRole(role),
  isCustomer(),
  isAgent(),
  isManager(),
  isAdmin()
}
```

#### notificationStore
```javascript
{
  notifications: [],
  unreadCount: 0,
  
  // Actions
  addNotification(notification),
  removeNotification(id),
  markAsRead(id),
  markAllAsRead(),
  fetchNotifications()
}
```

#### uiStore
```javascript
{
  sidebarOpen: true,
  theme: 'light',
  
  // Actions
  toggleSidebar(),
  setTheme(theme)
}
```

## 🚀 Deployment Architecture

### Development

```
Developer Machine
├── Frontend (Vite dev server) → localhost:5173
├── Backend (Node.js) → localhost:4000
└── PostgreSQL → localhost:5432
```

### Production (Recommended)

```
                    ┌─────────────┐
                    │   Caddy     │
                    │  (Reverse   │
                    │   Proxy)    │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         ┌────▼─────┐            ┌─────▼────┐
         │ Frontend │            │ Backend  │
         │  (Nginx/ │            │ (PM2/    │
         │  Static) │            │  Docker) │
         └──────────┘            └─────┬────┘
                                       │
                                 ┌─────▼──────┐
                                 │ PostgreSQL │
                                 │  (Managed  │
                                 │   Service) │
                                 └────────────┘
```

## 🔒 Security Measures

### Implemented

- ✅ JWT authentication with short-lived access tokens
- ✅ Password hashing with bcryptjs (10 rounds)
- ✅ CORS restricted to frontend origin
- ✅ Helmet security headers
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ XSS prevention (React auto-escaping)
- ✅ File upload validation (type, size)
- ✅ httpOnly cookie option for tokens
- ✅ CSRF protection via sameSite cookie attribute

### Recommended Additions

- ⚠️ Rate limiting on authentication endpoints
- ⚠️ Request signing for API calls
- ⚠️ Audit logging for sensitive operations
- ⚠️ Database encryption at rest
- ⚠️ Two-factor authentication (2FA)
- ⚠️ IP whitelisting for admin access
- ⚠️ Content Security Policy (CSP) headers

## 📊 Performance Considerations

### Current Optimizations

- React lazy loading for route components
- Prisma connection pooling
- Database indexes on frequently queried fields
- Pagination for large datasets (tickets, users)
- Zustand for efficient state management

### Scalability Limitations

- Single server deployment
- Local file storage (not distributed)
- No caching layer
- No CDN for static assets
- No load balancing

### Future Improvements

- Add Redis for session storage and caching
- Move file uploads to S3/Azure Blob Storage
- Implement CDN for frontend assets
- Add horizontal scaling with load balancer
- Database read replicas for reporting
- WebSocket for real-time updates

---

**Last Updated:** January 11, 2026  
**Architecture Version:** 1.0
