# HelpDesk Pro - Setup Guide

Complete step-by-step installation and configuration guide for HelpDesk Pro.

## 📋 Prerequisites

### Required Software

| Software | Minimum Version | Check Command |
|----------|----------------|---------------|
| Node.js | 18.0.0 | `node --version` |
| npm | 8.0.0 | `npm --version` |
| PostgreSQL | 12.0 | `psql --version` |
| Git | 2.0 | `git --version` |

### System Requirements

**Development:**
- CPU: 2 cores
- RAM: 4GB
- Disk: 10GB free space

**Production:**
- CPU: 4+ cores
- RAM: 8GB+
- Disk: 50GB+ (depending on file uploads)

## 🚀 Installation

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd helpdesk-pro
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# This will automatically run:
# - prisma generate (creates Prisma client)
```

### Step 3: Database Setup

#### Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE helpdesk;

# Create user (optional)
CREATE USER helpdesk_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE helpdesk TO helpdesk_user;

# Exit
\q
```

#### Configure Environment Variables

Create `backend/.env` file:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/helpdesk"

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"

# Server Configuration
BACKEND_PORT=4000
NODE_ENV=development

# CORS
FRONTEND_ORIGIN="http://localhost:5173"

# File Upload (optional)
MAX_FILE_SIZE=10485760  # 10MB in bytes
MAX_FILES=5
```

**⚠️ IMPORTANT:** Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong random strings in production!

Generate secure secrets:
```bash
# On Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate --schema ../prisma/schema.prisma

# Run migrations (creates tables)
npx prisma migrate dev --schema ../prisma/schema.prisma --name init

# Seed database with test data
npx prisma db seed --schema ../prisma/schema.prisma
```

**Seed Data Created:**
- 5 Roles (SUPER_ADMIN, ADMIN, MANAGER, AGENT, CUSTOMER)
- 3 Departments (Technical Support, Customer Service, Billing)
- 5 Ticket Statuses (OPEN, IN_PROGRESS, PENDING, RESOLVED, CLOSED)
- 4 SLA Policies (one per priority level)
- 4 Test Users (admin, manager, agent, customer)
- 2 KB Categories
- 1 Sample KB Article

### Step 4: Frontend Setup

```bash
# Navigate to frontend directory
cd ../client

# Install dependencies
npm install
```

#### Configure Frontend Environment (Optional)

Create `client/.env` file if you need to customize:

```bash
# API URL (default: http://localhost:4000)
VITE_API_URL=http://localhost:4000
```

**Note:** The frontend automatically uses `http://localhost:4000` if `VITE_API_URL` is not set.

### Step 5: Verify Installation

#### Start Backend

```bash
cd backend
npm run dev
```

Expected output:
```
✓ Database connection successful

╔════════════════════════════════════════╗
║  Express Backend Server Started        ║
║  Environment: development              ║
║  Port: 4000                            ║
║  Frontend Origin: http://localhost:5173║
╚════════════════════════════════════════╝
```

#### Start Frontend (in new terminal)

```bash
cd client
npm run dev
```

Expected output:
```
  VITE v7.2.4  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

#### Test the Application

1. Open browser to http://localhost:5173
2. You should see the login page
3. Login with test credentials:
   - Email: `admin@helpdesk.com`
   - Password: `admin123`
4. You should be redirected to the admin dashboard

## 🔧 Configuration

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | ✅ Yes | - | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | ✅ Yes | - | Secret for signing refresh tokens |
| `BACKEND_PORT` | No | 4000 | Port for backend server |
| `NODE_ENV` | No | development | Environment (development/production) |
| `FRONTEND_ORIGIN` | No | http://localhost:3000 | Allowed CORS origin |
| `MAX_FILE_SIZE` | No | 10485760 | Max file upload size (bytes) |
| `MAX_FILES` | No | 5 | Max files per upload |

### Frontend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | http://localhost:4000 | Backend API base URL |

### Database Configuration

#### Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]?[parameters]
```

Examples:
```bash
# Local development
DATABASE_URL="postgresql://postgres:password@localhost:5432/helpdesk"

# With custom user
DATABASE_URL="postgresql://helpdesk_user:secure_pass@localhost:5432/helpdesk"

# Remote database
DATABASE_URL="postgresql://user:pass@db.example.com:5432/helpdesk?sslmode=require"

# With connection pooling
DATABASE_URL="postgresql://user:pass@localhost:5432/helpdesk?connection_limit=10"
```

## 🗄️ Database Management

### View Database with Prisma Studio

```bash
npx prisma studio --schema ./prisma/schema.prisma
```

Opens GUI at http://localhost:5555 to browse and edit data.

### Create Migration

```bash
# After modifying prisma/schema.prisma
npx prisma migrate dev --schema ./prisma/schema.prisma --name description_of_changes
```

### Reset Database (⚠️ Deletes all data)

```bash
npx prisma migrate reset --schema ./prisma/schema.prisma
```

This will:
1. Drop database
2. Create database
3. Run all migrations
4. Run seed script

### Backup Database

```bash
# Backup
pg_dump -U postgres helpdesk > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres helpdesk < backup_20260111.sql
```

## 🐛 Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::4000`

```bash
# Find process using port
lsof -i :4000

# Kill process
kill -9 <PID>

# Or kill all node processes
pkill -9 node
```

### Database Connection Failed

**Error:** `Can't reach database server`

**Solutions:**

1. **Check PostgreSQL is running:**
```bash
# Linux
sudo systemctl status postgresql

# Mac
brew services list

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql   # Mac
```

2. **Verify connection:**
```bash
psql -U postgres -d helpdesk
```

3. **Check DATABASE_URL:**
```bash
# Test connection string
psql "postgresql://postgres:password@localhost:5432/helpdesk"
```

4. **Regenerate Prisma client:**
```bash
cd backend
npx prisma generate --schema ../prisma/schema.prisma
```

### Prisma Migration Errors

**Error:** `Migration failed to apply`

**Solutions:**

1. **Check migration status:**
```bash
npx prisma migrate status --schema ./prisma/schema.prisma
```

2. **Resolve migration:**
```bash
npx prisma migrate resolve --schema ./prisma/schema.prisma
```

3. **Reset and start fresh (⚠️ deletes data):**
```bash
npx prisma migrate reset --schema ./prisma/schema.prisma
```

### Frontend Build Errors

**Error:** `Failed to resolve import`

**Solutions:**

1. **Clear Vite cache:**
```bash
rm -rf client/node_modules/.vite
cd client && npm run dev
```

2. **Reinstall dependencies:**
```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

### Backend Won't Start

**Error:** `Cannot find module '@prisma/client'`

**Solutions:**

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npx prisma generate --schema ../prisma/schema.prisma
npm run dev
```

### CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solutions:**

1. **Check FRONTEND_ORIGIN in backend/.env:**
```bash
FRONTEND_ORIGIN="http://localhost:5173"
```

2. **Verify frontend is running on correct port:**
```bash
# Frontend should be on 5173 (Vite default)
```

3. **Restart backend after changing .env:**
```bash
cd backend
npm run dev
```

### Login Not Working

**Symptoms:** Login button does nothing or returns error

**Solutions:**

1. **Check backend is running:**
```bash
curl http://localhost:4000/health
```

2. **Check browser console for errors**

3. **Verify test user exists:**
```bash
npx prisma studio --schema ./prisma/schema.prisma
# Check users table for admin@helpdesk.com
```

4. **Re-seed database:**
```bash
npx prisma db seed --schema ./prisma/schema.prisma
```

### File Upload Errors

**Error:** `File too large` or `Too many files`

**Solutions:**

1. **Check limits in backend/.env:**
```bash
MAX_FILE_SIZE=10485760  # 10MB
MAX_FILES=5
```

2. **Ensure uploads directory exists:**
```bash
mkdir -p backend/uploads
chmod 755 backend/uploads
```

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] Change `JWT_SECRET` to strong random string (32+ chars)
- [ ] Change `JWT_REFRESH_SECRET` to strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Configure production `DATABASE_URL`
- [ ] Set production `FRONTEND_ORIGIN` for CORS
- [ ] Enable HTTPS/SSL
- [ ] Setup database backups
- [ ] Configure monitoring/logging
- [ ] Review file upload limits
- [ ] Setup reverse proxy (Nginx/Caddy)
- [ ] Configure firewall rules

### Backend Deployment

```bash
cd backend

# Install production dependencies only
npm install --production

# Run migrations
npx prisma migrate deploy --schema ../prisma/schema.prisma

# Start with PM2 (recommended)
npm install -g pm2
pm2 start src/index.js --name helpdesk-backend
pm2 save
pm2 startup
```

### Frontend Deployment

```bash
cd client

# Build for production
npm run build

# Output in dist/ directory
# Deploy dist/ to:
# - Vercel
# - Netlify
# - Nginx/Apache
# - S3 + CloudFront
```

### Nginx Configuration Example

```nginx
# Frontend
server {
    listen 80;
    server_name helpdesk.example.com;
    
    root /var/www/helpdesk/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Backend
server {
    listen 80;
    server_name api.helpdesk.example.com;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring

### Health Check Endpoint

```bash
curl http://localhost:4000/health
```

Response:
```json
{
  "success": true,
  "message": "Backend is healthy",
  "timestamp": "2026-01-11T05:37:09.000Z",
  "uptime": 123.456
}
```

### Database Health

```bash
# Check connection
npx prisma db execute --stdin <<< "SELECT 1" --schema ./prisma/schema.prisma

# Check table counts
psql $DATABASE_URL -c "SELECT 'users' as table, COUNT(*) FROM users UNION ALL SELECT 'tickets', COUNT(*) FROM tickets;"
```

### Log Files

```bash
# Backend logs (if using PM2)
pm2 logs helpdesk-backend

# Database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 🔄 Updates

### Update Dependencies

```bash
# Backend
cd backend
npm update
npm audit fix

# Frontend
cd client
npm update
npm audit fix
```

### Update Database Schema

```bash
# 1. Modify prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --schema ./prisma/schema.prisma --name add_new_field

# 3. Deploy to production
npx prisma migrate deploy --schema ./prisma/schema.prisma
```

---

**Last Updated:** January 11, 2026  
**Setup Guide Version:** 1.0
