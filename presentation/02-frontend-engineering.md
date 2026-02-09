# Role: Frontend Engineering & UX

---

## 1. Role Responsibility

As the **Frontend Engineer and UX Lead**, this role is responsible for everything the user **sees and interacts with**. This includes:

1. **Building the User Interface**: All the screens, buttons, forms, and visual elements.
2. **Managing Application State**: Keeping track of what the user is doing (logged in? which ticket is selected?).
3. **Communicating with the Backend**: Sending requests to the API and displaying the responses.
4. **Role-Based User Experience**: Showing different dashboards and features based on who is logged in.
5. **User Feedback**: Loading spinners, success messages, error alerts.

> **Think of this role as the bridge between the user and the system.** The user never "talks" to the database directly—they talk to the React components.

---

## 2. Where This Role Fits in the Overall Architecture

The domain is the **Client Layer**—the leftmost part of the system:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│      FRONTEND DOMAIN                                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │           Vite + React 19 SPA (Port 5173)                             │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────────┐   │  │
│  │  │ React Router│  │ Zustand Store│  │ Axios with JWT Interceptor  │   │  │
│  │  │ (Role-based)│  │ (State Mgmt) │  │ (API Communication)         │   │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
33: └────────────────────────────────────────────┬────────────────────────────────┘
                                             │
                                             │ HTTP REST + JWT Bearer Token
                                             ▼
                                    ┌─────────────────┐
                                    │    BACKEND      │ (Backend + Security domain)
                                    │   /api/*        │
                                    └─────────────────┘
```

### This role owns:
- `client/` folder entirely
- All React components, pages, and layouts
- State management stores (Zustand)
- API service functions
- Routing and navigation logic

### Depends on:
- **Backend** for data (calling their APIs)
- **Technical Lead** for API contract and CORS configuration

### Others depend on this role for:
- A usable interface that correctly represents the system's features
- Proper display of data returned by the backend

---

## 3. Detailed Explanation of What Was Built

### 3.1 Application Entry Point

When a user opens the app, here's exactly what happens:

```
User opens http://localhost:5173/
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ main.jsx                                                                    │
│ - Loads App.jsx                                                             │
│ - Wraps everything in BrowserRouter                                         │
└────────────────────────────────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ App.jsx                                                                     │
│ - Calls authStore.initialize() on first load                                │
│ - This checks: Is there a token in localStorage?                            │
│ - If yes: Verify it with backend (GET /api/auth/me)                         │
│ - If valid: Set user in state, isAuthenticated = true                       │
│ - If no/invalid: Clear state, redirect to login                             │
└────────────────────────────────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ routes/index.jsx                                                            │
│ - Checks isAuthenticated and user.role                                      │
│ - Renders the appropriate layout (CustomerLayout, AgentLayout, etc.)        │
│ - Redirects unauthorized users to their correct dashboard                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why this flow matters**:
- Users don't lose their session on page refresh (token persists in localStorage).
- Role-based routing happens automatically (a Customer can't manually type `/admin/dashboard` and get in).

---

### 3.2 Folder Structure Explained

```
client/src/
├── components/              # Reusable UI pieces
│   ├── common/              # Button, Spinner, Modal, Toast, etc.
│   ├── layout/              # Sidebar, Header, ProtectedRoute
│   └── tickets/             # Ticket-specific: TicketCard, TicketStatusBadge
│
├── pages/                   # Full-page views (one per route)
│   ├── auth/                # LoginPage, RegisterPage
│   ├── customer/            # CustomerDashboard, CustomerTickets, etc.
│   ├── agent/               # AgentDashboard, AgentTicketQueue, etc.
│   ├── manager/             # ManagerDashboard, ManagerReports, etc.
│   └── admin/               # AdminDashboard, AdminUsers, AdminSettings
│
├── store/                   # Zustand state stores
│   ├── authStore.js         # User session, login/logout
│   ├── ticketStore.js       # Ticket list, current ticket
│   ├── notificationStore.js # Toast messages, alerts
│   └── uiStore.js           # Sidebar open/closed, theme
│
├── services/                # API communication layer
│   ├── api.js               # Axios instance with interceptors
│   ├── authService.js       # login(), register(), logout()
│   ├── ticketService.js     # getTickets(), createTicket(), etc.
│   └── userService.js       # getUsers(), updateUser(), etc.
│
├── routes/                  # React Router configuration
│   └── index.jsx            # All route definitions + ProtectedRoute
│
├── utils/                   # Helper functions
│   ├── constants.js         # API_URL, role names, status colors
│   ├── helpers.js           # Date formatting, string truncation
│   └── permissions.js       # canViewTicket(), canEditTicket()
│
└── App.jsx                  # Root component
```

---

### 3.3 Key Concept: Zustand State Management

**What is state?**
State is "data that can change and affects what the user sees."

Examples:
- Is the user logged in? → `isAuthenticated`
- What tickets are loaded? → `tickets[]`
- Is the sidebar open? → `sidebarOpen`

**Why Zustand?**
- Simpler than Redux (no actions, reducers, dispatchers)
- React-friendly (hooks-based)
- Minimal boilerplate

**How authStore works (simplified):**

```javascript
// store/authStore.js

import { create } from 'zustand';
import authService from '../services/authService';

const useAuthStore = create((set, get) => ({
  // STATE
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  // ACTIONS
  login: async (email, password) => {
    set({ isLoading: true });
    const data = await authService.login(email, password);
    
    // Store token in localStorage
    localStorage.setItem('accessToken', data.token);
    
    // Update state
    set({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true
    });
  },

  logout: async () => {
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false });
  },

  initialize: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false, isInitialized: true });
      return;
    }
    // Verify token with backend
    const data = await authService.getProfile();
    set({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true
    });
  }
}));
```

**Using it in a component:**

```jsx
// In any component
import { useAuthStore } from '@/store/authStore';

function Header() {
  const { user, logout } = useAuthStore();
  
  return (
    <div>
      Welcome, {user.firstName}!
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

### 3.4 Key Concept: Service Layer (API Calls)

**Why a service layer?**
Instead of putting `axios.get(...)` calls inside components:
- We centralize all API calls in one place
- Components stay clean (just UI logic)
- Easy to update if API changes

**How api.js works:**

```javascript
// services/api.js

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' }
});

// INTERCEPTOR: Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// INTERCEPTOR: Handle 401 (unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try refresh or logout
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Example service file:**

```javascript
// services/ticketService.js

import api from './api';

export const getTickets = async (filters = {}) => {
  const response = await api.get('/tickets', { params: filters });
  return response.data;
};

export const createTicket = async (ticketData) => {
  const response = await api.post('/tickets', ticketData);
  return response.data;
};

export const getTicketById = async (id) => {
  const response = await api.get(`/tickets/${id}`);
  return response.data;
};
```

---

### 3.5 Key Concept: Role-Based Routing

**The problem**: Not all users should see all pages.
- CUSTOMER should only see their tickets
- AGENT should see their queue
- ADMIN should see everything

**The solution**: ProtectedRoute component

```jsx
// components/layout/ProtectedRoute.jsx

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, isInitialized } = useAuthStore();

  // Still loading? Show spinner
  if (!isInitialized) {
    return <Spinner />;
  }

  // Not logged in? Go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Logged in but wrong role? Go to their dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultDashboard(user.role)} />;
  }

  // All good, show the page
  return children;
};
```

**Usage in routes:**

```jsx
// routes/index.jsx

<Route
  path="/admin"
  element={
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AdminLayout />
    </ProtectedRoute>
  }
>
  <Route path="dashboard" element={<AdminDashboardPage />} />
  <Route path="users" element={<AdminUsersPage />} />
</Route>
```

---

### 3.6 The Four User Dashboards

Each role sees a different dashboard:

| Role | Dashboard | Key Features |
|------|-----------|--------------|
| **CUSTOMER** | `/customer/dashboard` | Create ticket, view my tickets, browse knowledge base |
| **AGENT** | `/agent/dashboard` | Ticket queue, assigned tickets, quick metrics |
| **MANAGER** | `/manager/dashboard` | Team overview, department tickets, basic reports |
| **ADMIN** | `/admin/dashboard` | System stats, user management, all configuration |

---

## 4. Interaction With Other Parts

### 4.1 Connection to Backend

This role **consumes** the APIs that the **Backend Engineer** builds.

| Needs | Backend Provides |
|----------|----------------|
| List of tickets | `GET /api/tickets` |
| Create a ticket | `POST /api/tickets` |
| Update ticket status | `PATCH /api/tickets/:id` |
| User profile | `GET /api/auth/me` |

**If an API changes shape**, the Backend Engineer communicates this, and the service files are updated.

---

### 4.2 Connection to Security

This role **implements client-side security measures**:
- Store JWT token securely (localStorage)
- Add token to every API request via interceptor
- Redirect unauthorized users
- Never store sensitive data in URL or logs

**But remember**: The backend is the **real** security gate. This role is UX-level protection.

---

### 4.3 Connection to Reports

This role **displays** the data that the **Reports Engineer** provides:
- Charts showing ticket volume
- SLA compliance percentages
- Agent performance metrics

Uses **Recharts** library to render these visualizations.

---

## 5. Why These Decisions Were Made

### 5.1 React 19 (Not Vue or Angular)

**Decision**: Use React.

**Why**:
- Most widely used UI library in the industry
- Large ecosystem of components and tools
- Team has prior React experience

**Tradeoff**:
- React requires more setup than Vue
- No built-in state management (hence Zustand)

---

### 5.2 Zustand (Not Redux)

**Decision**: Use Zustand for state management.

**Why**:
- Simpler API—no actions, reducers, or dispatch
- Less boilerplate code
- Works well for medium-sized apps

**Tradeoff**:
- Less community adoption than Redux
- Fewer middleware options (but we don't need them)

---

### 5.3 Vite (Not Create React App)

**Decision**: Use Vite as the build tool.

**Why**:
- Much faster development server (instant hot reload)
- Modern ES modules support
- Better build times

**Tradeoff**:
- Slightly different plugin ecosystem
- Some older React tutorials assume CRA

---

### 5.4 TailwindCSS (Not Bootstrap or Material UI)

**Decision**: Use Tailwind for styling.

**Why**:
- Utility-first approach = no CSS file organization needed
- Extremely customizable
- Smaller final bundle (only used classes are included)

**Tradeoff**:
- HTML can look "cluttered" with many classes
- Learning curve for those used to component libraries

---

## 6. Common Questions & Safe Answers

### Q1: "How does the frontend know which user is logged in?"

**Safe Answer**:
> "When a user logs in, the backend returns a JWT token. We store this token in localStorage. On every subsequent API request, we automatically attach this token in the Authorization header using an Axios interceptor. The token contains the user's ID and role, which we use to customize their experience."

---

### Q2: "How do you handle unauthorized access?"

**Safe Answer**:
> "We have a ProtectedRoute component that wraps all private routes. Before rendering a page, it checks three things: (1) Has the auth state initialized? (2) Is the user authenticated? (3) Is their role in the allowed list? If any check fails, they're redirected appropriately—either to login or to their own dashboard."

---

### Q3: "What happens if the token expires?"

**Safe Answer**:
> "We have a response interceptor on Axios that catches 401 Unauthorized responses. When this happens, we first try to refresh the token using the refresh token. If that fails, we clear the stored tokens and redirect the user to the login page."

---

### Q4: "Why didn't you use Redux?"

**Safe Answer**:
> "Zustand provides a simpler API with less boilerplate while meeting all our state management needs. For an application of this size, Redux's additional complexity wasn't necessary. Zustand gave us centralized state with a cleaner developer experience."

---

### Q5: "How is the UI responsive to different roles?"

**Safe Answer**:
> "Each role has its own layout component (CustomerLayout, AgentLayout, etc.) with a tailored sidebar navigation. The routes are wrapped in ProtectedRoute components that specify which roles can access them. Additionally, we have permission utility functions like canEditTicket() that control what actions a user sees on each page."

---

## 7. Rebuild Process (Step-by-Step)

### Step 1: Create Project with Vite

```bash
npm create vite@latest client -- --template react
cd client
npm install
```

### Step 2: Install Dependencies

```bash
npm install axios zustand react-router-dom tailwindcss postcss autoprefixer
npm install lucide-react react-hot-toast date-fns
npm install @tiptap/react @tiptap/starter-kit  # For rich text editor
npm install recharts  # For charts
```

### Step 3: Set Up Tailwind

```bash
npx tailwindcss init -p
```

Configure `tailwind.config.js` and add Tailwind directives to `index.css`.

### Step 4: Create Folder Structure

```bash
mkdir -p src/{components/{common,layout,tickets},pages/{auth,customer,agent,manager,admin},store,services,utils,routes}
```

### Step 5: Build the Foundation

1. **Create api.js** with Axios instance and interceptors
2. **Create authStore.js** with user state and login/logout actions
3. **Create authService.js** with login/register API calls

### Step 6: Build Authentication Flow

1. **LoginPage**: Form that calls `authStore.login()`
2. **ProtectedRoute**: Component that checks authentication
3. **routes/index.jsx**: Define all routes with protection

### Step 7: Build Customer Features First

Customer is the simplest role. Build these in order:
1. CustomerDashboardPage
2. CustomerTicketsPage
3. CustomerNewTicketPage
4. CustomerTicketDetailPage

### Step 8: Expand to Other Roles

Once Customer works:
1. Copy CustomerLayout → AgentLayout, ManagerLayout, AdminLayout
2. Modify sidebar navigation for each role
3. Build role-specific pages

### Step 9: Add Polish

1. Loading states (Spinner component)
2. Error states (Toast notifications)
3. Empty states ("No tickets found" messages)
4. Form validation (using react-hook-form)

---

## Final Notes for Presentation

### Demonstrable Features:

1. **Login flow**: Show entering credentials, seeing the dashboard
2. **Role switching**: Login as Customer, show dashboard. Logout, login as Admin, show different dashboard
3. **Create a ticket**: Fill the form, submit, see it appear in the list
4. **Responsive routing**: Try to access `/admin/users` as a Customer—get redirected

### Opening statement:

> "I was responsible for the frontend of HelpDesk Pro, built with React 19 and Vite. The application features role-based routing where each user type—Customer, Agent, Manager, and Admin—sees a tailored interface. I used Zustand for state management and Axios for API communication, with interceptors handling authentication automatically."

### Closing statement:

> "The frontend successfully provides four distinct user experiences from a single codebase. Key design decisions like the service layer pattern and role-based ProtectedRoute component made the code maintainable and the user flows secure."

---

**Remember: This role is the user's advocate. If the UI is confusing, it's this role's problem to solve.**
