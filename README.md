# HelpDesk Pro

A full-stack helpdesk and ticket management system with role-based access control, built with modern web technologies.

## 🚀 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | Vite + React | 7.2.4 + 19.2.0 |
| **Backend** | Express.js | 4.18.2 |
| **Database** | PostgreSQL + Prisma ORM | Latest |
| **Styling** | Tailwind CSS | 3.4.1 |
| **State Management** | Zustand | 5.0.9 |
| **Routing** | React Router DOM | 6.30.3 |
| **Rich Text Editor** | TipTap | 3.15.3 |
| **Forms** | React Hook Form | 7.70.0 |
| **Charts** | Recharts | 3.6.0 |
| **Icons** | Lucide React | 0.562.0 |
| **Validation** | Zod | 4.0.2 |
| **Authentication** | JWT + bcryptjs | 9.0.3 + 2.4.3 |

## 📁 Project Structure

```
helpdesk-pro/
├── client/                    # Frontend application (Vite + React)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── common/        # Shared components (Button, Input, etc.)
│   │   │   └── layout/        # Layout components (AuthLayout, CustomerLayout, etc.)
│   │   ├── pages/             # Page components
│   │   │   ├── auth/          # Login, Register, ForgotPassword
│   │   │   ├── customer/      # Customer dashboard and tickets
│   │   │   ├── agent/         # Agent ticket queue and details
│   │   │   ├── manager/       # Manager dashboard, team, reports
│   │   │   ├── admin/         # Admin panel (users, departments, SLA, KB)
│   │   │   └── common/        # Shared pages (Profile, KB, Articles)
│   │   ├── services/          # API service layer
│   │   ├── store/             # Zustand state management
│   │   ├── utils/             # Utility functions and constants
│   │   ├── routes/            # Route configuration
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Entry point
│   ├── public/                # Static assets
│   ├── package.json
│   └── vite.config.js
│
├── backend/                   # API server (Express.js)
│   ├── src/
│   │   ├── routes/
│   │   │   └── api/           # API route handlers
│   │   │       ├── auth.js    # Authentication routes
│   │   │       ├── tickets.js # Ticket management
│   │   │       ├── users.js   # User management
│   │   │       ├── departments.js
│   │   │       ├── notifications.js
│   │   │       ├── reports.js
│   │   │       ├── sla.js
│   │   │       ├── attachments.js
│   │   │       └── kb/        # Knowledge base routes
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT authentication & RBAC
│   │   ├── utils/
│   │   │   ├── errorHandler.js
│   │   │   └── prismaClient.js
│   │   └── index.js           # Server entry point
│   ├── uploads/               # File upload storage
│   └── package.json
│
└── prisma/                    # Database schema and migrations
    ├── schema.prisma          # Database models
    └── seed.ts                # Database seeding script
```

## ⚡ Quick Start

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL (any recent version)
- npm or yarn

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd helpdesk-pro

# 2. Install backend dependencies
cd backend
npm install

# 3. Setup environment variables
# Create backend/.env with:
# DATABASE_URL="postgresql://user:password@localhost:5432/helpdesk"
# JWT_SECRET="your-secret-key-change-in-production"
# JWT_REFRESH_SECRET="your-refresh-secret-key"
# BACKEND_PORT=4000
# FRONTEND_ORIGIN="http://localhost:5173"
# NODE_ENV="development"

# 4. Setup database
npx prisma generate --schema ../prisma/schema.prisma
npx prisma migrate dev --schema ../prisma/schema.prisma
npx prisma db seed --schema ../prisma/schema.prisma

# 5. Install frontend dependencies
cd ../client
npm install

# 6. Setup frontend environment (if needed)
# Create client/.env with:
# VITE_API_URL=http://localhost:4000
```

### Running the Application

```bash
# Terminal 1: Start Backend
cd backend
npm run dev
# Backend runs on http://localhost:4000

# Terminal 2: Start Frontend
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

### Access the Application

1. Open http://localhost:5173 in your browser
2. Login with test credentials (see below)

## 🔐 Test Credentials

All test accounts use the password: `admin123`

| Email | Role | Access Level |
|-------|------|--------------|
| admin@helpdesk.com | SUPER_ADMIN | Full system access |
| manager@helpdesk.com | MANAGER | Team management, reports |
| agent@helpdesk.com | AGENT | Ticket resolution |
| customer@helpdesk.com | CUSTOMER | Submit and view own tickets |

## ✨ Features

### Authentication & Authorization
- ✅ JWT-based authentication with refresh tokens
- ✅ Role-based access control (RBAC) with 5 roles
- ✅ Protected routes with role hierarchy
- ✅ Token storage in localStorage
- ✅ Automatic token refresh

### Ticket Management
- ✅ Create, view, update, and delete tickets
- ✅ Ticket priorities (LOW, MEDIUM, HIGH, URGENT)
- ✅ Ticket statuses (OPEN, IN_PROGRESS, PENDING, RESOLVED, CLOSED)
- ✅ Ticket assignment to agents/departments
- ✅ Rich text descriptions with TipTap editor
- ✅ File attachments (max 10MB, 5 files per ticket)
- ✅ Comments and internal notes
- ✅ Ticket history tracking

### Knowledge Base
- ✅ Article categories with hierarchy
- ✅ Public and private articles
- ✅ Article search and filtering
- ✅ View counts and helpful ratings
- ✅ Rich text content

### User Management
- ✅ User CRUD operations (Admin only)
- ✅ Role assignment
- ✅ Department assignment
- ✅ User activation/deactivation
- ✅ Profile management

### Department Management
- ✅ Create and manage departments
- ✅ Assign department managers
- ✅ Department-based ticket routing

### SLA Management
- ✅ Priority-based SLA policies
- ✅ Response and resolution time tracking
- ✅ SLA breach warnings
- ✅ Automated SLA calculations

### Reports & Analytics
- ✅ Ticket statistics by status, priority
- ✅ Agent performance metrics
- ✅ Department analytics
- ✅ SLA compliance reports
- ✅ Interactive charts with Recharts

### Notifications
- ✅ In-app notification system
- ✅ Notification types (ticket events, SLA warnings, mentions)
- ✅ Mark as read/unread
- ✅ Toast notifications with React Hot Toast

## 🌐 API Endpoints

See [API.md](./API.md) for complete API documentation.

**Base URL:** `http://localhost:4000/api`

### Quick Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | User login | No |
| POST | `/auth/register` | User registration | No |
| POST | `/auth/logout` | User logout | Yes |
| GET | `/auth/me` | Get current user | Yes |
| GET | `/tickets` | List tickets | Yes |
| POST | `/tickets` | Create ticket | Yes |
| GET | `/tickets/:id` | Get ticket details | Yes |
| PATCH | `/tickets/:id` | Update ticket | Yes |
| POST | `/tickets/:id/comments` | Add comment | Yes |
| GET | `/users` | List users | Yes (Admin) |
| GET | `/departments` | List departments | Yes |
| GET | `/reports/overview` | Get reports | Yes |

## 🛠️ Development

### Frontend Development

```bash
cd client
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Backend Development

```bash
cd backend
npm run dev      # Start dev server with auto-reload
npm start        # Production mode
```

### Database Management

```bash
# Generate Prisma client
npx prisma generate --schema ./prisma/schema.prisma

# Create migration
npx prisma migrate dev --schema ./prisma/schema.prisma

# Open Prisma Studio (database GUI)
npx prisma studio --schema ./prisma/schema.prisma

# Reset database (WARNING: deletes all data)
npx prisma migrate reset --schema ./prisma/schema.prisma

# Seed database
npx prisma db seed --schema ./prisma/schema.prisma
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and design |
| [SETUP.md](./SETUP.md) | Detailed setup instructions |
| [API.md](./API.md) | Complete API documentation |
| [OPERATIONS.md](./OPERATIONS.md) | Operations and deployment guide |

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :5173  # Frontend
lsof -i :4000  # Backend

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql "postgresql://user:password@localhost:5432/helpdesk"

# Regenerate Prisma client
npx prisma generate --schema ./prisma/schema.prisma
```

### Frontend Build Issues

```bash
# Clear Vite cache
rm -rf client/node_modules/.vite
cd client && npm run dev
```

### Backend Won't Start

```bash
cd backend
rm -rf node_modules
npm install
npx prisma generate --schema ../prisma/schema.prisma
npm run dev
```

## 🚀 Deployment

### Production Checklist

- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET` (32+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `FRONTEND_ORIGIN` for CORS
- [ ] Enable HTTPS
- [ ] Setup database backups
- [ ] Configure file upload limits
- [ ] Setup monitoring and logging
- [ ] Use environment-specific database
- [ ] Enable rate limiting (recommended)

### Frontend Deployment

```bash
cd client
npm run build
# Deploy dist/ folder to Vercel, Netlify, or static hosting
```

### Backend Deployment

```bash
cd backend
NODE_ENV=production npm start
# Or use PM2 for process management:
# pm2 start src/index.js --name helpdesk-backend
```

## 🔒 Security Features

- ✅ JWT authentication with httpOnly cookies option
- ✅ Password hashing with bcryptjs
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS prevention (React auto-escaping)
- ✅ File upload validation (type and size)

## 📊 System Requirements

### Development
- CPU: 2 cores
- RAM: 4GB
- Disk: 10GB

### Production
- CPU: 4 cores
- RAM: 8GB
- Disk: 50GB (depending on file uploads)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

---

**Last Updated:** January 11, 2026  
**Status:** Production Ready ✅  
**Version:** 0.1.0
