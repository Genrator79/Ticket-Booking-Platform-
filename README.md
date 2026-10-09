# SeatForge — High-Concurrency Ticket Booking Platform

A production-style, interview-grade high-concurrency ticket booking engine built to demonstrate real backend engineering, distributed systems consistency, row-level locking, atomic holds, and zero double bookings under heavy load (10,000+ competing requests).

---

## 🏛️ System Architecture

```text
                         React Client
                              |
                    HTTP / WebSocket
                              |
                              v
                       Express API
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
         PostgreSQL         Redis           Socket.IO
             |                |
             |                v
             |             Job Queue
             |                |
             |                v
             |              Worker
             |
             v
       Permanent Business State
```

- **PostgreSQL**: Authoritative source of truth for seat states and financial booking records.
- **Redis**: Ephemeral seat holds with TTLs, response caching, and rate limiting.
- **Socket.IO**: Real-time event notifications pushed to show rooms (not the authoritative source of truth).
- **BullMQ Worker**: Background processing for decoupled notifications and reconciliation.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Axios
- **Backend**: Node.js v22, Express, TypeScript, Zod, CORS
- **Testing**: Jest, Supertest, k6
- **Architecture**: Modular Monorepo with npm workspaces

---

## 📁 Repository Structure

```text
.
├── client/                     # Frontend application (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/         # Reusable UI components (HealthStatus, etc.)
│   │   ├── services/           # Centralized Axios client & domain services
│   │   ├── types/              # TypeScript API interfaces
│   │   ├── App.tsx             # Main dashboard layout
│   │   └── main.tsx            # React application entrypoint
│   ├── package.json
│   └── vite.config.ts
│
├── server/                     # Backend API application (Express + TypeScript)
│   ├── src/
│   │   ├── config/             # Environment parsing & Zod schema validation
│   │   ├── controllers/        # HTTP handlers (health, etc.)
│   │   ├── middleware/         # Error handlers and security middleware
│   │   ├── routes/             # API routes
│   │   ├── app.ts              # Express application factory
│   │   └── index.ts            # Server entrypoint with graceful shutdown
│   ├── tests/                  # Integration tests (Supertest + Jest)
│   └── package.json
│
├── docs/                       # Comprehensive engineering documentation
│   ├── milestones/             # Detailed milestone reports (M01-M18)
│   │   └── M01-project-setup.md
│   └── solid/                  # SOLID principles implementation registry
│       └── SOLID.md
│
├── PROJECT_STATE.md            # Authoritative project progress and state tracker
├── PROJECT_LOG.md              # Chronological development log
├── package.json                # Root monorepo workspace configuration
└── README.md
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Servers
To run both backend and frontend concurrently:
```bash
# Terminal 1: Backend API (port 5001)
npm run dev:server

# Terminal 2: Frontend Client (port 5173)
npm run dev:client
```

### 3. Verify Health Check
- **API Health Endpoint**: `http://localhost:5001/api/health`
- **Frontend Dashboard**: `http://localhost:5173/`

### 4. Run Automated Tests
```bash
npm run test --workspace=server
```

### 5. Build for Production
```bash
npm run build
```

---

## 📋 Milestones Roadmap
- [x] **M01 — Project Setup** (Completed)
- [ ] **M02 — Database Design** (PostgreSQL schema, migrations, constraints)
- [ ] **M03 — Authentication** (JWT, bcrypt, protected routes)
- [ ] **M04 — Basic CRUD** (Movies, venues, screens, shows)
- [ ] **M05 — Basic Booking** (End-to-end booking flow)
- [ ] **M06 — Concurrency & Double-Booking Prevention** (`SELECT FOR UPDATE`, row-level locks)
- [ ] **M07 — Redis Setup** (Atomic operations, key management)
- [ ] **M08 — Temporary Seat Holds** (10-minute hold countdowns, reconciliation)
- [ ] **M09 — Payment Simulation** (Mock provider, state machine)
- [ ] **M10 — Idempotency** (Idempotency keys, retry resilience)
- [ ] **M11 — Socket.IO Real-Time Updates** (Show-specific broadcast rooms)
- [ ] **M12 — Background Workers** (BullMQ job queues)
- [ ] **M13 — Worker Reliability** (Exponential backoff, dead-letter queues)
- [ ] **M14 — Caching** (Cache-aside strategy, invalidation)
- [ ] **M15 — Rate Limiting** (Redis token bucket/sliding window)
- [ ] **M16 — Load Testing** (k6 benchmarks up to 10k VUs)
- [ ] **M17 — Failure Testing** (Chaos and crash resilience)
- [ ] **M18 — Docker, CI/CD, and Deployment** (Containerization, GitHub Actions)
