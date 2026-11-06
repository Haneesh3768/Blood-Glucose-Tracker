# Sweety – Blood Glucose Tracker

A production-grade, clinical personal blood glucose tracking web application designed for diabetes patients to record up to 4 readings per day, view daily and monthly aggregated statistics, and monitor glycemic patterns over time.

---

## 🏗️ Architecture & Tech Stack

Sweety is architected as a **Modular Monolith** with strict multi-tenancy, deterministic validation, and separation of concerns.

```
┌─────────────────────────────────────────────────────────────────┐
│               Frontend: React (Vite, TypeScript)                │
│       Tailwind CSS · React Router · TanStack Query · Recharts   │
└────────────────────────────────┬────────────────────────────────┘
                                 │ REST API (JSON)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│               Backend: Express.js (TypeScript)                  │
│       Routes ➔ Middlewares (Auth & Zod) ➔ Thin Controllers     │
│       Services (Business Logic) ➔ Repositories (Data Access)    │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Prisma ORM 7 + Driver Adapter
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Database: PostgreSQL 16                     │
│         Multi-tenant Isolation · Compound Constraints           │
└─────────────────────────────────────────────────────────────────┘
```

### Full Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Axios, Recharts, Lucide React |
| **Backend** | Node.js (v22), Express, TypeScript, Prisma ORM 7 (`@prisma/adapter-pg`), PostgreSQL (`pg` connection pool) |
| **Security & Auth** | `bcryptjs` (salted password hashing), Stateless JWT access tokens (15m), Opaque refresh tokens with SHA-256 hashing, token rotation and session-family revocation |
| **Testing** | Vitest, Supertest, React Testing Library, jsdom |
| **Infrastructure** | Docker Compose, PostgreSQL 16 Alpine, GitHub Actions CI Pipeline |

---

## 📂 Monorepo Structure

```
sweety/
├── client/                     # Frontend SPA (React + TypeScript + Vite)
│   ├── src/
│   │   ├── api/                # Axios instance with interceptors
│   │   ├── components/         # Reusable UI, Reading Form, Dashboard, Reports
│   │   ├── config/             # Zod environment validation
│   │   ├── context/            # AuthContext provider
│   │   ├── types/              # Domain TypeScript types
│   │   ├── App.tsx             # Root router & Query client
│   │   └── main.tsx            # React DOM mounting
│   ├── index.html
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                     # Backend API (Express + TypeScript + Prisma 7)
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma data model & indexes
│   │   └── seed.ts             # 60-day demo database seeder
│   ├── src/
│   │   ├── config/             # Database pool, env validation, logger
│   │   ├── errors/             # AppError hierarchy & centralized errorHandler
│   │   ├── middlewares/        # JWT auth, Zod validation
│   │   ├── modules/
│   │   │   ├── auth/           # Routes, controller, service, repository, validator
│   │   │   ├── readings/       # Routes, controller, service, repository, validator
│   │   │   └── reports/        # Routes, controller, service, repository, validator
│   │   ├── types/              # API and session types
│   │   ├── app.ts              # Express application factory
│   │   └── index.ts            # Server entrypoint with graceful shutdown
│   ├── prisma.config.ts        # Prisma 7 configuration file
│   ├── tsconfig.json
│   └── vitest.config.ts
├── .github/workflows/ci.yml     # Automated lint, typecheck, test workflow
├── docker-compose.yml          # PostgreSQL container definition
├── tsconfig.base.json          # Strict TypeScript base configuration
├── .env.example                # Global environment variables template
└── README.md
```

---

## ⚡ Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10.x`
- **Docker & Docker Compose** (optional for running PostgreSQL locally)

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd sweety
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3. Start PostgreSQL Database

Using Docker Compose:
```bash
docker compose up -d postgres
```

Or connect to an existing PostgreSQL instance by updating `DATABASE_URL` in `server/.env`.

### 4. Run Prisma Migrations & Seed Data

```bash
# Generate Prisma Client
npm run prisma:generate

# Apply database migrations
npm run prisma:migrate --workspace=server

# Seed demo user & 30 days of sample readings
npm run seed --workspace=server
```

> **Demo User Credentials**:
> - Email: `patient@sweety.app`
> - Password: `Password123!`

### 5. Launch the Development Environment

Run both backend and frontend concurrently:
```bash
# Run server (port 5000)
npm run dev:server

# Run client (port 5173) in a separate terminal
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing

Sweety includes unit and integration tests for both client and server:

```bash
# Run all tests across workspaces
npm run test

# Run backend tests only
npm run test --workspace=server

# Run frontend tests only
npm run test --workspace=client
```

---

## 🛡️ Business Validation Rules Matrix

The application strictly implements and tests the following 5 business rules:

| # | Rule | Condition Checked | Exact UI Error Message |
|---|---|---|---|
| 1 | **Value is required** | `value === undefined \|\| value === ""` | `"Please enter a glucose value."` |
| 2 | **Range boundary** | Not whole integer or `< 40` or `> 600` | `"Value must be between 40 and 600 mg/dl."` |
| 3 | **One reading per slot per day** | Duplicate slot on specified date | `"You already have an [Slot Name] reading for this date."` |
| 4 | **Maximum 4 readings per day** | Total daily count reaches 4 | `"You can add only 4 readings per day."` |
| 5 | **Date cannot be in the future** | `Date > Today` | `"Date cannot be in the future."` |

---

## 📊 Reports & Aggregations

Each report calculates:
- **Highest reading** (`MAX(value)`)
- **Lowest reading** (`MIN(value)`)
- **Average reading** (`ROUND(AVG(value), 1)`)
- **Count of readings** (`COUNT(*)`)

Scopes supported:
1. **Daily**: Selected calendar date (includes slot breakdown).
2. **Month-to-Date (MTD)**: 1st of the month through the selected date.
3. **Monthly**: The full calendar duration of the previous month.
4. **Empty State**: Friendly illustration and prompt when zero readings exist for the selected scope.

---

## 📝 Engineering Notes & Assumptions

1. **Date & Timezone Precision**:
   - Glucose readings are logged against a calendar date (`DATE` in PostgreSQL). To prevent client/server timezone drift, dates are transferred as ISO `YYYY-MM-DD` strings and stored as UTC dates.
2. **Security & Refresh Token Family Revocation**:
   - Refresh tokens are stored strictly as SHA-256 hashes.
   - If an expired or already-revoked refresh token is exchanged, the server invalidates all active tokens in that `familyId` to prevent token replay attacks.
3. **Multi-Tenancy Isolation**:
   - Every reading query enforces `WHERE user_id = $userId`. Users cannot inspect, modify, or delete another patient's readings.
4. **Future Enhancements**:
   - Export reports to PDF/CSV for consultation with healthcare providers.
   - Doctor role to view patient trends upon explicit consent.
   - Push notifications for missing slots before bed.
