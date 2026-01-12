# HelpDesk Pro

A monolithic-to-microservices hybrid helpdesk system featuring a modern React frontend and a robust Express backend. 
Designed for scalability, security, and performance.

## 🚀 Tech Stack

| Layer | Technology | Details |
|-------|------------|---------|
| **Frontend** | Vite + React 18 | Client-side rendering, TailwindCSS, Zustand |
| **Backend** | Express.js | REST API, Rate Limiting, Helmet Security |
| **Database** | PostgreSQL | Managed via Prisma ORM |
| **Testing** | Jest + Supertest | Automated Backend Testing Suite |

## ✨ Features

- **Role-Based Access Control (RBAC)**: Fine-grained permissions for Customers, Agents, Managers, and Admins.
- **Secure Authentication**: JWT-based auth with refresh tokens and strict rate limiting (5 attempts/15min).
- **Ticket Management**: Full CRUD operations with rich text support and file attachments.
- **Security Hardened**:
    - **Rate Limiting**: Protection against brute force and DDoS.
    - **Input Sanitization**: XSS prevention via `dompurify`.
    - **Audit Logging**: Structured JSON logs for security events.
    - **Security Headers**: Helmet integration for HTTP protections.
- **Automated Testing**: 9+ backend tests verifying Auth, RBAC, and Security.

## 🛠️ Quick Start

### Prerequisites
- Node.js >= 18
- PostgreSQL

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/mdhasim-1406/Help-Desk.git
    cd Help-Desk
    ```

2.  **Install Backend Dependencies**
    ```bash
    cd backend
    npm install
    cp .env.example .env # Configure your DB credentials
    npx prisma db seed
    ```

3.  **Install Frontend Dependencies**
    ```bash
    cd ../client
    npm install
    cp .env.example .env
    ```

4.  **Run Application**
    - Backend: `cd backend && npm run dev` (Port 4000)
    - Frontend: `cd client && npm run dev` (Port 5173)

## 🧪 Testing

Run the comprehensive backend test suite:
```bash
cd backend
npm test
```

## 📜 License
Proprietary / Personal Project. All rights reserved.
