# Integration Roadmap - Next Steps

## 🎯 Immediate Next Steps (Priority Order)

---

## 1️⃣ Toast Notifications Integration (HIGHEST PRIORITY)
**Time Estimate**: 1-2 hours  
**Difficulty**: Easy  
**Impact**: User feedback on all operations

### Step 1: Add Toast Provider to App.jsx
```javascript
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <AppRoutes />
    </Router>
  );
}
```

### Step 2: Add Toast Calls to Stores
**Location**: `src/store/ticketStore.js`

```javascript
import toast from 'react-hot-toast';

const fetchTickets = async (filters) => {
  try {
    set({ isLoading: true });
    // API call here
    toast.success('Tickets loaded!');
    return tickets;
  } catch (error) {
    toast.error(error.message || 'Failed to load tickets');
    set({ error: error.message });
  } finally {
    set({ isLoading: false });
  }
};

const createTicket = async (data) => {
  try {
    set({ isLoading: true });
    // API call here
    toast.success('✅ Ticket created successfully!');
    return newTicket;
  } catch (error) {
    toast.error('❌ Failed to create ticket');
  }
};

const addMessage = async (ticketId, message) => {
  try {
    toast.promise(
      addMessageAPI(ticketId, message),
      {
        loading: 'Sending message...',
        success: 'Message sent! ✅',
        error: 'Failed to send message'
      }
    );
  } catch (error) {
    // Fallback
  }
};
```

### Step 3: Add Toast Calls to Forms (Optional)
**Locations**: Login, Register, NewTicket, ProfileEdit, etc.

```javascript
const handleSubmit = async (data) => {
  try {
    await store.method(data);
    toast.success('✅ Success!');
  } catch (error) {
    toast.error('❌ ' + error.message);
  }
};
```

---

## 2️⃣ API Integration (SECOND PRIORITY)
**Time Estimate**: 4-6 hours  
**Difficulty**: Medium  
**Impact**: Real data connectivity

### Backend API Endpoints Needed

**Tickets**:
```
GET    /api/tickets              - List tickets (with filters)
GET    /api/tickets/:id          - Get single ticket
POST   /api/tickets              - Create ticket
PUT    /api/tickets/:id          - Update ticket
DELETE /api/tickets/:id          - Delete ticket
POST   /api/tickets/:id/messages - Add message/note
GET    /api/tickets/:id/messages - Get messages
PUT    /api/tickets/:id/status   - Update status
PUT    /api/tickets/:id/priority - Update priority
```

**Users** (Admin):
```
GET    /api/admin/users          - List users
POST   /api/admin/users          - Create user
PUT    /api/admin/users/:id      - Update user
DELETE /api/admin/users/:id      - Delete user
```

**Settings** (Admin):
```
GET    /api/admin/settings       - Get current settings
PUT    /api/admin/settings       - Update settings
```

**Authentication**:
```
POST   /api/auth/login           - User login
POST   /api/auth/register        - User registration
POST   /api/auth/logout          - User logout
POST   /api/auth/refresh         - Refresh token
```

### Step 1: Create API Service Layer
**File**: `src/services/api.js`

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const ticketAPI = {
  list: (filters) => api.get('/tickets', { params: filters }),
  get: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
  getMessages: (id) => api.get(`/tickets/${id}/messages`),
  addMessage: (id, data) => api.post(`/tickets/${id}/messages`, data),
  updateStatus: (id, status) => api.put(`/tickets/${id}/status`, { status }),
  updatePriority: (id, priority) => api.put(`/tickets/${id}/priority`, { priority }),
};

export const userAPI = {
  list: (filters) => api.get('/admin/users', { params: filters }),
  create: (data) => api.post('/admin/users', data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  delete: (id) => api.delete(`/admin/users/${id}`),
};

export const settingsAPI = {
  get: () => api.get('/admin/settings'),
  update: (data) => api.put('/admin/settings', data),
};

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
};

export default api;
```

### Step 2: Update Stores to Use API
**Location**: `src/store/ticketStore.js`

```javascript
import { ticketAPI } from '@/services/api';

// BEFORE:
const fetchTickets = async (filters) => {
  set({ isLoading: true });
  // Mock data...
};

// AFTER:
const fetchTickets = async (filters) => {
  try {
    set({ isLoading: true, error: null });
    const response = await ticketAPI.list(filters);
    set({ 
      tickets: response.data.tickets,
      pagination: response.data.pagination
    });
    return response.data.tickets;
  } catch (error) {
    set({ error: error.response?.data?.message || error.message });
    throw error;
  } finally {
    set({ isLoading: false });
  }
};

// Similar updates for other methods...
const fetchTicketById = async (id) => {
  try {
    set({ isLoading: true });
    const response = await ticketAPI.get(id);
    set({ ticket: response.data });
    return response.data;
  } catch (error) {
    set({ error: error.message });
    throw error;
  } finally {
    set({ isLoading: false });
  }
};
```

### Step 3: Update Auth Store
**Location**: `src/store/authStore.js`

```javascript
import { authAPI } from '@/services/api';

const login = async (email, password) => {
  try {
    const response = await authAPI.login(email, password);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    set({ 
      user,
      isAuthenticated: true,
      token
    });
    
    return user;
  } catch (error) {
    set({ error: error.response?.data?.message });
    throw error;
  }
};

const logout = async () => {
  try {
    await authAPI.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('token');
    set({
      user: null,
      isAuthenticated: false,
      token: null
    });
  }
};

const initialize = async () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      // Validate token with backend
      const response = await api.get('/auth/me');
      set({
        user: response.data,
        isAuthenticated: true,
        token
      });
    } catch (error) {
      localStorage.removeItem('token');
      set({ isAuthenticated: false });
    }
  }
};
```

---

## 3️⃣ Form Validation (THIRD PRIORITY)
**Time Estimate**: 2-3 hours  
**Difficulty**: Easy-Medium  
**Impact**: Better UX and data validation

### Step 1: Install Dependencies
```bash
npm install react-hook-form zod @hookform/resolvers
```

### Step 2: Create Validation Schemas
**File**: `src/utils/validations.js`

```javascript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be 6+ characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be 6+ characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const newTicketSchema = z.object({
  subject: z.string().min(5, 'Subject is required'),
  description: z.string().min(10, 'Description required'),
  category: z.string().min(1, 'Category required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

export const userSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'manager', 'agent', 'customer']),
});
```

### Step 3: Update Form Components
**Example**: `src/pages/auth/LoginPage.jsx`

```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/utils/validations';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors }, isSubmitting } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('email')}
          type="email"
          placeholder="Email"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <span className="text-red-500">{errors.email.message}</span>}
      </div>
      
      <div>
        <input
          {...register('password')}
          type="password"
          placeholder="Password"
        />
        {errors.password && <span className="text-red-500">{errors.password.message}</span>}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
```

---

## 4️⃣ Error Handling Enhancement (FOURTH PRIORITY)
**Time Estimate**: 2 hours  
**Difficulty**: Easy  
**Impact**: Better error messages

### Create Error Boundary Component
**File**: `src/components/common/ErrorBoundary.jsx`

```javascript
import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from './Button';

export default function ErrorBoundary({ children }) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-slate-600 mb-6">We're working to fix it!</p>
          <Button onClick={() => setHasError(false)}>Try Again</Button>
        </div>
      </div>
    );
  }

  return children;
}
```

### Use in App.jsx
```javascript
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Toaster />
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  );
}
```

---

## 5️⃣ Unit Tests (FIFTH PRIORITY)
**Time Estimate**: 3-5 hours  
**Difficulty**: Medium  
**Impact**: Code reliability

### Setup Testing
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Example Store Test
**File**: `src/__tests__/store/ticketStore.test.js`

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTicketStore } from '@/store/ticketStore';

describe('ticketStore', () => {
  beforeEach(() => {
    const { reset } = useTicketStore.getState();
    reset?.();
  });

  it('should fetch tickets', async () => {
    const { fetchTickets } = useTicketStore.getState();
    const tickets = await fetchTickets({ page: 1 });
    expect(tickets).toBeDefined();
    expect(Array.isArray(tickets)).toBe(true);
  });

  it('should handle fetch error', async () => {
    const { fetchTickets, error } = useTicketStore.getState();
    // Mock API error
    await expect(fetchTickets({})).rejects.toThrow();
  });
});
```

---

## 📋 Integration Checklist

- [ ] Toast Notifications Integrated
  - [ ] Toaster component in App.jsx
  - [ ] Toast calls in all async operations
  - [ ] Success messages for create/update/delete
  - [ ] Error messages for failed operations

- [ ] API Integration Complete
  - [ ] API service layer created
  - [ ] TicketStore updated
  - [ ] AuthStore updated
  - [ ] All endpoints connected
  - [ ] Token handling implemented
  - [ ] Error interceptors configured

- [ ] Form Validation Added
  - [ ] Zod schemas created
  - [ ] All forms using react-hook-form
  - [ ] Validation feedback displayed
  - [ ] Error states handled

- [ ] Error Handling Enhanced
  - [ ] Error boundary component added
  - [ ] Try-catch blocks in stores
  - [ ] User-friendly error messages
  - [ ] 404 and 5xx error pages

- [ ] Tests Written
  - [ ] Store unit tests
  - [ ] Component tests
  - [ ] Integration tests
  - [ ] E2E tests

---

## 🎯 Estimated Timeline

| Task | Duration | Cumulative |
|------|----------|-----------|
| Toast Notifications | 1-2 hrs | 1-2 hrs |
| API Integration | 4-6 hrs | 5-8 hrs |
| Form Validation | 2-3 hrs | 7-11 hrs |
| Error Handling | 2 hrs | 9-13 hrs |
| Unit Tests | 3-5 hrs | 12-18 hrs |
| **Total** | | **~2-3 days** |

---

## 🚀 Quick Start for Next Developer

1. Run: `npm install` (if needed)
2. Run: `npm run dev`
3. Start with Task #1 (Toast Notifications)
4. Test each change on http://localhost:5173/
5. Keep the dev server running
6. Use git to track changes

**Happy coding!** 🎉
