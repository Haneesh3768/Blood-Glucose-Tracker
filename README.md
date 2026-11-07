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
| **Backend** | Node.js (v22), Express, TypeScript, Prisma ORM 7 (`@prisma/adapter-pg`), PostgreSQL (`pg` connection pool), Pino logger with PII redaction |
| **Security & Auth** | `bcryptjs` (cost 12), Stateless JWT access tokens (15m, issuer & audience verified), Opaque refresh tokens stored strictly as SHA-256 hashes, HTTP-only SameSite=Strict cookies, atomic token rotation in transactions, session-family reuse revocation, rate limiting (`express-rate-limit`), CSRF origin defense |
| **Testing** | Vitest, Supertest, React Testing Library, jsdom |
| **Infrastructure** | Docker Compose, PostgreSQL 16 Alpine, Multi-stage Dockerfiles, GitHub Actions CI Pipeline |

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

## 📖 API Reference & Interactive Documentation

Sweety provides interactive Swagger UI documentation directly on the running backend:
- **Interactive Swagger UI**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **OpenAPI 3.0.3 Specification**: [http://localhost:5000/api/docs/openapi.json](http://localhost:5000/api/docs/openapi.json)

### Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None | Register new patient account with bcrypt cost 12 |
| `POST` | `/api/v1/auth/login` | None | Authenticate patient; issues access token + HTTP-only refresh cookie |
| `POST` | `/api/v1/auth/refresh` | Cookie | Atomic refresh token rotation with session family tracking |
| `POST` | `/api/v1/auth/logout` | Cookie | Revoke current session refresh token and clear cookie |
| `POST` | `/api/v1/auth/logout-all` | Bearer | Revoke all session families across all devices for patient |
| `GET` | `/api/v1/auth/me` | Bearer | Get authenticated user profile identity |

### Readings Management Endpoints (`/api/v1/readings`) – Phase 2

All reading endpoints require `Authorization: Bearer <jwt_access_token>`. Multi-tenant authorization ensures patients can only query, modify, or delete their own clinical data. Accessing another user's reading returns `404 Not Found` to prevent enumeration.

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/v1/readings` | Create reading (max 4/day, 1 per slot/day) | `201`, `400`, `401`, `409` |
| `GET` | `/api/v1/readings?page=1&limit=20` | Paginated list of readings | `200`, `400`, `401` |
| `GET` | `/api/v1/readings/:id` | Get specific reading by UUID | `200`, `401`, `404` |
| `PATCH` | `/api/v1/readings/:id` | Partial update (`glucoseValue`, `timeSlot`, `readingDate`) | `200`, `400`, `401`, `404`, `409` |
| `DELETE` | `/api/v1/readings/:id` | Delete specific reading | `200`, `401`, `404` |

### Glucose Reporting & Analytics Endpoints (`/api/v1/reports`) – Phase 3

All report endpoints require `Authorization: Bearer <jwt_access_token>`. Statistics are calculated over individual underlying readings (never by averaging daily averages).

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/v1/reports/daily?date=YYYY-MM-DD` | Aggregated metrics for calendar date + full slot details | `200`, `400`, `401` |
| `GET` | `/api/v1/reports/month-to-date?date=YYYY-MM-DD` | Aggregated metrics from 1st of month to selected date | `200`, `400`, `401` |
| `GET` | `/api/v1/reports/monthly?date=YYYY-MM-DD` | Aggregated metrics for entire previous calendar month | `200`, `400`, `401` |
| `GET` | `/api/v1/reports/summary?type=daily\|mtd\|monthly&date=YYYY-MM-DD` | Backward-compatible unified report endpoint | `200`, `400`, `401` |

#### Daily Report Response Example (`GET /api/v1/reports/daily?date=2026-10-15`)
```json
{
  "success": true,
  "data": {
    "report": {
      "reportType": "daily",
      "selectedDate": "2026-10-15",
      "dateRange": {
        "startDate": "2026-10-15",
        "endDate": "2026-10-15"
      },
      "stats": {
        "highest": 142,
        "lowest": 90,
        "average": 123.8,
        "count": 4,
        "totalReadings": 4
      },
      "readings": [
        {
          "id": "7b82ef45-8bc3-4819-bf9d-f286821d3f9b",
          "userId": "d1e2f3a4-5678-90ab-cdef-1234567890ab",
          "readingDate": "2026-10-15",
          "timeSlot": "Morning (fasting)",
          "glucoseValue": 90,
          "value": 90,
          "createdAt": "2026-10-15T07:30:00.000Z",
          "updatedAt": "2026-10-15T07:30:00.000Z"
        }
      ],
      "isEmpty": false
    }
  }
}
```

#### Empty State Report Response Example
```json
{
  "success": true,
  "data": {
    "report": {
      "reportType": "daily",
      "selectedDate": "2025-01-01",
      "dateRange": {
        "startDate": "2025-01-01",
        "endDate": "2025-01-01"
      },
      "stats": {
        "highest": null,
        "lowest": null,
        "average": null,
        "count": 0,
        "totalReadings": 0
      },
      "readings": [],
      "isEmpty": true
    }
  }
}
```

#### Reading Request Payload (`POST /api/v1/readings`)
```json
{
  "readingDate": "2026-10-15",
  "timeSlot": "Morning (fasting)",
  "glucoseValue": 95
}
```
> Supported timeSlot inputs: Canonical strings (`"Morning (fasting)"`, `"After breakfast"`, `"After lunch"`, `"After dinner"`) or uppercase enum identifiers (`"MORNING"`, `"MORNING_FASTING"`, `"AFTER_BREAKFAST"`, `"AFTER_LUNCH"`, `"AFTER_DINNER"`). Field `value` is also accepted as an alias for `glucoseValue`.

#### Reading Success Response (`201 Created` / `200 OK`)
```json
{
  "success": true,
  "message": "Reading created successfully.",
  "data": {
    "reading": {
      "id": "7b82ef45-8bc3-4819-bf9d-f286821d3f9b",
      "userId": "d1e2f3a4-5678-90ab-cdef-1234567890ab",
      "readingDate": "2026-10-15",
      "timeSlot": "Morning (fasting)",
      "glucoseValue": 95,
      "value": 95,
      "createdAt": "2026-10-15T08:00:00.000Z",
      "updatedAt": "2026-10-15T08:00:00.000Z"
    }
  }
}
```

#### Paginated Readings Response (`GET /api/v1/readings?page=1&limit=20`)
```json
{
  "success": true,
  "data": {
    "readings": [ ... ]
  },
  "meta": {
    "total": 38,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
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
   - Atomic conditional transactions prevent race conditions during concurrent renewal requests, while transient PostgreSQL serialization conflicts (`P2034` / `40001`) are retried with bounded exponential backoff.
3. **Account Enumeration Defense**:
   - Authentication errors return generic messages (`"Invalid email or password."`) whether the email does not exist or the password is incorrect.
4. **Data Privacy & Structured Logging**:
   - Pino is configured with field-level redaction for credentials (`password`, `passwordHash`, `refreshToken`, `tokenHash`) and sensitive clinical entries (`glucoseValue`, `value`).
5. **Multi-Tenancy Isolation**:
   - Every reading query enforces `WHERE user_id = $userId`. Users cannot inspect, modify, or delete another patient's readings.
6. **Future Enhancements**:
   - Export reports to clinical PDF/CSV for consultation with healthcare providers.
   - Doctor role to view patient trends upon explicit patient authorization.
   - Push reminders for missing daily slots before bedtime.

