# HelpDesk Pro - Setup Guide

This guide provides step-by-step instructions to set up the HelpDesk Pro application on your local machine.

## 📋 Prerequisites

| Software | Minimum Version |
|----------|----------------|
| Node.js | 20.0.0+ |
| PostgreSQL | 12.0+ |
| npm | 9.0.0+ |

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/mdhasim-1406/Help-Desk.git
cd Help-Desk
```

### 2. Backend Setup (Express + Prisma)
The backend handles the API, database interactions, and business logic.

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and provide your PostgreSQL credentials:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/helpdesk_db"
   JWT_SECRET="your-super-secret-jwt-key"
   ```

4. **Initialize Database:**
   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Run Migrations to create tables
   npx prisma migrate dev --name init

   # Seed the database with initial data (Roles, Admin User, etc.)
   node prisma/seed-safe.js
   ```

### 3. Frontend Setup (Vite + React)
The frontend provides the user interface for customers, agents, and admins.

1. **Navigate to the client directory:**
   ```bash
   cd ../client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   Verify the `VITE_API_URL` matches your backend server (default: `http://localhost:4000/api`).

---

## 🏃‍♂️ Running the Application

For the application to function correctly, both the backend and frontend must be running.

### Start the Backend
```bash
cd backend
npm run dev
```
- **API URL:** `http://localhost:4000`
- **Health Check:** `http://localhost:4000/api/health` (if available)

### Start the Frontend
```bash
cd client
npm run dev
```
- **App URL:** `http://localhost:5173`

---

## 🧪 Testing & Verification

To verify the backend installation and security features:
```bash
cd backend
npm test
```

---

## 📁 Project Structure Notes
- `/backend`: Express server with Prisma ORM.
- `/client`: Vite+React frontend application.
- `root`: Legacy configurations and workspace-level files.
