# HELPDESK PRO - ATOMIC SPECIFICATION & QUALITY ASSURANCE PROTOCOL

**Status:** ACTIVE AUDIT
**Mandate:** Zero defects. Total compliance with this specification is required.

---

# SECTION 1: AUTHENTICATION & SESSION MANAGEMENT (GLOBAL)

### 1.1 Login Page (`/login`)
- [ ] **UI:** Clean, centered card. Email input, Password input, "Sign In" button.
- [ ] **Action:** Clicking "Sign In" sends POST `/api/auth/login`.
- [ ] **Validation:** Empty email/password triggers inline error "Required".
- [ ] **Error Handling:** Invalid credentials triggers Toast Error "Invalid email or password".
- [ ] **Success:** 
    - JWT stored in `localStorage`.
    - User object stored in `authStore`.
    - **Redirect Logic:**
        - Role `CUSTOMER` -> Redirects to `/customer/dashboard`
        - Role `AGENT` -> Redirects to `/agent/dashboard`
        - Role `MANAGER` -> Redirects to `/manager/dashboard`
        - Role `ADMIN` -> Redirects to `/admin/dashboard`

### 1.2 Registration (`/register`)
- [ ] **UI:** Inputs for First Name, Last Name, Email, Password, Confirm Password.
- [ ] **Validation:** Password match check. Email format check.
- [ ] **Action:** Clicking "Register" sends POST `/api/auth/register`.
- [ ] **Default Role:** New registrations MUST be role `CUSTOMER`.
- [ ] **Success:** Auto-login and redirect to `/customer/dashboard`.

### 1.3 Logout
- [ ] **Action:** Clicking "Logout" in any Sidebar/Header.
- [ ] **Effect:** Clears `localStorage` (tokens), clears `authStore`, redirects to `/login`.

### 1.4 Session Persistence
- [ ] **Reload:** Refreshing the browser on a protected route DOES NOT log the user out.
- [ ] **Check:** App startup checks `localStorage` for token, validates with `/api/auth/me`.

---

# SECTION 2: CUSTOMER PORTAL (`/customer/*`)

### 2.1 Customer Dashboard (`/customer/dashboard`)
- [ ] **Stats:** Shows "My Open Tickets", "My Closed Tickets". (Data source: `GET /api/tickets?status=...`).
- [ ] **Recent Tickets:** List last 5 tickets belonging to THIS customer.
- [ ] **Quick Action:** "Create New Ticket" button works.

### 2.2 Create Ticket (`/customer/tickets/new`)
- [ ] **Form:** Subject (Text), Priority (Dropdown), Description (Rich Text/Textarea), Attachments (File Input).
- [ ] **Hidden Fields:** 
    - `customerId` must be inferred from Token (backend). 
    - `departmentId` should be optional/null (routed by Admin/Manager later).
- [ ] **Action:** Submit sends POST `/api/tickets`.
- [ ] **Success:** Redirects to Ticket Detail view. Toast "Ticket Created".

### 2.3 Ticket List (`/customer/tickets`)
- [ ] **Data Isolation:** Query MUST be `GET /api/tickets`.
    - **CRITICAL:** Backend MUST filter `where: { customerId: req.user.id }`.
    - Customer A MUST NOT see Customer B's tickets.
- [ ] **Columns:** ID, Subject, Status (Badge), Created Date.
- [ ] **Interaction:** Clicking a row navigates to `/customer/tickets/:id`.

### 2.4 Ticket Detail (`/customer/tickets/:id`)
- [ ] **Header:** Shows Ticket #, Subject, Status Badge.
- [ ] **Chat Interface:**
    - List of messages (Customer <-> Agent).
    - **CRITICAL:** Messages with `isInternal: true` MUST NOT be rendered.
- [ ] **Reply:** Textarea + "Send" button. Sends POST `/api/tickets/:id/messages`.
- [ ] **Actions:** "Close Ticket" button (sets status `CLOSED`).

---

# SECTION 3: AGENT WORKSPACE (`/agent/*`)

### 3.1 Agent Dashboard (`/agent/dashboard`)
- [ ] **Stats:** "Assigned to Me", "Unassigned in Dept", "My SLA Breaches".
- [ ] **Lists:** Quick view of "My Active Tickets".

### 3.2 Ticket Queue (`/agent/tickets`)
- [ ] **Tabs:**
    1.  **"My Tickets":** `GET /api/tickets?assigneeId=ME`
    2.  **"Unassigned":** `GET /api/tickets?assigneeId=null&departmentId=MY_DEPT`
    3.  **"All Department":** `GET /api/tickets?departmentId=MY_DEPT` (Read-only view)
- [ ] **Isolation:** Agent A (Tech Dept) MUST NOT see Agent B's (Billing Dept) unassigned tickets.

### 3.3 Agent Ticket Detail (`/agent/tickets/:id`)
- [ ] **Ownership Check:**
    - If ticket is unassigned -> Show "Claim Ticket" button.
    - If assigned to ME -> Show "Reply", "Internal Note", "Resolve".
    - If assigned to OTHER -> Read-only mode (or allow comment contribution).
- [ ] **Internal Notes:**
    - Toggle/Checkbox: "Internal Note".
    - Action: Sends message with `isInternal: true`.
    - View: Internal notes displayed with yellow background/badge.
- [ ] **Status Change:** Dropdown to change Status (Open -> Pending -> Resolved).
- [ ] **Priority Change:** Dropdown to change Priority.

---

# SECTION 4: MANAGER CONSOLE (`/manager/*`)

### 4.1 Manager Dashboard (`/manager/dashboard`)
- [ ] **Scope:** All data reflects ONLY the Manager's Department.
- [ ] **Stats:** "Dept Open Tickets", "Unassigned", "SLA Breaches", "Agent Workload".

### 4.2 Team Management (`/manager/team`)
- [ ] **List:** Shows Agents belonging to Manager's Department.
- [ ] **Add Member:**
    - Button "Add Agent".
    - Form: Name, Email, Password.
    - **CRITICAL:** Backend creates user with `role: AGENT` and `departmentId: MANAGER_DEPT_ID`.
- [ ] **View Profile:** Clicking Agent shows stats (Tickets Assigned/Resolved).

### 4.3 Department Reports (`/manager/reports`)
- [ ] **Data:** Charts/Graphs filtered by `departmentId`.
- [ ] **Metrics:** "Tickets by Priority", "Tickets by Status", "Agent Performance".

### 4.4 Ticket Oversight (`/manager/tickets`)
- [ ] **View:** See ALL tickets in Department.
- [ ] **Override:** Manager can Reassign any ticket in their department to any agent in their department.

---

# SECTION 5: ADMIN PANEL (`/admin/*`)

### 5.1 Admin Dashboard (`/admin/dashboard`)
- [ ] **Scope:** Global System View.
- [ ] **Stats:** Total Users, Total Departments, Total Tickets (All Statuses).

### 5.2 Department Management (`/admin/departments`)
- [ ] **List:** All Departments.
- [ ] **Create:** Button "New Department". Form: Name, Description.
- [ ] **Edit/Delete:** Actions on rows.

### 5.3 User Management (`/admin/users`)
- [ ] **List:** All Users (All Roles).
- [ ] **Filters:** Filter by Role, Department.
- [ ] **Actions:**
    - "Create User": Can create Admin, Manager, Agent (assign to dept), Customer.
    - "Edit": Change Role, Change Department.
    - "Deactivate": Soft delete/ban.

### 5.4 SLA Management (`/admin/sla`)
- [ ] **List:** SLA Policies.
- [ ] **Create:** Form: Priority (e.g., HIGH), Response Time (hrs), Resolution Time (hrs).
- [ ] **Logic:** Backend uses these policies to calculate `slaBreach` time on ticket creation.

### 5.5 Knowledge Base Admin (`/admin/kb`)
- [ ] **Categories:** Create/Edit Ticket Categories.
- [ ] **Articles:** Create/Edit Articles.
- [ ] **Visibility:** Toggle Public/Internal.

---

# SECTION 6: DATA & API INTEGRITY CHECKLIST

### 6.1 No Mock Data Policy
- [ ] Search project for `const data = [...]`. **REMOVE IT.**
- [ ] All lists (`.map`) must iterate over data fetched via `useEffect` -> `Service` -> `API`.

### 6.2 Button & Link Audit
- [ ] Every button must have an `onClick` or `type="submit"`.
- [ ] No button should be `disabled` unless logic requires it (e.g., loading).
- [ ] Every `Link` or `useNavigate` must point to a defined Route.

### 6.3 Loading & Error States
- [ ] API calls must set `loading=true` -> `loading=false`.
- [ ] UI must show `<Spinner />` or Skeleton when loading.
- [ ] API failures must show `toast.error(message)`.

### 6.4 Component Isolation
- [ ] Ensure `CustomerSidebar` is distinct from `AdminSidebar` (different links).
- [ ] Ensure `TicketDetail` logic branches correctly based on `user.role`.

---

# SECTION 7: SPECIFIC FIXES REQUIRED (FROM PREVIOUS AUDIT)

1.  **Fix Customer Create Ticket:** Ensure `CustomerNewTicketPage.jsx` submits correctly and redirects.
2.  **Fix Manager Add Agent:** Ensure `ManagerTeamPage.jsx` passes correct `departmentId` automatically.
3.  **Fix Manager View Profile:** Ensure clicking an agent opens their profile/stats modal.
4.  **Fix Admin Dashboard Load:** Ensure `AdminDashboardPage.jsx` waits for Auth before rendering to prevent blank screens.
5.  **Fix Reports:** Connect Report pages to `/api/reports/*` endpoints.

---

# EXECUTION ORDER

1.  **Audit:** Scan code against this doc. Identify gaps.
2.  **Backend Fixes:** Ensure API endpoints support the required filters (by ID, Dept, Role).
3.  **Frontend Wiring:** Connect all buttons/forms to these APIs.
4.  **Verification:** Manual click-through of every path defined above.