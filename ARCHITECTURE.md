# HelpDesk Pro - System Architecture

## 🏗️ Overview

HelpDesk Pro is a full-stack ticket management system built with a modern, scalable architecture. The system follows a clean separation between the presentation layer (Vite + React frontend), business logic layer (Express backend), and data layer (PostgreSQL database).

## 📐 System Diagram

```mermaid
graph TD
    User[Clients] -->|HTTP/REST| RateLimiter[Rate Limiting Middleware]
    RateLimiter -->|Allow/Deny| Backend[Express Backend (Port 4000)]
    
    subgraph Frontend [Vite + React (Port 5173)]
        UI[User Interface]
        Store[Zustand State]
        Router[React Router]
    end
    
    subgraph BackendLayer [Backend Services]
        Auth[Auth Middleware]
        RBAC[RBAC Control]
        API[REST API Routes]
        Sanitizer[Input Sanitizer]
        Logger[Audit Logger]
    end
    
    subgraph DataLayer [Persistence]
        Prisma[Prisma ORM]
        DB[(PostgreSQL)]
    end

    UI -->|Axios| RateLimiter
    Backend --> Auth
    Auth --> RBAC
    RBAC --> Sanitizer
    Sanitizer --> API
    API --> Prisma
    Prisma --> DB
    API --> Logger
```

## 🔐 Authentication & Security

### Security Layers
1. **Rate Limiting**: `express-rate-limit` protects against brute force.
   - Auth Routes: 5 req/15min
   - API Routes: 100 req/15min
2. **Input Sanitization**: `dompurify` cleanses all inputs to prevent XSS.
3. **Audit Logging**: Sensitive actions (Login, Failed Login) are logged.
4. **Helmet**: Sets secure HTTP headers (HSTS, NoSniff, FrameGuard).

### Authentication Flow
1. **Login**: User POSTs credentials.
2. **Verification**: Backend validates via `bcryptjs`.
3. **Token Issue**: Returns `accessToken` (1h) and `refreshToken` (7d).
4. **Storage**: Frontend stores tokens in `localStorage`.
5. **Requests**: Axios interceptor attaches `Authorization: Bearer <token>`.

## 🛡️ Authorization (RBAC)

### Role Hierarchy
- **SUPER_ADMIN**: Full system access.
- **ADMIN**: Manage users, tickets, system.
- **MANAGER**: Department level management.
- **AGENT**: Ticket resolution.
- **CUSTOMER**: Create/View own tickets.

## 🗄️ Database Schema

Uses **PostgreSQL** with **Prisma ORM**.
Key Models: `User`, `Ticket`, `Comment`, `Attachment`.

## 🔄 Request Pipeline

1. **Request** -> **Helmet** -> **CORS** -> **RateLimit**
2. **Body Parser** -> **Sanitizer**
3. **Auth Middleware** (JWT Verify) -> **RBAC** (Permission Check)
4. **Controller** (Business Logic) -> **Prisma** -> **DB**
5. **Response** -> **Client**
