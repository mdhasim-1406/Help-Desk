# Helpdesk Backend

Express.js backend service for the Helpdesk application. This service provides RESTful APIs for ticket management, knowledge base categories, and file attachments.

## Architecture Overview

The backend runs as a separate Express service alongside the Next.js frontend:

```
┌─────────────────────────────────────────┐
│         Next.js Frontend (3000)         │
│  - Pages & SSR                          │
│  - Initial API Routes (as fallback)     │
└──────────────┬──────────────────────────┘
               │ CORS
┌──────────────▼──────────────────────────┐
│    Express Backend API (4000)           │
│  - REST endpoints                       │
│  - JWT Authentication                   │
│  - File uploads (multer)                │
│  - Shared Prisma ORM                    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    PostgreSQL Database                  │
│  - Shared Prisma schema                 │
│  - Accessible by both services          │
└─────────────────────────────────────────┘
```

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Security**: Helmet, CORS
- **Validation**: Zod
- **Environment**: dotenv

## Installation

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- `.env` file configured with database credentials and JWT secret

### Steps

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   NODE_ENV=development
   BACKEND_PORT=4000
   FRONTEND_ORIGIN=http://localhost:3000
   DATABASE_URL=postgresql://user:password@localhost:5432/helpdesk_db
   JWT_SECRET=your-secret-key-from-frontend-env
   ```

4. **Run Prisma migrations** (if not already done)
   ```bash
   cd ..
   npx prisma migrate dev
   cd backend
   ```

## Running the Server

### Development Mode

```bash
npm run dev
```

The server will start with source maps enabled for better debugging.

**Output:**
```
╔════════════════════════════════════════╗
║  Express Backend Server Started        ║
║  Environment: development              ║
║  Port: 4000                            ║
║  Frontend Origin: http://localhost:3000║
╚════════════════════════════════════════╝
```

### Production Mode

```bash
npm start
```

## Health Check

```bash
curl http://localhost:4000/health
```

**Response:**
```json
{
  "success": true,
  "message": "Backend is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456
}
```

## API Endpoints

### Knowledge Base Categories

#### List Categories
```http
GET /api/kb/categories
```

Returns all active KB categories with article counts.

#### Get Category Details
```http
GET /api/kb/categories/:id
```

#### Create Category (Protected)
```http
POST /api/kb/categories
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Getting Started",
  "description": "Introduction guides",
  "icon": "rocket",
  "order": 0
}
```

#### Update Category (Protected)
```http
PATCH /api/kb/categories/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### Delete Category (Protected)
```http
DELETE /api/kb/categories/:id
Authorization: Bearer <JWT_TOKEN>
```

### Tickets

#### List Tickets
```http
GET /api/tickets?page=1&limit=20&status=OPEN&priority=HIGH
Authorization: Bearer <JWT_TOKEN>
```

Query Parameters:
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20, max 100
- `status` (optional): OPEN, IN_PROGRESS, WAITING_FOR_USER, RESOLVED, CLOSED
- `priority` (optional): LOW, MEDIUM, HIGH, URGENT
- `assignedTo` (optional): Filter by assigned user ID

**Note:** Regular users see only their created or assigned tickets. Admins see all tickets.

#### Get Ticket Details
```http
GET /api/tickets/:id
Authorization: Bearer <JWT_TOKEN>
```

Includes comments and attachments.

#### Create Ticket (Protected)
```http
POST /api/tickets
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Cannot login to system",
  "description": "I'm unable to access my account...",
  "priority": "HIGH",
  "status": "OPEN",
  "categoryId": "uuid-here",
  "assignedTo": "user-id-here"
}
```

#### Update Ticket (Protected)
```http
PATCH /api/tickets/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "priority": "URGENT"
}
```

#### Add Comment to Ticket (Protected)
```http
POST /api/tickets/:id/comments
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "content": "I've investigated the issue...",
  "isInternal": false
}
```

#### Delete Ticket (Admin Only)
```http
DELETE /api/tickets/:id
Authorization: Bearer <JWT_TOKEN>
```

### Attachments

#### List Attachments for Ticket
```http
GET /api/attachments/ticket/:ticketId
Authorization: Bearer <JWT_TOKEN>
```

#### Upload Files to Ticket (Protected)
```http
POST /api/attachments/ticket/:ticketId
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

files: [file1, file2, ...]
```

**Limits:**
- Max file size: 10MB
- Max files per request: 5
- Allowed types: PDF, Word, Excel, Images (PNG, JPEG, GIF), Text

#### Delete Attachment (Protected)
```http
DELETE /api/attachments/:id
Authorization: Bearer <JWT_TOKEN>
```

Only the uploader can delete their attachments.

#### Download Attachment
```http
GET /api/attachments/:id/download
Authorization: Bearer <JWT_TOKEN>
```

## Authentication

### JWT Token Format

The backend expects JWT tokens in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Alternatively, tokens can be sent as cookies named `token`.

### Permissions System

The backend uses role-based access control (RBAC):

#### Permission Matrix

| Permission | Role | Description |
|-----------|------|-------------|
| `kb:read` | User, Operator, Admin | View KB categories |
| `kb:create` | Operator, Admin | Create KB categories |
| `kb:write` | Operator, Admin | Edit KB categories |
| `kb:delete` | Admin | Delete KB categories |
| `tickets:read` | User, Operator, Admin | View tickets |
| `tickets:create` | User, Operator, Admin | Create tickets |
| `tickets:write` | Operator, Admin | Edit tickets |
| `tickets:admin` | Admin | Admin access to all tickets |
| `tickets:delete` | Admin | Delete tickets |

### Getting a Token

From the frontend, after login:

```javascript
// Token automatically stored in cookies by Next.js
// Backend extracts it from Authorization header or cookies
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "User not found",
  "code": "NOT_FOUND"
}
```

### Common Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate entry)
- `413`: Payload Too Large (file size exceeded)
- `500`: Server Error

## File Storage

Uploaded files are stored in `/backend/uploads/` directory structure:

```
uploads/
├── 1705334400000-1234567890-document.pdf
├── 1705334401000-1234567891-image.jpg
└── ...
```

**Note:** In production, consider using cloud storage (S3, Azure Blob, etc.) instead of local filesystem.

## Development Guidelines

### Adding New Routes

1. Create a new file in `src/routes/api/`
2. Import and use auth middleware as needed:

```javascript
const { authMiddleware, requirePermission } = require('../../middleware/auth');

router.post('/', authMiddleware, requirePermission('resource:create'), asyncHandler(async (req, res) => {
  // Your code here
}));
```

3. Mount the router in `src/index.js`:

```javascript
const newRouter = require('./routes/api/new-resource');
app.use('/api/new-resource', newRouter);
```

### Error Handling

Use the `asyncHandler` wrapper for route handlers:

```javascript
const { asyncHandler } = require('../../utils/errorHandler');

router.get('/', asyncHandler(async (req, res) => {
  // Errors are automatically caught and formatted
}));
```

### Validation

Use Zod schemas for input validation:

```javascript
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

const parsed = schema.safeParse(req.body);
if (!parsed.success) {
  return res.status(400).json(formatValidationError(parsed.error));
}
```

## Testing

Currently, no automated tests are configured. To add tests:

```bash
npm install --save-dev jest supertest
```

Then create test files in `src/__tests__/` directory.

## Performance Considerations

1. **Database Queries**: Add `.select()` to only fetch needed fields
2. **Pagination**: Always paginate list endpoints
3. **Caching**: Consider adding Redis for frequently accessed data
4. **Rate Limiting**: Implement rate limiting for production
5. **Connection Pooling**: Prisma handles this automatically

## Security Best Practices

✅ **Implemented:**
- JWT authentication
- CORS protection
- Helmet security headers
- Input validation with Zod
- Graceful error handling (no stack traces in production)

⚠️ **To Do:**
- Rate limiting (express-rate-limit)
- Request logging (morgan)
- API versioning
- Database connection encryption
- Input sanitization for XSS prevention

## Deployment

### Environment Setup for Production

```env
NODE_ENV=production
BACKEND_PORT=4000
FRONTEND_ORIGIN=https://yourdomain.com
DATABASE_URL=postgresql://prod-user:strong-password@prod-host:5432/helpdesk_db
JWT_SECRET=very-long-random-secret-string-min-32-chars
LOG_LEVEL=warn
```

### Running on a Server

Using PM2 (process manager):

```bash
npm install -g pm2

# Start the server
pm2 start src/index.js --name "helpdesk-backend"

# View logs
pm2 logs helpdesk-backend

# Restart on reboot
pm2 startup
pm2 save
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>
```

### Database Connection Failed

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Ensure database user has permissions

### CORS Errors

- Check `FRONTEND_ORIGIN` matches frontend URL
- Verify credentials are enabled in CORS config

### Token Invalid

- Ensure `JWT_SECRET` matches frontend
- Check token hasn't expired
- Verify token format (Bearer prefix)

## Contributing

When adding new endpoints:

1. Follow existing code structure
2. Use async/await with asyncHandler wrapper
3. Include proper error handling
4. Add validation schemas
5. Document the endpoint
6. Test with curl or Postman

## License

See LICENSE file in root directory.

## Support

For issues or questions, contact the development team or create an issue in the project repository.
