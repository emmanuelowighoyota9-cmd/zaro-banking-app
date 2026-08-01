# 🏦 Zaro Bank — Online Banking System

A full-stack online banking platform built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **SQLite**.

## Features

### 🧑‍💼 Customer Portal
- **Registration & Login** — Secure JWT-based authentication with bcrypt password hashing
- **Dashboard** — View total balance and all accounts at a glance
- **Account Management** — Multiple account types (checking/savings)
- **Money Transfers** — Real-time internal transfers between accounts
- **Transaction History** — Full ledger with filtering and details
- **Profile Management** — View and update profile, change password

### 🛡️ Admin Panel
- **Admin Dashboard** — System metrics: total users, accounts, balance, transaction volume
- **User Management** — View, search, filter, suspend, activate, and delete users
- **Credit/Debit Accounts** — Admin can add or remove funds from any user account
- **Transaction Monitoring** — Full transaction ledger with filters by type
- **Transaction Reversal** — Reverse erroneous transactions (credit, debit, transfers)
- **Audit Trail** — Complete log of all admin actions with details

### 🔒 Security
- JWT authentication with httpOnly cookies
- bcrypt password hashing (12 rounds)
- Transaction locking (SQLite transactions for atomicity)
- Role-based access control (user vs admin)
- Input validation on all endpoints
- Proper error handling and user feedback

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jose) + bcryptjs |
| State | React Context + fetch |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/emmanuelowighoyota9-cmd/zaro-banking-app.git
cd zaro-banking-app

npm install
cp .env.example .env.local
# Edit .env.local with your JWT_SECRET

npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Admin Credentials

- **Email**: `admin@bank.com`
- **Password**: `Admin@123!`

⚠️ **Change these immediately in production!**

## License

MIT
