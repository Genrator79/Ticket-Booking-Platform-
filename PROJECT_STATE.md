# Project State

## Project
High-Concurrency Ticket Booking Platform (SeatForge)

## Current Milestone
M02 — Database Design

## Milestone Status
COMPLETED

## Current Task
Milestone M02 finalized, verified, and awaiting explicit user approval before starting M03.

## Task Checklist
- [x] M01 — Project Setup (Verified & Pushed to GitHub)
- [x] Configure PostgreSQL 16 environment & connection pool (`server/src/db/index.ts`)
- [x] Design and implement SQL migration files for core entities:
  - [x] users (`001_create_users_table.sql`)
  - [x] movies (`002_create_movies_table.sql`)
  - [x] venues & screens (`003_create_venues_and_screens_tables.sql`)
  - [x] seats - physical layout (`004_create_seats_table.sql`)
  - [x] shows (`005_create_shows_table.sql`)
  - [x] show_seats - per-show state with UNIQUE(show_id, seat_id) (`006_create_show_seats_table.sql`)
  - [x] bookings & booking_seats (`007_create_bookings_and_booking_seats_tables.sql`)
  - [x] payments (`008_create_payments_table.sql`)
- [x] Implement idempotent migration runner script (`database/migrate.ts`)
- [x] Create realistic seed data script (`database/seed/index.ts`)
- [x] Add npm scripts (`db:migrate`, `db:seed`, `db:reset`)
- [x] Verify foreign keys, check constraints, unique constraints, and compound indexes
- [x] Write automated database schema and constraint tests (`server/tests/db.test.ts`)
- [x] Extend health check to verify database connection live in backend & frontend
- [x] Document schema design in `docs/database/schema.md`, `M02-database-design.md`, and `docs/solid/SOLID.md`
- [x] Complete M02 verification and set awaiting approval

## Verified Results
- M01 Setup & GitHub Push: PASS (Remote synced at origin/main)
- PostgreSQL 16 Service: PASS (Running on localhost:5432)
- Database Pool & Health Check: PASS (`GET /api/health` reports `database: CONNECTED`)
- Frontend DB Connectivity Card: PASS (Verified with browser subagent showing `Database: CONNECTED`)
- Migration Execution & Idempotency: PASS (8 migrations applied, 0 duplicate runs)
- Seed Data Generation: PASS (4 users, 4 movies, 2 venues, 3 screens, 150 seats, 4 shows, 200 show_seats)
- Automated Tests (`npm test --workspace=server`): PASS (9/9 tests passed in 1.535s)
- Production Builds (`npm run build`): PASS (Zero errors)

## Current Blockers
None.

## Last Completed Action
Verified all M02 database migrations, seeding, constraints, automated tests, documentation, and frontend integration.

## Exact Next Action
Wait for user approval to start M03 (Authentication: user registration, login, JWT issuance, password hashing, auth middleware, protected `/me` endpoint, and tests).

## Files Changed
- `database/migrations/001_create_users_table.sql`
- `database/migrations/002_create_movies_table.sql`
- `database/migrations/003_create_venues_and_screens_tables.sql`
- `database/migrations/004_create_seats_table.sql`
- `database/migrations/005_create_shows_table.sql`
- `database/migrations/006_create_show_seats_table.sql`
- `database/migrations/007_create_bookings_and_booking_seats_tables.sql`
- `database/migrations/008_create_payments_table.sql`
- `database/migrate.ts`
- `database/seed/index.ts`
- `server/src/db/index.ts`
- `server/src/config/env.ts`
- `server/src/controllers/health.controller.ts`
- `server/tests/db.test.ts`
- `server/tests/health.test.ts`
- `server/package.json`
- `server/.env`
- `client/src/types/api.ts`
- `client/src/components/HealthStatus.tsx`
- `docs/database/schema.md`
- `docs/milestones/M02-database-design.md`
- `docs/solid/SOLID.md`
- `package.json`
- `PROJECT_STATE.md`
- `PROJECT_LOG.md`

## Important Decisions
- **Physical vs Show Seats**: `seats` represents the static physical layout; `show_seats` represents mutable availability for a specific scheduled show.
- **Relational Invariant**: `UNIQUE(show_id, seat_id)` physically prevents duplicate seat creation for a show.
- **Transactional Safety**: Implemented `withTransaction` in `server/src/db/index.ts` guaranteeing automatic rollback on errors.
- **Optimistic Versioning**: Added `version` column to `show_seats` alongside row-level locking support for M06.

## Next Milestone
M03 — Authentication

## Approval Status
AWAITING_USER_APPROVAL: YES
