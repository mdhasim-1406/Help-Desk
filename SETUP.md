# HelpDesk Pro - Setup Guide

## 📋 Prerequisites

| Software | Minimum Version |
|----------|----------------|
| Node.js | 18.0.0+ |
| PostgreSQL | 12.0+ |

## 🚀 Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd Help-Desk
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DB credentials
```

**Database Setup**:
```bash
# Generate Client
npx prisma generate

# Run Migrations & Seed
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. Frontend Setup
```bash
cd ../client
npm install
cp .env.example .env
```

## 🏃‍♂️ Running the App

**Backend**:
```bash
cd backend
npm run dev
# Server starts on http://localhost:4000
```

**Frontend**:
```bash
cd client
npm run dev
# App opens at http://localhost:5173
```

## 🧪 Testing

To verify the installation and security features:
```bash
cd backend
npm test
```
Expected output: 9 passed tests.
