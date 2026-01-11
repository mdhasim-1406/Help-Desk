# HelpDesk Pro - API Documentation

Complete REST API reference for HelpDesk Pro backend.

**Base URL:** `http://localhost:4000/api`

**Production URL:** `https://api.yourdomain.com/api`

## 📝 General Information

### Authentication

Most endpoints require authentication via JWT token.

**Header:**
```
Authorization: Bearer <access_token>
```

**Alternative:** Tokens can also be sent via httpOnly cookies (if configured).

### Response Format

All responses follow this structure:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": []  // Optional validation errors
}
```

### Pagination

List endpoints support pagination via query parameters:

```
GET /api/tickets?page=1&limit=20
```

**Response includes:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## 🔐 Authentication

### Login

**POST** `/auth/login`

Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "admin@helpdesk.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@helpdesk.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "SUPER_ADMIN",
    "avatar": null
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `401 INVALID_CREDENTIALS` - Wrong email/password
- `403 ACCOUNT_INACTIVE` - User account is deactivated

---

### Register

**POST** `/auth/register`

Register a new user (defaults to CUSTOMER role).

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "roleName": "CUSTOMER"  // Optional: CUSTOMER, AGENT, MANAGER, ADMIN
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }
}
```

**Errors:**
- `400 EMAIL_EXISTS` - Email already registered
- `400 VALIDATION_ERROR` - Invalid input

---

### Logout

**POST** `/auth/logout`

Clear authentication tokens.

**Headers:** None required

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Get Current User

**GET** `/auth/me`

Get authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@helpdesk.com",
    "firstName": "Admin",
    "lastName": "User",
    "phone": null,
    "avatar": null,
    "isActive": true,
    "role": "SUPER_ADMIN",
    "roleId": "uuid",
    "roleDisplayName": "Super Administrator",
    "departmentId": null,
    "departmentName": null,
    "permissions": ["*"]
  }
}
```

---

## 🎫 Tickets

### List Tickets

**GET** `/tickets`

Get paginated list of tickets (filtered by user role).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `status` (string) - Filter by status name
- `priority` (string) - Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `assignedToId` (uuid) - Filter by assigned user

**Role-based filtering:**
- **CUSTOMER**: Only own tickets
- **AGENT**: Assigned tickets + unassigned in department
- **MANAGER**: All tickets in department
- **ADMIN/SUPER_ADMIN**: All tickets

**Response:**
```json
{
  "success": true,
  "message": "Tickets retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "ticketNumber": "TKT-123456",
      "title": "Cannot login to account",
      "status": {
        "name": "OPEN",
        "displayName": "Open",
        "color": "#3B82F6"
      },
      "priority": "HIGH",
      "createdAt": "2026-01-11T10:00:00.000Z",
      "updatedAt": "2026-01-11T10:00:00.000Z",
      "customer": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "assignedTo": null,
      "_count": {
        "comments": 2,
        "attachments": 1
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### Get Ticket

**GET** `/tickets/:id`

Get detailed ticket information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Ticket retrieved successfully",
  "data": {
    "id": "uuid",
    "ticketNumber": "TKT-123456",
    "title": "Cannot login to account",
    "description": "<p>Detailed description...</p>",
    "priority": "HIGH",
    "source": "WEB",
    "statusId": "uuid",
    "slaPolicyId": "uuid",
    "customerId": "uuid",
    "assignedToId": null,
    "departmentId": "uuid",
    "responseDueAt": "2026-01-11T12:00:00.000Z",
    "resolutionDueAt": "2026-01-11T18:00:00.000Z",
    "firstResponseAt": null,
    "resolvedAt": null,
    "responseBreached": false,
    "resolutionBreached": false,
    "tags": ["login", "urgent"],
    "createdAt": "2026-01-11T10:00:00.000Z",
    "updatedAt": "2026-01-11T10:00:00.000Z",
    "customer": { ... },
    "assignedTo": null,
    "status": { ... },
    "department": { ... },
    "comments": [ ... ],
    "attachments": [ ... ]
  }
}
```

**Errors:**
- `404 NOT_FOUND` - Ticket doesn't exist
- `403 FORBIDDEN` - No permission to view ticket

---

### Create Ticket

**POST** `/tickets`

Create a new ticket.

**Headers:** `Authorization: Bearer <token>`

**Permission:** `tickets:create`

**Request Body:**
```json
{
  "title": "Cannot login to account",
  "description": "<p>I am unable to login...</p>",
  "priority": "HIGH",  // Optional: LOW, MEDIUM, HIGH, URGENT
  "status": "OPEN",    // Optional: status name
  "departmentId": "uuid",  // Optional
  "assignedToId": "uuid"   // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "data": {
    "id": "uuid",
    "ticketNumber": "TKT-123456",
    "title": "Cannot login to account",
    "description": "<p>I am unable to login...</p>",
    "priority": "HIGH",
    "statusId": "uuid",
    "customerId": "uuid",
    "assignedToId": null,
    "createdAt": "2026-01-11T10:00:00.000Z",
    "customer": { ... },
    "assignedTo": null,
    "status": { ... }
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` - Invalid input
- `404 DEPARTMENT_NOT_FOUND` - Department doesn't exist
- `404 USER_NOT_FOUND` - Assigned user doesn't exist

---

### Update Ticket

**PATCH** `/tickets/:id`

Update ticket details.

**Headers:** `Authorization: Bearer <token>`

**Permission:** `tickets:write`

**Request Body:** (all fields optional)
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "URGENT",
  "status": "IN_PROGRESS",
  "departmentId": "uuid",
  "assignedToId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket updated successfully",
  "data": { ... }
}
```

**Errors:**
- `404 NOT_FOUND` - Ticket doesn't exist
- `403 FORBIDDEN` - No permission to update
- `400 INVALID_STATUS` - Invalid status name

---

### Delete Ticket

**DELETE** `/tickets/:id`

Delete a ticket (admin only).

**Headers:** `Authorization: Bearer <token>`

**Permission:** `tickets:delete`

**Response:**
```json
{
  "success": true,
  "message": "Ticket deleted successfully"
}
```

---

### Add Comment

**POST** `/tickets/:id/comments`

Add a comment to a ticket.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "This is a comment",
  "isInternal": false  // Optional: true for internal notes
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "id": "uuid",
    "ticketId": "uuid",
    "userId": "uuid",
    "content": "This is a comment",
    "isInternal": false,
    "createdAt": "2026-01-11T10:30:00.000Z",
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "avatar": null
    }
  }
}
```

---

### Get Ticket Messages

**GET** `/tickets/:id/messages`

Get all comments for a ticket.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "ticketId": "uuid",
      "userId": "uuid",
      "content": "Comment text",
      "isInternal": false,
      "createdAt": "2026-01-11T10:30:00.000Z",
      "user": { ... }
    }
  ]
}
```

---

## 👥 Users

### List Users

**GET** `/users`

Get paginated list of users.

**Headers:** `Authorization: Bearer <token>`

**Permission:** `users:read` or higher

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `role` (string) - Filter by role name
- `departmentId` (uuid) - Filter by department
- `isActive` (boolean) - Filter by active status

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": { ... }
}
```

---

### Get User

**GET** `/users/:id`

Get user details.

**Headers:** `Authorization: Bearer <token>`

**Permission:** `users:read`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": null,
    "avatar": null,
    "roleId": "uuid",
    "departmentId": "uuid",
    "isActive": true,
    "lastLogin": "2026-01-11T09:00:00.000Z",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "role": { ... },
    "department": { ... }
  }
}
```

---

### Create User

**POST** `/users`

Create a new user (admin only).

**Headers:** `Authorization: Bearer <token>`

**Permission:** `users:create`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "roleId": "uuid",
  "departmentId": "uuid"
}
```

---

### Update User

**PATCH** `/users/:id`

Update user details.

**Headers:** `Authorization: Bearer <token>`

**Permission:** `users:update`

**Request Body:** (all optional)
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "roleId": "uuid",
  "departmentId": "uuid",
  "isActive": true
}
```

---

### Delete User

**DELETE** `/users/:id`

Delete a user.

**Headers:** `Authorization: Bearer <token>`

**Permission:** `users:delete`

---

## 🏢 Departments

### List Departments

**GET** `/departments`

Get all departments.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Technical Support",
      "description": "Handles technical issues",
      "managerId": "uuid",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "manager": { ... },
      "_count": {
        "members": 5,
        "tickets": 23
      }
    }
  ]
}
```

---

### Create Department

**POST** `/departments`

Create a new department.

**Headers:** `Authorization: Bearer <token>`

**Permission:** `departments:create`

**Request Body:**
```json
{
  "name": "Billing",
  "description": "Handles billing inquiries",
  "managerId": "uuid"  // Optional
}
```

---

### Update Department

**PATCH** `/departments/:id`

Update department details.

**Headers:** `Authorization: Bearer <token>`

**Permission:** `departments:update`

---

### Delete Department

**DELETE** `/departments/:id`

Delete a department.

**Headers:** `Authorization: Bearer <token>`

**Permission:** `departments:delete`

---

## 📊 Reports

### Get Overview

**GET** `/reports/overview`

Get system overview statistics.

**Headers:** `Authorization: Bearer <token>`

**Permission:** `reports:read`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTickets": 150,
    "openTickets": 45,
    "resolvedTickets": 95,
    "totalUsers": 25,
    "activeAgents": 8,
    "avgResolutionTime": 4.5,
    "slaCompliance": 92.5
  }
}
```

---

## 📚 Knowledge Base

### List Categories

**GET** `/kb/categories`

Get all KB categories.

**Headers:** `Authorization: Bearer <token>` (optional for public)

---

### List Articles

**GET** `/kb/articles`

Get all KB articles.

**Query Parameters:**
- `categoryId` (uuid) - Filter by category
- `isPublished` (boolean) - Filter by published status
- `search` (string) - Search in title/content

---

### Get Article

**GET** `/kb/articles/:id`

Get article details.

---

### Create Article

**POST** `/kb/articles`

Create a new KB article (admin/manager).

**Permission:** `kb:create`

---

## 🔔 Notifications

### List Notifications

**GET** `/notifications`

Get user's notifications.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `isRead` (boolean) - Filter by read status
- `limit` (number)

---

### Mark as Read

**PATCH** `/notifications/:id/read`

Mark notification as read.

**Headers:** `Authorization: Bearer <token>`

---

### Mark All as Read

**POST** `/notifications/mark-all-read`

Mark all notifications as read.

**Headers:** `Authorization: Bearer <token>`

---

## 📎 Attachments

### Upload Files

**POST** `/attachments`

Upload files for a ticket or comment.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `files` - File(s) to upload (max 5 files, 10MB each)
- `ticketId` (uuid) - Optional
- `commentId` (uuid) - Optional

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fileName": "abc123.pdf",
      "originalName": "document.pdf",
      "filePath": "/uploads/abc123.pdf",
      "mimeType": "application/pdf",
      "fileSize": 1024000,
      "uploadedBy": "uuid",
      "createdAt": "2026-01-11T10:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `413 FILE_TOO_LARGE` - File exceeds 10MB
- `413 TOO_MANY_FILES` - More than 5 files
- `400 INVALID_FILE_TYPE` - File type not allowed

---

## 🔧 SLA Policies

### List SLA Policies

**GET** `/sla`

Get all SLA policies.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "High Priority SLA",
      "priority": "HIGH",
      "responseTime": 120,  // minutes
      "resolutionTime": 480,
      "warningThreshold": 75,
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## ❌ Error Codes Reference

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `NO_TOKEN` | 401 | No authentication token |
| `INVALID_TOKEN` | 401 | Invalid/expired token |
| `ACCOUNT_INACTIVE` | 403 | User account deactivated |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `DEPARTMENT_NOT_FOUND` | 404 | Department doesn't exist |
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `DUPLICATE_ENTRY` | 409 | Unique constraint violation |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |
| `TOO_MANY_FILES` | 413 | Too many files uploaded |
| `INVALID_FILE_TYPE` | 400 | File type not allowed |
| `INTERNAL_ERROR` | 500 | Server error |

---

**Last Updated:** January 11, 2026  
**API Version:** 1.0
