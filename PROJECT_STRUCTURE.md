# Project Structure & Architecture

## 📋 Overview

This is a **hybrid full-stack helpdesk system** with:
- **Next.js 15** frontend (React 19, TypeScript) with SSR capability
- **Express.js** backend (JavaScript) with REST API
- **PostgreSQL 18** database with Prisma ORM
- **Role-based access control (RBAC)** with 5 roles
- **Shared authentication** via JWT tokens

---

## 📁 Directory Structure

```
helpdesk-pro/
├── backend/                          # Express.js API server (PORT 4000)
│   ├── src/
│   │   ├── index.js                 # Main Express app & middleware mounting
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT auth + permission checks
│   │   ├── routes/
│   │   │   └── api/
│   │   │       ├── kb/
│   │   │       │   └── categories.js # KB category endpoints
│   │   │       ├── tickets.js        # Ticket CRUD + comments
│   │   │       └── attachments.js    # File upload/download
│   │   └── utils/
│   │       ├── prismaClient.js       # Shared Prisma ORM client
│   │       └── errorHandler.js       # Error formatting utilities
│   ├── .env                          # Backend env variables
│   ├── .env.example                  # Env template
│   ├── package.json
│   └── README.md                     # Backend setup guide
│
├── src/                              # Next.js frontend (PORT 3000)
│   ├── app/
│   │   ├── layout.tsx                # Root layout with auth provider
│   │   ├── page.tsx                  # Home/redirect page
│   │   ├── login/                    # Login page
│   │   ├── register/                 # Registration page
│   │   ├── dashboard/                # Dashboard (role-specific)
│   │   │   └── [role]-dashboard/    # Dynamic role dashboards
│   │   ├── tickets/
│   │   │   ├── page.tsx              # Tickets list with filters
│   │   │   ├── new/                  # Create ticket form
│   │   │   └── [id]/                 # Ticket detail page (tabs)
│   │   │       ├── page.tsx          # Details + Comments + Attachments
│   │   │       └── layout.tsx
│   │   ├── api/                      # Next.js API routes (fallback)
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   │   ├── login/            # POST for login
│   │   │   │   ├── logout/
│   │   │   │   ├── register/
│   │   │   │   ├── me/               # Get current user
│   │   │   │   └── refresh-token/
│   │   │   ├── tickets/              # Ticket endpoints
│   │   │   ├── kb/                   # KB endpoints
│   │   │   └── attachments/          # File operations
│   │   └── globals.css               # Tailwind + global styles
│   ├── components/
│   │   ├── dashboards/               # Role-specific dashboards
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── ManagerDashboard.tsx
│   │   │   ├── AgentDashboard.tsx
│   │   │   └── CustomerDashboard.tsx
│   │   ├── rich-text-editor.tsx       # Markdown editor component
│   │   ├── file-upload.tsx            # Enhanced file upload (10MB, 5 files)
│   │   ├── role-layout.tsx            # Role-based routing wrapper
│   │   └── ui/                        # shadcn/ui components (48 files)
│   │       ├── dialog.tsx
│   │       ├── table.tsx
│   │       ├── sheet.tsx
│   │       ├── tabs.tsx
│   │       └── ... (other UI primitives)
│   ├── hooks/
│   │   ├── use-mobile.ts              # Mobile detection hook
│   │   └── use-toast.ts               # Toast notification hook
│   ├── lib/
│   │   ├── auth.ts                    # JWT token management
│   │   ├── api-response.ts            # API response formatting
│   │   ├── db.ts                      # Database client
│   │   ├── colors.ts                  # Color theme constants
│   │   ├── constants.ts               # App-wide constants
│   │   ├── helpers.ts                 # Utility functions
│   │   ├── utils.ts                   # Tailwind class utils
│   │   └── validations.ts             # Zod schemas for validation
│   ├── store/
│   │   ├── authStore.ts               # Auth state (Zustand)
│   │   └── uiStore.ts                 # UI state (Zustand)
│   └── app/globals.css
│
├── prisma/
│   ├── schema.prisma                  # Database schema (used by both services)
│   └── seed.ts                        # Database seed script
│
├── public/
│   └── robots.txt
│
├── .env                               # Frontend environment variables
├── .env.example                       # Env template
├── .gitignore
├── package.json                       # Frontend dependencies
├── tsconfig.json                      # TypeScript config
├── next.config.ts                     # Next.js config
├── postcss.config.mjs                 # PostCSS config
├── tailwind.config.ts                 # Tailwind config
├── eslint.config.mjs                  # ESLint config
├── components.json                    # shadcn/ui components config
├── Caddyfile                          # Production reverse proxy config
│
├── README.md                          # Main project README
├── CONTRIBUTING_BACKEND.md            # Backend dev guide
└── PROJECT_STRUCTURE.md              # This file
```

---

## 🔄 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│         Users (Browser/Client)                      │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP/HTTPS
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌────────────────┐    ┌──────────────────┐
│  Next.js       │    │  Express.js      │
│  (3000)        │    │  Backend (4000)  │
├────────────────┤    ├──────────────────┤
│ • Pages/SSR    │    │ • REST APIs      │
│ • Auth         │    │ • Validation     │
│ • UI (React)   │    │ • Business Logic │
│ • API Routes   │    │ • File Uploads   │
│   (fallback)   │    │ • RBAC           │
└────────┬───────┘    └────────┬─────────┘
         │ CORS                │
         └──────────┬──────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  PostgreSQL (5432)   │
         ├──────────────────────┤
         │ • Prisma ORM         │
         │ • Shared Schema      │
         └──────────────────────┘
```

---

## 🔐 Authentication Flow

```
1. User submits login form
2. Next.js API route validates & generates JWT
3. JWT stored in httpOnly cookie + Authorization header
4. Frontend requests include JWT in headers
5. Express backend validates JWT with shared JWT_SECRET
6. Middleware resolves user permissions from database
7. Routes check permissions before executing
```

---

## 💾 Database Schema

### Core Models

**User**
- Email, name, avatar, password hash
- Role (SUPER_ADMIN, ADMIN, MANAGER, AGENT, CUSTOMER)
- Permissions (dynamically resolved from role)

**Ticket**
- Title, description, priority, status
- Created/assigned user relationship
- Comments and attachments

**TicketComment**
- Content, author, ticket reference
- isInternal flag for private notes

**TicketAttachment**
- File metadata (name, size, type, path)
- Uploader reference

**KBCategory**
- Name, description, parent/child hierarchy
- Articles count
- Order for UI sorting

**KBArticle**
- Title, content (markdown), category
- Search indexing support

**Role & Permission**
- Predefined RBAC matrix
- Permission assignment to roles

---

## 🚀 Frontend Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React 19 + Next.js 15 | Component rendering + SSR |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Components** | shadcn/ui + Radix UI | Accessible UI primitives |
| **State Management** | Zustand | Auth + UI state |
| **Forms** | react-hook-form + Zod | Type-safe form validation |
| **Notifications** | sonner | Toast notifications |
| **HTTP Client** | Fetch API | API requests |
| **Language** | TypeScript | Type safety |

---

## 🔌 Backend Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Express.js 4.18 | REST API server |
| **ORM** | Prisma | Type-safe database access |
| **Validation** | Zod | Input validation |
| **Auth** | jsonwebtoken | JWT token generation/validation |
| **File Upload** | Multer | Multipart form data handling |
| **Security** | Helmet | HTTP headers security |
| **CORS** | cors | Cross-origin request handling |
| **Language** | JavaScript (ES6+) | Familiar for team members |

---

## 🔑 Key Endpoints

### Public (No Auth Required)
```
GET  /health                            # Health check
GET  /api/kb/categories                 # List KB categories
GET  /api/kb/categories/:id             # Get category details
```

### Protected (Auth Required)

**Knowledge Base**
```
POST   /api/kb/categories               # Create category (operator+)
PATCH  /api/kb/categories/:id           # Update category
DELETE /api/kb/categories/:id           # Delete category (admin only)
```

**Tickets**
```
GET    /api/tickets                     # List tickets (paginated)
GET    /api/tickets/:id                 # Get ticket details
POST   /api/tickets                     # Create ticket
PATCH  /api/tickets/:id                 # Update ticket
DELETE /api/tickets/:id                 # Delete ticket (admin only)
POST   /api/tickets/:id/comments        # Add comment to ticket
```

**Attachments**
```
GET    /api/attachments/ticket/:id      # List attachments
POST   /api/attachments/ticket/:id      # Upload files
DELETE /api/attachments/:id             # Delete attachment
GET    /api/attachments/:id/download    # Download file
```

---

## 👥 User Roles & Permissions

### SUPER_ADMIN
- Full system access
- User management
- Role configuration
- All RBAC permissions

### ADMIN
- All SUPER_ADMIN features except user management
- Ticket administration
- KB management
- Reports

### MANAGER
- Team management
- Ticket assignment & oversight
- Performance monitoring
- Report generation

### AGENT
- Ticket resolution
- Comment on tickets
- KB article access
- Personal performance view

### CUSTOMER
- Submit tickets
- View own tickets
- Comment on own tickets
- Track ticket status

---

## 🛠 Development Commands

### Frontend
```bash
# Install & run development server
npm install
npm run dev              # Next.js dev server (3000)

# Build for production
npm run build
npm start

# Linting
npm run lint
npm run format

# Tests
npm run test
```

### Backend
```bash
cd backend

# Install & run development server
npm install
npm run dev              # Express dev server (4000)

# Production
npm start

# No tests configured yet
npm run test
```

### Database
```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed database
npx prisma db seed
```

---

## 📊 Performance Considerations

1. **Caching**: Add Redis for frequently accessed data
2. **Pagination**: All list endpoints support page/limit
3. **Database**: Prisma automatically handles connection pooling
4. **File Storage**: Currently filesystem; move to S3/Azure in production
5. **API Rate Limiting**: Implement in production
6. **Request Logging**: Monitor performance with morgan/pino

---

## 🔒 Security Features

✅ **Implemented**
- JWT authentication with httpOnly cookies
- CORS protection with configurable origins
- Helmet security headers
- Input validation with Zod
- SQL injection prevention (Prisma ORM)
- Graceful error handling (no stack traces in production)
- Permission-based access control

⚠️ **To Implement**
- Rate limiting
- Request signing
- API versioning
- Audit logging
- Database encryption at rest

---

## 📝 Code Organization Principles

### Frontend (TypeScript)
- Components in `src/components/`
- Pages in `src/app/`
- Utilities in `src/lib/`
- State in `src/store/`
- Type safety enforced

### Backend (JavaScript)
- Routes in `src/routes/api/`
- Middleware in `src/middleware/`
- Utilities in `src/utils/`
- Simple, readable code
- Comments for complex logic

### Database
- Single Prisma schema in `prisma/schema.prisma`
- Used by both frontend and backend
- Migrations tracked in `prisma/migrations/`

---

## 🚢 Deployment

### Frontend (Next.js)
```bash
# Build
npm run build

# Run (uses .next/standalone)
npm start

# Or deploy to Vercel, Netlify, etc.
```

### Backend (Express)
```bash
# Build not required (Node.js)
# Set NODE_ENV=production
npm start

# Or use PM2:
pm2 start src/index.js --name "helpdesk-backend"
```

### Database
```bash
# Ensure PostgreSQL is running
# Run migrations:
npx prisma migrate deploy
```

---

## 🤝 Contributing

- **Frontend**: See code comments for complex logic
- **Backend**: Read `CONTRIBUTING_BACKEND.md` for JavaScript developers
- **General**: Follow existing code patterns
- **Testing**: Add tests before committing
- **Commits**: Use clear, descriptive messages

---

## ❓ Quick Reference

**Frontend not loading?**
```bash
npm run dev              # Ensure Next.js is running on 3000
```

**Backend not responding?**
```bash
cd backend && npm run dev  # Ensure Express is running on 4000
```

**Database connection failed?**
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
# Verify migrations: npx prisma migrate status
```

**Port already in use?**
```bash
# Frontend: lsof -i :3000
# Backend: lsof -i :4000
# Kill process: kill -9 <PID>
```

---

## 📚 Additional Documentation

- [`README.md`](./README.md) - Project overview & setup
- [`backend/README.md`](./backend/README.md) - Backend API documentation
- [`CONTRIBUTING_BACKEND.md`](./CONTRIBUTING_BACKEND.md) - Backend development guide
- [`.env.example`](./.env.example) - Environment variables template

---

**Last Updated**: January 8, 2026
**Maintainers**: Development Team
