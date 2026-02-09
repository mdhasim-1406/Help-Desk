# Role: Database Engineering & Schema Design

---

## 1. Role Responsibility

As the **Database Engineer**, this role is responsible for the **data layer**—how information is structured, stored, and retrieved. This includes:

1. **Designing the Schema**: What tables exist? What fields do they have? How do they relate?
2. **Managing Migrations**: How does the database structure change over time?
3. **Ensuring Data Integrity**: Foreign keys, unique constraints, cascading deletes.
4. **Seeding Test Data**: Creating realistic data for development and demos.
5. **Optimizing Queries**: Indexes for frequently accessed data.

> **Think of this role as the architect of a library.** It designs the shelves (tables), labels the sections (fields), and ensures books are organized (relationships) so librarians (backend) can find what they need quickly.

---

## 2. Where This Role Fits in the Overall Architecture

The domain is the **Data Layer**—the foundation everything else is built on:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Frontend (Frontend Engineer)                                               │
│  - Displays data from database                                              │
│  - Submits forms that become database records                               │
└──────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Backend (Backend & Security Engineers)                                     │
│  - Reads and writes data using Prisma                                       │
│  - prisma.ticket.create(), prisma.user.findMany(), etc.                    │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ Prisma ORM translates to SQL
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│      DATABASE DOMAIN                                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ PostgreSQL Database                                                   │  │
│  │ ┌─────────┐ ┌────────┐ ┌─────────────┐ ┌───────────┐ ┌─────────────┐ │  │
│  │ │ users   │ │ roles  │ │ departments │ │ tickets   │ │ sla_policies│ │  │
│  │ └─────────┘ └────────┘ └─────────────┘ └───────────┘ └─────────────┘ │  │
│  │ ┌───────────────┐ ┌─────────────────┐ ┌───────────────┐              │  │
│  │ │ticket_comments│ │ ticket_statuses │ │ notifications │              │  │
│  │ └───────────────┘ └─────────────────┘ └───────────────┘              │  │
│  │ ... and more tables                                                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### This role owns:
- `backend/prisma/schema.prisma` — The complete database structure
- `backend/prisma/migrations/` — Migration history
- `backend/prisma/seed.js` — Test data population

### Others depend on this role for:
- A stable, well-designed schema they can query
- Meaningful test data for development

---

## 3. Detailed Explanation of What Was Built

### 3.1 What is Prisma?

Prisma is an **ORM (Object-Relational Mapper)**. It allows us to:
- Define the database schema in a readable format (`schema.prisma`)
- Automatically generate SQL migrations
- Query the database using JavaScript instead of raw SQL

**Without Prisma:**
```sql
SELECT u.*, r.name as role_name 
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'admin@example.com';
```

**With Prisma:**
```javascript
const user = await prisma.user.findUnique({
  where: { email: 'admin@example.com' },
  include: { role: true }
});
```

---

### 3.2 The Complete Schema (14 Tables)

Here is every table in the system and its purpose:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `roles` | Defines user role types and permissions | name, displayName, permissions[] |
| `users` | All user accounts | email, passwordHash, roleId, departmentId |
| `departments` | Organizational units for ticket routing | name, description, managerId |
| `ticket_statuses` | Ticket lifecycle states | name, displayName, color, isDefault |
| `sla_policies` | Response/resolution time rules by priority | priority, responseTime, resolutionTime |
| `tickets` | Core business entity | title, description, priority, statusId, customerId |
| `ticket_comments` | Messages on tickets | ticketId, userId, content, isInternal |
| `ticket_history` | Audit log of ticket changes | ticketId, field, oldValue, newValue |
| `attachments` | Files attached to tickets | ticketId, fileName, filePath, mimeType |
| `notifications` | User alerts for events | userId, type, title, message, isRead |
| `kb_categories` | Knowledge base sections | name, slug, parentId |
| `kb_articles` | Help articles | title, content, categoryId, authorId, isPublic |

---

### 3.3 Entity Relationship Diagram

```
                                ┌──────────────────┐
                                │      roles       │
                                │ ─────────────────│
                                │ id (PK)          │
                                │ name (UNIQUE)    │
                                │ permissions[]    │
                                └────────┬─────────┘
                                         │ 1:N
                                         ▼
┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐
│   departments    │           │      users       │           │  ticket_statuses │
│ ─────────────────│           │ ─────────────────│           │ ─────────────────│
│ id (PK)          │◄──────────│ departmentId (FK)│           │ id (PK)          │
│ name (UNIQUE)    │           │ id (PK)          │           │ name (UNIQUE)    │
│ managerId (FK)───┼──────────►│ email (UNIQUE)   │           │ displayName      │
│                  │           │ roleId (FK)──────┼──────────►│ isDefault        │
└──────────────────┘           │ passwordHash     │           │ isResolved       │
                               └────────┬─────────┘           └────────┬─────────┘
                                        │                              │
                               ┌────────┴─────────┐                    │
                    (customer) │                  │ (assignee)         │
                               ▼                  ▼                    │
                         ┌──────────────────────────────────────────┐  │
                         │                tickets                    │◄─┘
                         │ ──────────────────────────────────────────│
                         │ id (PK)                                   │
                         │ ticketNumber (UNIQUE)                     │
                         │ title, description                        │
                         │ priority (ENUM)                           │
                         │ customerId (FK) ──────► users             │
                         │ assignedToId (FK) ────► users             │
                         │ departmentId (FK) ────► departments       │
                         │ statusId (FK) ────────► ticket_statuses   │
                         │ slaPolicyId (FK) ─────► sla_policies      │
                         │ responseBreached, resolutionBreached      │
                         └────────────────┬───────────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
         ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
         │  ticket_comments  │ │   attachments     │ │   ticket_history  │
         │ ──────────────────│ │ ──────────────────│ │ ──────────────────│
         │ ticketId (FK)     │ │ ticketId (FK)     │ │ ticketId (FK)     │
         │ userId (FK)       │ │ uploadedBy (FK)   │ │ userId (FK)       │
         │ content           │ │ fileName, filePath│ │ field, oldValue   │
         │ isInternal        │ │ mimeType          │ │ newValue          │
         └───────────────────┘ └───────────────────┘ └───────────────────┘
```

---

### 3.4 Key Schema Definitions

**The Ticket Model (Most Complex):**

```prisma
model Ticket {
  id                  String    @id @default(uuid())
  ticketNumber        String    @unique @map("ticket_number")
  title               String
  description         String
  priority            Priority  @default(MEDIUM)
  source              TicketSource @default(WEB)
  
  // Relationships
  status              TicketStatus @relation(fields: [statusId], references: [id])
  statusId            String    @map("status_id")
  
  customer            User      @relation("CustomerTickets", fields: [customerId], references: [id])
  customerId          String    @map("customer_id")
  
  assignedTo          User?     @relation("AssignedTickets", fields: [assignedToId], references: [id])
  assignedToId        String?   @map("assigned_to_id")
  
  department          Department? @relation(fields: [departmentId], references: [id])
  departmentId        String?   @map("department_id")
  
  slaPolicy           SLAPolicy? @relation(fields: [slaPolicyId], references: [id])
  slaPolicyId         String?   @map("sla_policy_id")
  
  // SLA Tracking
  responseDueAt       DateTime? @map("response_due_at")
  resolutionDueAt     DateTime? @map("resolution_due_at")
  firstResponseAt     DateTime? @map("first_response_at")
  resolvedAt          DateTime? @map("resolved_at")
  responseBreached    Boolean   @default(false) @map("response_breached")
  resolutionBreached  Boolean   @default(false) @map("resolution_breached")
  
  // Related records
  comments            TicketComment[]
  history             TicketHistory[]
  attachments         Attachment[]
  
  // Timestamps
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  
  @@map("tickets")
}
```

**Key Points:**
- `@id @default(uuid())` — Auto-generate unique ID
- `@unique` — No duplicates allowed
- `@map("snake_case")` — Database uses snake_case, Prisma uses camelCase
- `@relation` — Links to another table
- `?` after type — Field is optional (nullable)

---

### 3.5 Understanding Relationships

**One-to-Many (1:N):**
One Role has many Users:
```prisma
model Role {
  id    String @id @default(uuid())
  users User[]  // One role can have many users
}

model User {
  roleId String
  role   Role @relation(fields: [roleId], references: [id])  // Each user has one role
}
```

**Many-to-One (N:1):**
Many Tickets belong to one Customer:
```prisma
model User {
  tickets Ticket[] @relation("CustomerTickets")  // User can have many tickets
}

model Ticket {
  customerId String
  customer   User @relation("CustomerTickets", fields: [customerId], references: [id])
}
```

**Self-Referential (for hierarchical data):**
Department manager is also a User:
```prisma
model Department {
  managerId String?
  manager   User? @relation("DepartmentManager", fields: [managerId], references: [id])
}
```

---

### 3.6 Enums (Fixed Value Lists)

```prisma
enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketSource {
  WEB
  EMAIL
  PHONE
  CHAT
}

enum NotificationType {
  TICKET_CREATED
  TICKET_ASSIGNED
  TICKET_UPDATED
  COMMENT_ADDED
  SLA_WARNING
  SLA_BREACHED
}
```

---

### 3.7 Data Integrity Rules

**Cascading Deletes:**
When a ticket is deleted, its comments and attachments are also deleted:
```prisma
model TicketComment {
  ticket   Ticket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
}
```

**Unique Constraints:**
```prisma
model User {
  email String @unique  // No two users can have same email
}

model Ticket {
  ticketNumber String @unique  // No duplicate ticket numbers
}
```

**Foreign Keys:**
```prisma
model Ticket {
  customerId String
  customer   User @relation(fields: [customerId], references: [id])
  // Database won't allow a ticket without a valid customer
}
```

---

### 3.8 Indexes (Query Optimization)

```prisma
model Ticket {
  @@index([customerId])      // Fast lookup by customer
  @@index([statusId])        // Fast filtering by status
  @@index([departmentId])    // Fast filtering by department
  @@index([priority])        // Fast filtering by priority
  @@index([createdAt])       // Fast sorting by date
}
```

**Why indexes?**
- Without index: Database scans every row (slow)
- With index: Database jumps directly to matching rows (fast)

---

### 3.9 The Seed Data

**Purpose**: Create realistic test data for development and demos.

**What gets created** (from `seed.js`):

| Entity | Count | Examples |
|--------|-------|----------|
| Roles | 5 | SUPER_ADMIN, ADMIN, MANAGER, AGENT, CUSTOMER |
| Ticket Statuses | 5 | OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED |
| Departments | 2 | Technical Support, Billing & Accounts |
| SLA Policies | 4 | One per priority (LOhttp://W, MEDIUM, HIGH, URGENT) |
| Users | 11 | 1 admin, 2 managers, 4 agents, 4 customers |
| Tickets | 7 | Various statuses and assignments |
| Comments | 6 | Sample conversation |
| KB Categories | 2 | Getting Started, Troubleshooting |
| KB Articles | 2 | Sample help articles |

---

## 4. Interaction With Other Parts

### 4.1 Connection to Backend

This role **defines** the data structure that the Backend Engineer **queries**:

```javascript
// Backend Engineer writes queries like this:
const tickets = await prisma.ticket.findMany({
  where: { customerId: userId },
  include: { status: true, department: true }
});

// This only works because THIS ROLE defined:
// - tickets table with customerId field
// - Relation to ticket_statuses table
// - Relation to departments table
```

**If you change the schema**, the Backend Engineer must update their queries.

---

### 4.2 Connection to Security

The schema supports security features:
- `users.passwordHash` — stores hashed passwords
- `users.isActive` — allows account deactivation
- `users.refreshToken` — supports token revocation
- `roles.permissions` — defines RBAC permissions

---

### 4.3 Connection to Reports

Reports read from this schema:
- Ticket counts by status, priority, department
- Resolution times calculated from `createdAt` and `resolvedAt`
- SLA breaches from `responseBreached` and `resolutionBreached` flags

---

## 5. Why These Decisions Were Made

### 5.1 PostgreSQL (Not MongoDB)

**Decision**: Relational database

**Why**:
- Tickets have strong relationships (customer, assignee, department)
- ACID compliance for data integrity
- Complex queries for reports

**Tradeoff**:
- Requires schema definition upfront
- Migrations needed for schema changes

---

### 5.2 UUIDs (Not Auto-Increment IDs)

**Decision**: Use UUIDs as primary keys

**Why**:
- Globally unique (safe for distributed systems)
- Can generate on client before insert
- Non-guessable (harder for attackers)

**Tradeoff**:
- Larger storage (36 chars vs 4 bytes for int)
- Slightly slower indexes

---

### 5.3 Soft Fields for SLA (Not Calculated)

**Decision**: Store `responseBreached` and `resolutionBreached` as boolean fields

**Why**:
- Fast querying (no runtime calculation)
- Can be set by background job

**Tradeoff**:
- Data can become stale if not updated
- Requires manual update logic

---

## 6. Common Questions & Safe Answers

### Q1: "Why did you use Prisma?"

**Safe Answer**:
> "Prisma provides type-safe database access with a clean API. It auto-generates migrations from schema changes, reducing manual SQL work. The declarative schema file serves as living documentation of our data model."

---

### Q2: "How do you handle schema changes?"

**Safe Answer**:
> "When we change schema.prisma, we run `prisma migrate dev` which generates a SQL migration file. This migration is versioned and can be applied to any environment. For production, we use `prisma migrate deploy` which applies pending migrations safely."

---

### Q3: "Why are there so many tables?"

**Safe Answer**:
> "We normalized the database to reduce data redundancy. For example, ticket statuses are in a separate table so we can add new statuses without modifying the tickets table. This also allows status metadata like colors and display names to be changed centrally."

---

### Q4: "How do you ensure data integrity?"

**Safe Answer**:
> "We use foreign key constraints so you can't create a ticket without a valid customer. Unique constraints prevent duplicate emails or ticket numbers. Cascading deletes ensure that when a ticket is deleted, its comments and attachments are also removed."

---

### Q5: "What happens if two users create tickets at the same time?"

**Safe Answer**:
> "Ticket number generation uses a sequence pattern—we fetch the last ticket number and increment it. For true concurrency safety, we could use a database sequence or transaction with row locking. In practice, with our current scale, collisions are extremely rare."

---

## 7. Rebuild Process (Step-by-Step)

### Step 1: Initialize Prisma

```bash
npm install prisma @prisma/client
npx prisma init
```

This creates `prisma/schema.prisma` with a blank template.

### Step 2: Configure Database Connection

```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

### Step 3: Define Core Entities First

Build the foundation tables first (these have no dependencies):
1. `Role`
2. `Department`
3. `TicketStatus`
4. `SLAPolicy`

### Step 4: Add User Entity

Users depend on Role and Department:
```prisma
model User {
  roleId       String
  role         Role @relation(...)
  departmentId String?
  department   Department? @relation(...)
}
```

### Step 5: Add Ticket and Related Entities

Tickets depend on User, Department, Status, SLA:
```prisma
model Ticket {
  customerId   String
  statusId     String
  departmentId String?
  ...
}

model TicketComment { ... }
model TicketHistory { ... }
model Attachment { ... }
```

### Step 6: Add Supporting Entities

```prisma
model Notification { ... }
model KBCategory { ... }
model KBArticle { ... }
```

### Step 7: Run First Migration

```bash
npx prisma migrate dev --name init
```

### Step 8: Create Seed Script

Write `prisma/seed.js` to populate test data.

```bash
node prisma/seed.js
```

---

## Final Notes for Presentation

### Demonstrable Features:

1. **Schema overview**: Name all the tables and their purpose
2. **One relationship in depth**: Explain how Ticket relates to User (customer vs assignee)
3. **Data integrity**: Foreign keys, unique constraints, cascades
4. **Why Prisma**: Benefits over raw SQL

### Opening statement:

> "I was responsible for the database layer of HelpDesk Pro. The schema consists of 14 tables in PostgreSQL, managed by Prisma ORM. I designed the entity relationships, defined data integrity constraints, and created seed data for development. All database changes are versioned through Prisma migrations."

### Closing statement:

> "The database design follows normalization principles with clear entity relationships. Foreign keys ensure referential integrity, and indexes optimize common query patterns. The Prisma schema serves as both the database definition and live documentation of our data model."

---

**Remember: If the data is wrong, everything is wrong. This role is the foundation.**
