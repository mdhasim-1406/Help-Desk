# Port Cleanup Quick Reference

## Quick Fix for EADDRINUSE Errors

### One-Liner Kill & Restart
```bash
# Kill all Node processes on ports 3000 and 4000
pkill -f "node|next" 2>/dev/null

# Wait a moment
sleep 1

# Restart both services
npm run dev  # Terminal 1 - Frontend (3000)
npm run dev:backend  # Terminal 2 - Backend (4000)
```

### Find What's Using a Port
```bash
# Check which process is using port 3000
lsof -i :3000

# Check port 4000
lsof -i :4000

# Kill by port
lsof -i :4000 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

## Best Practice: Use Concurrently

### Install
```bash
npm install -D concurrently
```

### Update `package.json` root
```json
{
  "scripts": {
    "dev:frontend": "next dev -p 3000",
    "dev:backend": "cd backend && npm run dev",
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:clean": "pkill -f 'node|next' && sleep 1 && npm run dev"
  }
}
```

### Run Both Services at Once
```bash
npm run dev              # Starts both frontend and backend
npm run dev:clean       # Kills old processes and starts fresh
```

## Permanent Solution: Docker Compose

### Create `docker-compose.yml`
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/helpdesk_db
      - NODE_ENV=development
    depends_on:
      - postgres

  postgres:
    image: postgres:18-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=helpdesk_user
      - POSTGRES_PASSWORD=helpdesk_pass
      - POSTGRES_DB=helpdesk_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Run with Docker Compose
```bash
# Start all services
docker-compose up

# Stop all services
docker-compose down

# Rebuild
docker-compose up --build
```

## Environment Variables

### Root `./.env`
```env
# Frontend only needs to know about backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### Backend `./backend/.env`
```env
DATABASE_URL=postgresql://helpdesk_user:helpdesk_pass@localhost:5432/helpdesk_db
JWT_SECRET=your-secret-key-here
BACKEND_PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
NODE_ENV=development
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | `lsof -i :3000 \| grep LISTEN \| awk '{print $2}' \| xargs kill -9` |
| Port 4000 already in use | `lsof -i :4000 \| grep LISTEN \| awk '{print $2}' \| xargs kill -9` |
| Database connection failed | Check PostgreSQL is running: `psql -U helpdesk_user -d helpdesk_db` |
| CORS errors in frontend | Verify `FRONTEND_ORIGIN` in backend .env |
| JWT token invalid | Ensure `JWT_SECRET` matches in both frontend/backend |

---

**Created**: January 8, 2026
**Status**: Ready for team use
