# Context & Runtime Assumptions

This document defines the implicit contracts, environment assumptions, and fragile boundaries of the HelpDesk codebase. It is written for a forensic engineer who cannot access the running environment.

## 1. System Intent

**Core Purpose:**
A multi-role helpdesk system where Customers submit tickets, and Agents/Managers/Admins resolve them.

**Happy Path User Journeys:**
- **Customer:** Register -> Login -> Dashboard -> Create Ticket -> View Ticket Details (including updates/comments).
- **Agent:** Login -> Dashboard (Ticket Queue) -> Pick Ticket -> Update Status/Add Internal Comment -> Resolve.
- **Admin:** Login -> Dashboard -> Manage Users/Departments/SLA -> Generate Reports.

**Critical Failure Modes:**
- **Missing Auth Data:** If `authStore.initialize()` fails or `localStorage` is empty, the app redirects to `/login`.
- **Role Mismatch:** If a user has a role not defined in `ROLE_HIERARCHY`, they may be stuck in a redirect loop or see a generic "Unauthorized" page.

## 2. Trust Boundaries

### Frontend Assumptions
- **Auth Token:** `localStorage.getItem('accessToken')` is the **sole** source of truth for initial authentication state.
- **User Object:** Assumed to be populated by `GET /api/auth/me` **immediately** after login or initialization.
- **Undefined Risks:**
    - `user.role`: If undefined, `ProtectedRoute` will block access to all dashboard routes.
    - `user.departmentId`: If missing, Agent/Manager views filtering by department will likely crash or show empty lists.

### Backend Assumptions
- **Request User:** `req.user` is populated by `authMiddleware` via JWT. The system **trusts** the JWT signature.
- **Permissions:** Loaded from the database (`Role` model) as a JSON blob. If this JSON is malformed, permissions default to `[]`.
- **Input Validation:** Zod schemas in routes (`auth.js`, etc.) are the **only** line of defense against malformed request bodies.

## 3. Authentication Contract

**Login Endpoint:** `POST /api/auth/login`

**Request Shape:**
```json
{
  "email": "string (email format)",
  "password": "string (min 1 char)"
}
```

**Success Response Shape (Guaranteed):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "string (ENUM value: CUSTOMER, AGENT, ...)",
    "avatar": "string | null"
  },
  "token": "string (JWT)",
  "refreshToken": "string (JWT)" // Assumption: Frontend stores this but only actively uses 'token' for requests
}
```

**Token Storage Strategy:**
- **Backend:** Sends `access_token` as an `httpOnly` cookie (for security) AND as a JSON field (for frontend convenience).
- **Frontend:** Explicitly ignores the cookie for API calls and uses `localStorage` -> `Authorization: Bearer <token>` header logic. **Assumption:** Cookie is a backup or future-proofing, not currently the primary driver for `axios` interceptors.

## 4. Role Resolution & Routing Logic

**Role Source of Truth:** `User.role.name` (Database) -> Flattened to `user.role` string in `authMiddleware`.

**Known Roles (Hierarchy Ascending):**
1. `CUSTOMER`
2. `AGENT`
3. `MANAGER`
4. `ADMIN`
5. `SUPER_ADMIN`

**Routing Guards (`client/src/routes/index.jsx`):**
- `RootRedirect`: Inspects `user.role` to determine the dashboard URL (e.g., `/agent/dashboard` vs `/customer/dashboard`).
- `ProtectedRoute`: Explicitly checks `allowedRoles` array.
- **Fragility:** If a new role is added to the backend but not `ROLE_HIERARCHY` (frontend constants), the user will login successfully but be routed to 404 or Unauthorized.

## 5. Data Shape Contracts

### User (`req.user` / Frontend `user` store)
- `id`: UUID (Required)
- `role`: String (Active Enum Value) (Required - breaks routing if missing)
- `permissions`: Array (Defaults to `[]`)
- `departmentId`: UUID (Nullable, but **critical** for Manager logic)

### Ticket
- `status`: String (Enum: OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED)
- `priority`: String (Enum: LOW, MEDIUM, HIGH, URGENT)
- **Assumption:** Frontend components (`StatusBadge`) map these **exact** strings to colors. Case sensitivity matters.

### Notifications
- `type`: String (Enum from `NOTIFICATION_TYPES`)
- **Assumption:** If a new notification type is emitted by backend, frontend rendering map in `NotificationDropdown` will fallback to default or break.

## 6. Async Data Flow & Race Conditions

**Initialization Race:**
1. App mounts -> `useEffect` triggers `useAuthStore.initialize()`.
2. `initialize` reads `localStorage`.
3. If token exists -> Calls `GET /api/auth/me`.
4. **Risk:** If `GET /api/auth/me` is slow, the app stays in `isLoading` state (Global Spinner).
5. **Race:** If `RootRedirect` runs before `user` is populated (should be prevented by `isLoading` check in `AppRoutes` Suspense/Guards), users might be bounced to Login.

## 7. Frontend State Architecture

**Store:** `authStore` (Zustand)
- **Persistence:** Manual `localStorage` management in `login` and `logout` actions.
- **Rehydration:** Relies on `checkAuth`/`initialize` to pull fresh user data from API on reload. It does **not** persist the full user object in `localStorage`, only the token.

**Store:** `uiStore`
- Handles sidebar toggle and theme.
- **Assumption:** Default theme is likely 'light' if storage is empty.

## 8. Backend Response Guarantees

**Prisma & JSON:**
- `User` password hashes are **always** excluded from response (explicit filtering or `select` clauses in services).
- **Relations:**
    - `me` endpoint includes `role` and `department`.
    - Ticket lists often need `include: { customer: true, assignedTo: true, status: true }`.
    - **Risk:** If an API endpoint forgets `include`, frontend accessing `ticket.customer.firstName` will crash.

## 9. Environment Assumptions

**Frontend (`.env` / `import.meta.env`):**
- `VITE_API_URL`: Base URL for axios. **Assumption:** Must not have trailing slash (usually). Defaults to `http://localhost:4000/api`.

**Backend (`process.env`):**
- `DATABASE_URL`: Postgres connection string.
- `JWT_SECRET`: Critical for token signing. **Assumption:** If changed, all existing client tokens become invalid immediately (Logouts).
- `JWT_REFRESH_SECRET`: Used for refresh tokens.

## 10. Known Fragile Areas

1.  **Role Logic Duplication:** Role strings (`CUSTOMER`, `AGENT`, etc.) exist in generic `constants.js` on frontend and Seed/Enums on backend. A typo in either location breaks the "Happy Path" login redirect.
2.  **Token Dual-Storage:** Backend sets a cookie, but Frontend uses `localStorage`. If the browser blocks third-party cookies or has strict privacy settings, it *should* work (due to `localStorage`), but any future move to "cookie-only" auth will require major frontend refactoring.
3.  **Department Dependency:** Manager views likely rely on `user.departmentId`. If a Manager is created without a Department, `ManagerTeamPage` queries may fail or return empty results silently.
4.  **Date Handling:** Frontend likely uses `date-fns`. It assumes backend dates are valid ISO strings. Malformed dates will cause `Invalid Date` errors in UI.
