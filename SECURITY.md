# Security Policy

HelpDesk Pro takes security seriously. This document outlines the security measures implemented in the system.

## 🛡️ Implemented Security Measures

### 1. Rate Limiting
To prevent abuse and brute-force attacks, we implement strict rate limiting via `express-rate-limit`:
- **General API**: 100 requests per 15 minutes per IP.
- **Login/Registration**: 5 requests per 15 minutes per IP (Strict blocking).
- **File Uploads**: 20 uploads per hour.

### 2. Input Sanitization (XSS Prevention)
All user-generated content is sanitized to prevent Cross-Site Scripting (XSS) attacks.
- **Library**: `dompurify` + `jsdom`.
- **Scope**:
    - Ticket Titles & Descriptions
    - Comments & Messages
    - User Profile Data

### 3. Authentication & Authorization
- **JWT**: Stateless authentication using JSON Web Tokens (Access + Refresh flow).
- **RBAC**: Strict Role-Based Access Control middleware guarantees users can only access data permitted by their role (Customer, Agent, Manager, Admin).
- **Password Hashing**: Passwords are hashed using `bcryptjs` (Salt rounds: 10).

### 4. Audit Logging
Critical security events are logged as structured JSON for monitoring:
- `LOGIN_SUCCESS`: Tracks successful user entry.
- `LOGIN_FAILED`: Tracks failed attempts (IP, Email, Reason) for intrusion detection.

### 5. HTTP Security Headers
We use `helmet` to set secure HTTP headers, including:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- Strict Transport Security (HSTS) in production.

## 🐛 Reporting Vulnerabilities
If you find a security vulnerability, please do not open a public issue. Contact the repository owner directly.
