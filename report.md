# HelpDesk Pro – Technical Report

---

## 1. Project Overview

### Purpose

HelpDesk Pro is a full-stack ticket management and customer support system designed to simulate a real-world enterprise application environment. The project focuses on implementing robust authentication, role-based access control, and structured data handling to facilitate efficient support operations.

### Target Users

The system supports four distinct user roles, implementing a hierarchical permission model:

| Role | Description |
|------|-------------|
| **CUSTOMER** | End-users who create support tickets and track their status |
| **AGENT** | Support staff responsible for responding to and resolving tickets |
| **MANAGER** | Team leads who oversee department queues and ticket assignments |
| **ADMIN / SUPER_ADMIN** | Administrators with comprehensive system configuration access |

### Problem Statement

Support teams often struggle with fragmented communication and lack of visibility into ticket resolution metrics. This project aims to solve these issues by providing a unified platform that centralizes ticket tracking, enforces service standards, and maintains data security through strict access controls.

### Scope of Solution

The implementation addresses core helpdesk requirements through:
- Hybrid Role-Based Access Control (RBAC) system
- Standardized ticket lifecycle management (CRUD + State transitions)
- Department-level isolation and assignment logic
- SLA policy definition and breach monitoring
- Foundational Knowledge Base structure
- Notification system based on transactional events
- Reporting module covering key performance indicators (KPIs)
- Security implementation following standard web best practices

---

## 2. System Architecture

### High-Level Design

The system follows a typical three-tier monolithic architecture, chosen for simplicity and ease of deployment while maintaining clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │           Vite + React 19 SPA (Port 5173)                             │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────────┐   │  │
│  │  │ React Router│  │ Zustand Store│  │ Axios with JWT Interceptor  │   │  │
│  │  │ (Role-based)│  │ (State Mgmt) │  │ (API Communication)         │   │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ HTTP/REST + JWT Bearer
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             SERVER LAYER                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │           Express.js Backend (Port 4000)                              │  │
│  │  ┌──────────┐ ┌────────────┐ ┌───────────┐ ┌────────────────────────┐ │  │
│  │  │ Helmet   │ │ Rate Limit │ │ CORS      │ │ Body Parser (50MB)     │ │  │
│  │  │ (Headers)│ │ (API/Auth) │ │ (Origins) │ │ (JSON/URL-encoded)     │ │  │
│  │  └──────────┘ └────────────┘ └───────────┘ └────────────────────────┘ │  │
│  │  ┌──────────┐ ┌────────────┐ ┌───────────────────────────────────────┐ │  │
│  │  │ JWT Auth │ │ RBAC       │ │ DOMPurify Sanitization                │ │  │
│  │  │ Verify   │ │ Enforce    │ │ (XSS Prevention)                      │ │  │
│  │  └──────────┘ └────────────┘ └───────────────────────────────────────┘ │  │
│  │  ┌───────────────────────────────────────────────────────────────────┐ │  │
│  │  │ Route Handlers: /auth /tickets /users /departments /kb /reports   │ │  │
│  │  │                 /notifications /sla /attachments                  │ │  │
│  │  └───────────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ Prisma ORM
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     PostgreSQL Database                               │  │
│  │  Tables: users, roles, departments, tickets, ticket_statuses,        │  │
│  │          ticket_comments, ticket_history, attachments,               │  │
│  │          sla_policies, notifications, kb_categories, kb_articles     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Interaction

1. **Client → Server**: The React frontend acts as the consumer, communicating via Axios. Requests are authenticated using short-lived JWT Bearer tokens.
2. **Server → Database**: The Express backend delegates data access to Prisma ORM, providing type safety and query validation against the PostgreSQL schema.
3. **Request Pipeline**: All incoming requests pass through a middleware chain: `Helmet` (Headers) → `RateLimit` → `Sanitizer` → `Auth` → `RBAC` → `Controller`.

---

## 3. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI library |
| Vite | 7.x | Build tool and local dev server |
| React Router DOM | 6.x | Client-side routing with role guards |
| Zustand | 5.x | Lightweight state management |
| Axios | 1.x | HTTP client with interceptors |
| TailwindCSS | 3.x | Utility-first styling |
| Lucide React | 0.x | Iconography |
| TipTap | 2.x | Rich text editing implementation |
| Recharts | 2.x | Data visualization |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Express.js | 4.x | REST API Framework |
| Prisma Client | 5.x | Database ORM |
| jsonwebtoken | 9.x | Stateless authentication |
| bcryptjs | 2.x | Credential hashing |
| helmet | 7.x | HTTP security headers |
| express-rate-limit | 7.x | Abuse prevention |
| zod | 3.x | Runtime schema validation |
| multer | 1.x | Multipart form data (file uploads) |

### Database

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 12+ | Relational persistence |
| Prisma | 5.x | Schema management and migrations |

---

## 4. Backend Architecture

### API Design Principles

The backend expose a RESTful API designed with resource-oriented URLs. Access control is enforced at the route level.

**Key Route Groups**:
- `/auth`: Session management (Login/Register/Refresh/Logout).
- `/tickets`: Core business logic including CRUD, comments, and assignment.
- `/users` & `/departments`: Organizational structure management.
- `/sla` & `/reports`: Analytics and compliance monitoring.
- `/kb`: Content management for self-service articles.

### Authentication & Authorization

**Authentication Strategy**:
- **Mechanism**: Dual-token JWT system (Access + Refresh).
- **Access Token**: Short lifespan (1 hour), carries identity and role claims.
- **Refresh Token**: Longer lifespan (7 days), persisted in database for revocation capabilities.
- **Transport**: Supports `Authorization: Bearer` header and `httpOnly` cookies for flexibility.

**Authorization (RBAC) Implementation**:
- **Permissions**: Defined as granular strings (e.g., `tickets:create`, `users:read`) stored in the `Role` table.
- **Middleware**: Custom `authMiddleware` validates tokens, while `requirePermission` enforces access rights before controller execution.
- **Hierarchy**: Roles follow a strict hierarchy where higher-privilege roles (like ADMIN) inherit or supersede lower-level permissions, simplified via wildcard support (e.g., `*` or `tickets:*`).

### Data Access & Validation

- **Validation**: All API inputs are validated rigorously using **Zod** schemas to ensure type safety and constraints before business logic execution.
- **Error Handling**: A centralized error handling middleware captures generic errors, Prisma-specific exceptions (e.g., uniqueness violations), and validation failures, returning consistent JSON error responses.

---

## 5. Frontend Architecture

### Routing & Navigation

Routing is handled client-side by React Router v6, utilizing a "Layout" pattern to enforce authentication boundaries.

**Route Guards**:
A `ProtectedRoute` component wraps all private routes. It performs two checks:
1. **Authentication**: Redirects unauthenticated users to login.
2. **Authorization**: Redirects authenticated users to their default dashboard if they attempt to access restricted routes (e.g., a Customer trying to access Admin settings).

### State Management

The application creates a separation of concerns using **Zustand** stores:
- `authStore`: Manages user session and initialization status.
- `ticketStore`: Handles fetching, filtering, and caching of ticket data.
- `uiStore`: Manages global UI state (sidebar, theme, etc.).

### User Experience

- **Dashboards**: Each role (Customer, Agent, Manager, Admin) has a tailored dashboard view exposing only relevant features.
- **Feedback**: Optimistic UI updates and toast notifications (via `react-hot-toast`) provide immediate user feedback during asynchronous operations.

---

## 6. Database Design

### Schema Overview

The database is normalized to 3NF standards where appropriate for this domain. The schema consists of 14 tables defined in `schema.prisma`.

### Core Entities

- **User**: Central identity entity. Linked to Role and Department.
- **Ticket**: The primary business entity. Contains foreign keys to `User` (Customer and Assignee), `Department`, `TicketStatus`, and `SLAPolicy`.
- **TicketHistory**: An audit table tracking field-level changes for accountability.
- **Role**: Stores configuration for the application's permission system.
- **SLA Policy**: Defines timing constraints (`responseTime`, `resolutionTime`) based on Priority.

### Data Integrity

- **Foreign Keys**: Enforced at the database level to prevent orphaned records (e.g., a Ticket cannot exist without a valid Customer).
- **Transactions**: Complex operations (like deleting a ticket and its dependent comments/attachments) are handled implicitly via cascading deletes or explicit Prisma transactions.

---

## 7. Security Implementation

The application implements several security controls appropriate for a modern web application:

### Defense Mechanisms

1.  **Rate Limiting**:
    *   **General API**: Capped at 100 requests / 15 mins to reduce the risk of scraping/DoS.
    *   **Authentication**: Stricter limit (5 requests / 15 mins) on `/login` to mitigate brute-force attacks.
    *   **Uploads**: Limited to 20 files / hour to conserve storage resources.

2.  **Input Sanitization**:
    *   **Server-Side**: Middleware using `DOMPurify` (via JSDOM) strips potentially malicious scripts from rich-text fields (comments, descriptions) before storage.
    *   **Validation**: Strict typing via Zod precludes most injection attempts.

3.  **Audit Logging**:
    *   Critical actions (Login Success/Failure, Permission Denied, Sensitive Data Access) are logged to stdout with structured JSON, redacted of secrets (passwords/tokens).

4.  **File Security**:
    *   Uploads are restricted by MIME type (Safe list) and file size (10MB max).

### Headers & Transport

- **Helmet**: Configures HTTP headers (e.g., `X-Content-Type-Options`, `X-Frame-Options`) to reduce attack surface.
- **CORS**: Explicitly allowed origins to restrict unauthorized cross-domain calls.

---

## 8. Deployment & Operational Considerations

### Configuration Management

The system uses standard **12-Factor App** principles for configuration:
- Database credentials, JWT secrets, and port configurations are injected via environment variables (`.env`).
- Different environments (Development, Production) are supported via `NODE_ENV` switching.

### Deployment Readiness

- **Containerization**: Use of `PostgreSQL` and standard Node.js runtimes makes the application container-friendly (Docker).
- **Build Process**:
    *   Frontend is compiled to static assets via `vite build`.
    *   Backend database migrations are automated via `prisma migrate deploy` at startup.

---

## 9. Testing Strategy

### Automated Verification

The project includes a foundational test suite using **Jest** and **Supertest**:
- **Integration Tests**: Verify API endpoints (`auth.test.js`, `tickets.test.js`) perform correctly against a test database.
- **Security Tests**: Specifically validate that XSS payloads are stripped and rate limits are triggered (`security.test.js`).

### Development Testing

- **Manual QA**: Workflow validation was performed for all role boundaries (e.g., ensuring Agents cannot delete tickets).
- **Validation Logic**: Frontend form validation mirrors backend constraints to improve user experience and reduce server load.

---

## 10. Known Limitations & Tradeoffs

While the system is functional, several architectural decisions were made to prioritize simplicity and delivery within the timeline:

1.  **Polling vs. Push Updates**:
    The application currently relies on client-side refreshing (or manual reload) to see new tickets or status changes. A production-grade helpdesk would typically implement WebSockets (e.g., Socket.io) for real-time collaboration.

2.  **Local File Storage**:
    File uploads are stored on the local filesystem of the backend server. This effectively prevents horizontal scaling (adding more backend servers) without introducing a shared storage layer like AWS S3 or NFS.

3.  **Limited Search Capabilities**:
    Search functionality relies on database `ILIKE` queries. As the dataset grows, this will become a performance bottleneck. A dedicated search engine (like Elasticsearch) would be required for a scalable solution.

4.  **Email Integration**:
    The system currently does not support creating tickets via email (e.g., `support@company.com`), a standard feature in commercial helpdesks. All interaction must occur via the web portal.

5.  **Test Coverage Scope**:
    Testing is currently focused on the "Happy Path" and critical security controls. Edge cases and frontend component unit tests are limited, reducing confidence in complex refactors.

---

## 11. Engineering Insights & Learnings

### Technical Challenges

**Role-Based Access Control (RBAC)**
Designing a permission system that works consistently across both Frontend (UI visibility) and Backend (API security) was a significant challenge. The solution involved decoupling "Roles" from "Permissions," allowing for a flexible system where roles are simply collections of granular permissions, rather than hardcoded logic.

**State Synchronization**
Managing the state between the local React cache and the server required careful planning. Optimistic updates were considered but ultimately deferred in favor of reliable data fetching to ensure consistency, prioritizing data accuracy over perceived performance.

### Design Patterns

The project reinforced the value of the **Service Layer Pattern** in the frontend. Abstracting API calls into dedicated service modules (`authService`, `ticketService`) made the React components cleaner and easier to maintain.

---

## 12. Conclusion

The HelpDesk Pro project represents a fully functional prototype of a modern support ticketing system. By integrating a React frontend with an Express/PostgreSQL backend, the system demonstrates the ability to handle complex relational data, enforce strict security policies, and manage distinct user workflows.

While certain scalability features (like external storage and real-time sockets) were architecturally traded off for reduced complexity, the core implementation provides a solid foundation. The codebase serves as a demonstration of full-stack engineering principles, specifically in the areas of authentication architecture, schema design, and secure API development.

---

**Report Prepared**: January 2026
**Repository**: https://github.com/mdhasim-1406/Help-Desk
