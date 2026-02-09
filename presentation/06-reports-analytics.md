# Role: Reports, Analytics & SLA Monitoring

---

## 1. Role Responsibility

As the **Reports and Analytics Engineer**, this role is responsible for providing **insights and visibility** into the helpdesk operations. This includes:

1. **Building Report Endpoints**: APIs that return aggregated data for dashboards.
2. **SLA Monitoring**: Tracking whether tickets meet response and resolution time targets.
3. **Performance Metrics**: Agent productivity, resolution times, ticket volumes.
4. **Data Visualization Support**: Providing data in formats the frontend can chart.

> **Think of this role as the intelligence analyst.** While others handle individual tickets, this role steps back and sees the bigger picture—patterns, trends, and health indicators.

---

## 2. Where This Role Fits in the Overall Architecture

The domain spans the **Backend** (report endpoints) and influences the **Frontend** (dashboards):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Frontend Dashboards (Frontend Engineer)                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Charts: Ticket Volume, SLA Compliance, Agent Performance             │  │
│  │ (Uses Recharts library to display the analytics data)                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Calls the report endpoints
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│      REPORTS API DOMAIN                                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ /api/reports/overview        → Dashboard summary stats                │  │
│  │ /api/reports/volume          → Tickets created per day                │  │
│  │ /api/reports/agent-performance → Resolution counts per agent         │  │
│  │ /api/reports/sla/compliance  → SLA breach rates                       │  │
│  │ /api/sla/breaches            → List of breached tickets               │  │
│  │ /api/sla/stats               → Breach statistics by priority          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Queries aggregated data
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Database (Database Engineer)                                               │
│  - tickets table with createdAt, resolvedAt, priority, status              │
│  - SLA tracking fields: responseBreached, resolutionBreached               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### This role owns:
- `backend/src/routes/api/reports.js` — All analytics endpoints
- `backend/src/routes/api/sla.js` — SLA-specific endpoints
- Logic for aggregating and computing metrics

### Depends on:
- **Database (Database Engineer)**: Schema provides the data aggregated here
- **Backend Engineer**: Consistently follows API patterns for route handling

---

## 3. Detailed Explanation of What Was Built

### 3.1 The Reports API Overview

All report endpoints require authentication and the `reports:read` permission.

| Endpoint | Purpose | Returns |
|----------|---------|---------|
| `GET /api/reports/overview` | Dashboard summary | Total tickets, users, resolution time, SLA % |
| `GET /api/reports/tickets/summary` | Ticket breakdown by status | Count per status |
| `GET /api/reports/volume` | Ticket creation trend | Tickets per day for date range |
| `GET /api/reports/agent-performance` | Agent productivity | Tickets resolved per agent |
| `GET /api/reports/tickets/by-priority` | Priority distribution | Count per priority level |
| `GET /api/reports/tickets/by-status` | Status distribution | Count per status |
| `GET /api/reports/tickets/by-department` | Department load | Count per department |
| `GET /api/reports/sla/compliance` | SLA health | On-time vs breached percentages |
| `GET /api/reports/resolution-time` | Average resolution time | Minutes by priority/department |
| `GET /api/sla/policies` | Active SLA rules | Response and resolution times |
| `GET /api/sla/breaches` | Breached tickets list | Tickets that missed SLA |
| `GET /api/sla/stats` | Breach statistics | By priority breakdown |

---

### 3.2 Dashboard Overview Endpoint

**What it returns:**

```json
{
  "success": true,
  "data": {
    "totalTickets": 42,
    "openTickets": 18,
    "resolvedToday": 5,
    "totalUsers": 15,
    "totalAgents": 6,
    "avgResolutionTime": 245,  // minutes
    "slaComplianceRate": 85.7  // percent
  }
}
```

**How it works:**

```javascript
// routes/api/reports.js

router.get('/overview', authMiddleware, requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    // Total tickets
    const totalTickets = await prisma.ticket.count();
    
    // Open tickets (status is not closed/resolved)
    const openTickets = await prisma.ticket.count({
      where: {
        status: { isClosed: false, isResolved: false }
      }
    });
    
    // Resolved today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resolvedToday = await prisma.ticket.count({
      where: {
        resolvedAt: { gte: today }
      }
    });
    
    // Total users and agents
    const totalUsers = await prisma.user.count();
    const totalAgents = await prisma.user.count({
      where: {
        role: { name: { in: ['AGENT', 'MANAGER', 'ADMIN'] } }
      }
    });
    
    // Average resolution time
    const resolvedTickets = await prisma.ticket.findMany({
      where: { resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true }
    });
    
    const totalMinutes = resolvedTickets.reduce((sum, t) => {
      return sum + differenceInMinutes(t.resolvedAt, t.createdAt);
    }, 0);
    const avgResolutionTime = resolvedTickets.length > 0 
      ? Math.round(totalMinutes / resolvedTickets.length) 
      : 0;
    
    // SLA compliance
    const withSLA = await prisma.ticket.count({
      where: { slaPolicyId: { not: null } }
    });
    const breached = await prisma.ticket.count({
      where: {
        OR: [
          { responseBreached: true },
          { resolutionBreached: true }
        ]
      }
    });
    const slaComplianceRate = withSLA > 0 
      ? ((withSLA - breached) / withSLA * 100).toFixed(1) 
      : 100;
    
    res.json({
      success: true,
      data: {
        totalTickets,
        openTickets,
        resolvedToday,
        totalUsers,
        totalAgents,
        avgResolutionTime,
        slaComplianceRate: parseFloat(slaComplianceRate)
      }
    });
  })
);
```

---

### 3.3 Ticket Volume Trend

**Purpose**: Show tickets created per day over a time range.

**What it returns:**

```json
{
  "success": true,
  "data": [
    { "date": "2026-01-15", "count": 5 },
    { "date": "2026-01-16", "count": 8 },
    { "date": "2026-01-17", "count": 3 }
  ]
}
```

**How it works:**

```javascript
router.get('/volume', authMiddleware, requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get all tickets in range
    const tickets = await prisma.ticket.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true }
    });
    
    // Group by date
    const volumeMap = {};
    tickets.forEach(t => {
      const dateKey = format(t.createdAt, 'yyyy-MM-dd');
      volumeMap[dateKey] = (volumeMap[dateKey] || 0) + 1;
    });
    
    // Convert to array sorted by date
    const volume = Object.entries(volumeMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    res.json({ success: true, data: volume });
  })
);
```

---

### 3.4 Agent Performance

**Purpose**: Show how many tickets each agent has resolved.

**What it returns:**

```json
{
  "success": true,
  "data": [
    { "agentId": "123", "name": "Technical Agent A", "resolved": 15, "avgTime": 180 },
    { "agentId": "456", "name": "Technical Agent B", "resolved": 22, "avgTime": 120 }
  ]
}
```

**How it works:**

```javascript
router.get('/agent-performance', authMiddleware, requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    // Get all agents
    const agents = await prisma.user.findMany({
      where: { role: { name: 'AGENT' } },
      select: { id: true, firstName: true, lastName: true }
    });
    
    const performance = await Promise.all(agents.map(async (agent) => {
      // Count resolved tickets
      const resolved = await prisma.ticket.count({
        where: {
          assignedToId: agent.id,
          resolvedAt: { not: null }
        }
      });
      
      // Calculate average resolution time
      const tickets = await prisma.ticket.findMany({
        where: {
          assignedToId: agent.id,
          resolvedAt: { not: null }
        },
        select: { createdAt: true, resolvedAt: true }
      });
      
      const totalMinutes = tickets.reduce((sum, t) => {
        return sum + differenceInMinutes(t.resolvedAt, t.createdAt);
      }, 0);
      const avgTime = tickets.length > 0 ? Math.round(totalMinutes / tickets.length) : 0;
      
      return {
        agentId: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        resolved,
        avgTime
      };
    }));
    
    res.json({ success: true, data: performance });
  })
);
```

---

### 3.5 SLA Compliance

**What is SLA?**
Service Level Agreement defines time limits:
- **Response SLA**: How quickly must the first response to the ticket be made?
- **Resolution SLA**: How quickly must the ticket be resolved?

**SLA Policies by Priority:**

| Priority | Response Time | Resolution Time |
|----------|---------------|-----------------|
| URGENT | 1 hour | 4 hours |
| HIGH | 4 hours | 24 hours |
| MEDIUM | 8 hours | 48 hours |
| LOW | 24 hours | 72 hours |

**How breach tracking works:**

1. When a ticket is created, `responseDueAt` and `resolutionDueAt` are calculated based on priority.
2. A background process (or trigger) checks if current time exceeds due time.
3. If breached, `responseBreached` or `resolutionBreached` is set to `true`.

**SLA Compliance Endpoint:**

```javascript
router.get('/sla/compliance', authMiddleware, requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    // Total tickets with SLA
    const totalWithSLA = await prisma.ticket.count({
      where: { slaPolicyId: { not: null } }
    });
    
    // Response breaches
    const responseBreaches = await prisma.ticket.count({
      where: { responseBreached: true }
    });
    
    // Resolution breaches
    const resolutionBreaches = await prisma.ticket.count({
      where: { resolutionBreached: true }
    });
    
    // Any breach
    const anyBreach = await prisma.ticket.count({
      where: {
        OR: [
          { responseBreached: true },
          { resolutionBreached: true }
        ]
      }
    });
    
    const complianceRate = totalWithSLA > 0
      ? ((totalWithSLA - anyBreach) / totalWithSLA * 100).toFixed(1)
      : 100;
    
    res.json({
      success: true,
      data: {
        totalWithSLA,
        responseBreaches,
        resolutionBreaches,
        overallBreaches: anyBreach,
        complianceRate: parseFloat(complianceRate)
      }
    });
  })
);
```

---

### 3.6 Distribution Reports

**Tickets by Priority:**

```javascript
router.get('/tickets/by-priority', authMiddleware, requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const distribution = await prisma.ticket.groupBy({
      by: ['priority'],
      _count: { id: true }
    });
    
    const data = distribution.map(d => ({
      priority: d.priority,
      count: d._count.id
    }));
    
    res.json({ success: true, data });
  })
);
```

**Result:**
```json
{
  "data": [
    { "priority": "LOW", "count": 12 },
    { "priority": "MEDIUM", "count": 18 },
    { "priority": "HIGH", "count": 8 },
    { "priority": "URGENT", "count": 4 }
  ]
}
```

**Tickets by Department:**

```javascript
router.get('/tickets/by-department', authMiddleware, requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const distribution = await prisma.ticket.groupBy({
      by: ['departmentId'],
      _count: { id: true }
    });
    
    // Enrich with department names
    const departments = await prisma.department.findMany();
    const deptMap = Object.fromEntries(departments.map(d => [d.id, d.name]));
    
    const data = distribution.map(d => ({
      departmentId: d.departmentId,
      departmentName: deptMap[d.departmentId] || 'Unassigned',
      count: d._count.id
    }));
    
    res.json({ success: true, data });
  })
);
```

---

## 4. Interaction With Other Parts

### 4.1 Connection to Frontend

This role **provides** the data that the Frontend Engineer **visualizes**:

| Chart | Endpoint |
|---------------|---------------|
| Ticket volume line chart | `GET /api/reports/volume` |
| Priority pie chart | `GET /api/reports/tickets/by-priority` |
| Agent performance bar chart | `GET /api/reports/agent-performance` |
| SLA gauge/meter | `GET /api/reports/sla/compliance` |

The Frontend Engineer uses **Recharts** to render this data as graphs.

---

### 4.2 Connection to Database

This role **aggregates** data from the Database Engineer's schema:
- Ticket counts by status, priority, department
- Date-based queries on `createdAt`, `resolvedAt`
- SLA flags: `responseBreached`, `resolutionBreached`

---

### 4.3 Connection to Security

These endpoints are protected:
```javascript
router.get('/overview', authMiddleware, requirePermission('reports:read'), ...)
```

Only users with `reports:read` permission (Managers, Admins) can access reports.

---

## 5. Why These Decisions Were Made

### 5.1 Computed vs Stored Metrics

**Decision**: Compute most metrics on-demand from raw data.

**Why**:
- Always accurate (reflects current data)
- No sync issues between raw data and cached metrics
- Simpler implementation

**Tradeoff**:
- Slower for large datasets
- Could add caching or pre-aggregation for scale

---

### 5.2 Simple Date Grouping

**Decision**: Group by date string (yyyy-MM-dd) in JavaScript after fetching data.

**Why**:
- Works across databases
- Easier to debug
- Sufficient for current data volumes

**Tradeoff**:
- Database-level grouping would be faster for millions of records

---

### 5.3 SLA as Boolean Flags

**Decision**: Store `responseBreached` and `resolutionBreached` as booleans.

**Why**:
- Fast querying (simple WHERE clause)
- Clear binary state

**Tradeoff**:
- Needs external process to update flags (not automatic)
- Currently relies on manual update or trigger

---

## 6. Common Questions & Safe Answers

### Q1: "How is average resolution time calculated?"

**Safe Answer**:
> "For each resolved ticket, the difference between `resolvedAt` and `createdAt` is calculated in minutes. These durations are summed and divided by the count of resolved tickets. This gives the average time from ticket creation to resolution."

---

### Q2: "What does SLA compliance rate mean?"

**Safe Answer**:
> "SLA compliance rate is the percentage of tickets that met their SLA targets. Tickets with an SLA policy are counted, then those that breached either response or resolution time are subtracted. Compliance rate is (tickets with SLA - breached) / tickets with SLA, expressed as a percentage."

---

### Q3: "Why can't customers see reports?"

**Safe Answer**:
> "Reports contain aggregate data across all users and departments, which raises privacy concerns. Only Managers and Admins have the 'reports:read' permission. Customers can see statistics about their own tickets on their dashboard, but not system-wide analytics."

---

### Q4: "How would you improve reporting for scale?"

**Safe Answer**:
> "For a larger system, I would implement pre-aggregation—running periodic jobs that compute and store daily/weekly rollups. This ensures reports read from summary tables rather than scanning millions of tickets. Caching for frequently-accessed reports could also be added."

---

### Q5: "Does the system support custom date ranges?"

**Safe Answer**:
> "Yes, several endpoints accept query parameters like `?days=30` or `?startDate=2026-01-01&endDate=2026-01-31`. The frontend can adjust these parameters to allow users to select custom reporting periods."

---

## 7. Rebuild Process (Step-by-Step)

### Step 1: Identify Required Metrics

Define the needed insights:
- Dashboard summary (tickets, users, SLA)
- Trends (volume over time)
- Distributions (by status, priority, department)
- Performance (per agent)

### Step 2: Create Reports Route File

```javascript
// routes/api/reports.js
const router = require('express').Router();
const { authMiddleware, requirePermission } = require('../../middleware/auth');

router.get('/overview', authMiddleware, requirePermission('reports:read'), ...);

module.exports = router;
```

### Step 3: Build Overview Endpoint First

Start with the summary statistics. It covers:
- Counting records
- Filtering by conditions
- Calculating percentages

### Step 4: Add Distribution Endpoints

Use Prisma's `groupBy` for efficient aggregation:
```javascript
await prisma.ticket.groupBy({
  by: ['priority'],
  _count: { id: true }
});
```

### Step 5: Add Trend Endpoints

Fetch date-based data and group in JavaScript:
```javascript
const tickets = await prisma.ticket.findMany({
  where: { createdAt: { gte: startDate } },
  select: { createdAt: true }
});
// Group by date string
```

### Step 6: Add SLA Endpoints

Create separate `/api/sla` routes for:
- Listing SLA policies
- Listing breached tickets
- Computing breach statistics

### Step 7: Test with Seed Data

Use the seeded tickets to verify reports return expected values.

---

## Final Notes for Presentation

### Demonstrable Features:

1. **What metrics are tracked**: List the key performance indicators
2. **How SLA works**: Response time, resolution time, breach detection
3. **One calculation in depth**: Walk through how average resolution time is computed
4. **Data flow**: From database → report endpoint → frontend chart

### Demo suggestions:

1. Show the Admin dashboard with all its charts
2. Highlight the SLA compliance indicator
3. Explain the significance of each count

### Opening statement:

> "I was responsible for the reporting and analytics layer of HelpDesk Pro. This involves dashboard summary statistics, trend analysis for ticket volume, agent performance metrics, and SLA compliance monitoring. All report endpoints aggregate data from the database and return it in formats suitable for charting."

### Closing statement:

> "The reporting system provides visibility into helpdesk operations through key metrics like resolution times, ticket distributions, and SLA compliance rates. While the current implementation computes metrics on-demand, the architecture could be extended with pre-aggregation for larger data volumes."

---

**Remember: Raw data is turned into actionable insights. This role provides the intelligence that management relies on.**
