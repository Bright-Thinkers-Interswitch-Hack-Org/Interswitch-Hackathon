# Spendlex

**Spendlex** is a personal financial intelligence platform that helps users track spending, manage budgets, and receive AI-driven insights to optimize their financial health. Built for the Interswitch Developer Community x Enyata Hackathon 2026.

**Live Application:** [https://spendlex.vercel.app](https://spendlex.vercel.app)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Team Contributions](#team-contributions)

---

## Overview

Spendlex addresses the challenge of personal financial management by providing users with a unified platform to monitor their spending behavior, set category-based budgets, and receive intelligent recommendations. The platform integrates with Interswitch's WhatsApp OTP API for secure phone verification during user onboarding.

### Problem Statement

Many individuals lack visibility into their spending patterns, leading to overspending, missed savings opportunities, and poor financial decision-making. Existing tools are often fragmented, requiring users to manually track expenses across multiple sources.

### Solution

Spendlex provides:
- Automated transaction tracking and categorization
- Real-time budget monitoring with overspend alerts
- A financial health scoring system based on spending velocity, savings rate, and budget adherence
- AI-driven insights that analyze patterns and recommend actionable optimizations
- Secure onboarding with Interswitch WhatsApp OTP verification

---

## Features

- **User Authentication** -- Secure signup and login with JWT-based sessions
- **WhatsApp OTP Verification** -- Phone number verification via Interswitch WhatsApp OTP API
- **Dashboard** -- Overview of total spending, financial health score, category breakdown, and recent transactions
- **Transaction Management** -- Full transaction history with search, filtering (income/expenses), and date grouping
- **Budget Management** -- Create, edit, and delete category-based budgets with real-time spend tracking
- **Analytics** -- Monthly spending overview, category distribution (donut chart), and 6-month spending trends
- **Financial Health Score** -- Composite score (0-100) calculated from spending efficiency, savings rate, and budget adherence
- **Smart Insights** -- Automated alerts for overspending, budget warnings, savings opportunities, and goal progress
- **Ask AI** -- Natural language interface to query personal financial data

---

## Tech Stack

| Layer       | Technology                                                        |
|-------------|-------------------------------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend     | Node.js, Express.js                                               |
| Database    | Supabase (PostgreSQL)                                             |
| Auth        | JWT (JSON Web Tokens), crypto (scrypt hashing)                    |
| OTP         | Interswitch WhatsApp OTP API                                      |
| Deployment  | Vercel (frontend), Render (backend)                               |

---

## Architecture

```
Client (React SPA)
    |
    | HTTPS
    v
Vercel (Static Hosting)
    |
    | API calls to VITE_API_URL
    v
Render (Node.js/Express)
    |
    |--- Supabase (PostgreSQL) -- users, transactions, budgets, otp_codes
    |
    |--- Interswitch API -- WhatsApp OTP delivery
```

### Project Structure

```
Interswitch/
  frontend/                     React + Vite application
    src/
      context/AuthContext.tsx    Authentication state management
      services/api.ts           API client (auth, transactions, budgets, analytics, insights)
      pages/                    Application pages
      components/               Reusable UI components
    vite.config.ts              Vite config with API proxy (dev) and env-based URL (prod)

  backend/                      Node.js + Express API
    src/
      server.js                 Express server entry point
      config/                   Supabase and Interswitch configuration
      middleware/auth.js        JWT authentication middleware
      services/interswitch.js   Interswitch WhatsApp OTP integration
      routes/
        auth.js                 POST /signup, /login, /send-otp, /verify-otp, GET /me
        profile.js              GET/PUT /profile
        transactions.js         GET/POST/DELETE /transactions, GET /transactions/summary
        budgets.js              GET/POST/PUT/DELETE /budgets
        analytics.js            GET /analytics/spending, /analytics/trends, /analytics/financial-health
        insights.js             GET /insights, POST /insights/ask
    supabase/
      migration.sql             Database schema (tables, indexes, RLS policies)
      seed.sql                  Sample data for demonstration
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- Interswitch API credentials (via Quickteller Business)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Bright-Thinkers-Interswitch-Hack-Org/Interswitch-Hackathon.git
   cd Interswitch-Hackathon
   ```

2. **Set up the database**
   - Open the Supabase SQL Editor for your project
   - Run the contents of `backend/supabase/migration.sql`
   - Optionally run `backend/supabase/seed.sql` for sample data

3. **Configure the backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your Supabase keys, Interswitch credentials, and JWT secret
   npm install
   npm run dev
   ```

4. **Configure the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. The frontend runs on `http://localhost:8080` and proxies API requests to the backend on `http://localhost:3001`.

---

## API Documentation

All authenticated endpoints require the header: `Authorization: Bearer <token>`

### Authentication

| Method | Endpoint             | Description                      |
|--------|----------------------|----------------------------------|
| POST   | /api/auth/signup     | Register a new user              |
| POST   | /api/auth/login      | Authenticate and receive a token |
| POST   | /api/auth/send-otp   | Send WhatsApp OTP via Interswitch|
| POST   | /api/auth/verify-otp | Verify the OTP code              |
| GET    | /api/auth/me         | Get current user profile         |

### Transactions

| Method | Endpoint                  | Description                    |
|--------|---------------------------|--------------------------------|
| GET    | /api/transactions         | List transactions (filterable) |
| POST   | /api/transactions         | Create a transaction           |
| DELETE | /api/transactions/:id     | Delete a transaction           |
| GET    | /api/transactions/summary | Monthly spend summary          |

### Budgets

| Method | Endpoint          | Description           |
|--------|-------------------|-----------------------|
| GET    | /api/budgets      | List all budgets      |
| POST   | /api/budgets      | Create a budget       |
| PUT    | /api/budgets/:id  | Update a budget       |
| DELETE | /api/budgets/:id  | Delete a budget       |

### Analytics

| Method | Endpoint                        | Description                 |
|--------|---------------------------------|-----------------------------|
| GET    | /api/analytics/spending         | Current month spending data |
| GET    | /api/analytics/trends           | 6-month spending trends     |
| GET    | /api/analytics/financial-health | Financial health score      |

### Insights

| Method | Endpoint           | Description                        |
|--------|--------------------|------------------------------------|
| GET    | /api/insights      | Auto-generated financial insights  |
| POST   | /api/insights/ask  | Ask a question about your finances |

---

## Deployment

### Backend (Render)

- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `node src/server.js`
- **Environment Variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `INTERSWITCH_CLIENT_ID`, `INTERSWITCH_CLIENT_SECRET`, `INTERSWITCH_PASSPORT_URL`, `INTERSWITCH_API_URL`, `FRONTEND_URL`, `PORT`, `NODE_ENV`

### Frontend (Vercel)

- **Root Directory:** `frontend`
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:** `VITE_API_URL` (set to the Render backend URL with `/api` suffix)

---

## Team Contributions

### Blen Redwan -- Software Developer

- Designed and implemented the full backend architecture (Node.js, Express, Supabase)
- Built all API endpoints: authentication, transactions, budgets, analytics, insights
- Integrated Interswitch WhatsApp OTP API for phone verification
- Created the database schema, migration scripts, and seed data
- Connected the React frontend to the backend API layer
- Implemented JWT authentication, protected routes, and auth context
- Configured deployment on Render (backend) and Vercel (frontend)
- Set up CORS, environment-based configuration, and production logging

### Blessing Omonye Abanonkhua -- Product Designer

- Designed the complete UI/UX for the Spendlex application
- Created the visual design system including color palette, typography, and component styles
- Designed all application screens: onboarding, authentication, dashboard, transactions, analytics, budgets, financial health, and insights
- Developed the responsive mobile-first layout and navigation patterns
- Designed the data visualization components (charts, progress bars, health score indicators)


### Nwaiwu Chiamaka Victoria -- Product Designer

- Co-designed the user interface and visual experience for the Spendlex application
- Contributed to the design system, component styling, and interaction patterns
- Collaborated on screen designs for onboarding, dashboard, and financial health views
- Ensured visual consistency and brand alignment across all application screens

### Ohale Silver Chioma -- Product Manager

- Defined the product vision, roadmap, and feature prioritization for Spendlex
- Conducted user research and identified key pain points in personal financial management
- Coordinated cross-functional collaboration between design and development teams
- Managed project timelines, deliverables, and stakeholder communication for the hackathon

---

## Interswitch Integration

Spendlex integrates with the Interswitch WhatsApp OTP API to provide secure phone number verification during user registration. The integration flow:

1. User registers with email, password, and phone number
2. Backend generates a 6-digit OTP code
3. Backend authenticates with Interswitch using client credentials (OAuth 2.0)
4. OTP is sent to the user's WhatsApp via Interswitch's messaging API (`POST /v1/whatsapp/auth/send`)
5. User enters the received code on the verification screen
6. Backend validates the code against the stored record and marks the phone as verified

**API Used:** Interswitch WhatsApp OTP API via the API Marketplace
**Authentication:** OAuth 2.0 Client Credentials flow via Interswitch Passport

---

## License

This project was built for the Interswitch Developer Community x Enyata Hackathon 2026.
