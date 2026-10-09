# Milestone M02 — Database Design

## 1. Goal
Design and implement a resilient, normalized PostgreSQL database schema engineered for high-concurrency ticket bookings, establish automated migration and seeding systems, enforce relational integrity through foreign keys, uniqueness, and check constraints, and verify database operations through automated tests.

## 2. Why the Milestone Exists
In high-concurrency ticketing systems, application-level checks are vulnerable to race conditions. The relational database is the single authoritative source of truth for seat ownership and booking finality. M02 establishes the foundational relational schema, ensuring that concurrency protections (`show_seats` separation, compound uniqueness constraints, index coverage) are physically baked into the data layer before application business logic is built.

## 3. Scope
- PostgreSQL 16 local environment setup and configuration.
- Database connection pool (`server/src/db/index.ts`) with transaction helpers and error isolation.
- 8 discrete SQL migration files covering: `users`, `movies`, `venues`, `screens`, `seats`, `shows`, `show_seats`, `bookings`, `booking_seats`, and `payments`.
- Robust migration runner (`database/migrate.ts`) with idempotent execution and reset support.
- Realistic seed script (`database/seed/index.ts`) with bcrypt hashed users, sample movies, venues, screens, physical seat grids, scheduled shows, and 200 initial `show_seats`.
- Integration and constraint verification tests (`server/tests/db.test.ts`).
- Health probe extension verifying live database status.

## 4. Tasks and Statuses
| Task | Description | Status |
|---|---|---|
| T01 | PostgreSQL 16 installation and service initialization | `VERIFIED` |
| T02 | Database creation (`ticket_booking`) and connection pool implementation | `VERIFIED` |
| T03 | Core entity migrations (001-008) created | `VERIFIED` |
| T04 | Separation of physical `seats` and show-specific `show_seats` | `VERIFIED` |
| T05 | Uniqueness and check constraints applied | `VERIFIED` |
| T06 | High-concurrency compound indexes created | `VERIFIED` |
| T07 | Idempotent migration runner (`database/migrate.ts`) implemented | `VERIFIED` |
| T08 | Realistic seed script (`database/seed/index.ts`) implemented | `VERIFIED` |
| T09 | Automated test suite (`server/tests/db.test.ts`) passing | `VERIFIED` |
| T10 | Frontend health card updated with live database connectivity | `VERIFIED` |
| T11 | Comprehensive schema documentation (`docs/database/schema.md`) | `VERIFIED` |

## 5. Files Created or Modified
- [`database/migrations/001_create_users_table.sql`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/database/migrations/001_create_users_table.sql): Users schema with pgcrypto extension and email index.
- [`database/migrations/002_create_movies_table.sql`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/database/migrations/002_create_movies_table.sql): Movies catalog with genre and title indexes.
- [`database/migrations/003_create_venues_and_screens_tables.sql`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/database/migrations/003_create_venues_and_screens_tables.sql): Venues and auditorium screens with uniqueness on `(venue_id, name)`.
- [`database/migrations/004_create_seats_table.sql`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/database/migrations/004_create_seats_table.sql): Physical seat blueprint per screen with `UNIQUE(screen_id, seat_label)`.
- [`database/migrations/005_create_shows_table.sql`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/database/migrations/005_create_shows_table.sql): Shows timetable with `CHECK (end_time > start_time)`.
- [`database/migrations/006_create_show_seats_table.sql`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/database/migrations/006_create_show_seats_table.sql): Mutable show seat state with `UNIQUE(show_id, seat_id)` and concurrency indexes.
- [`database/migrations/007_create_bookings_and_booking_seats_tables.sql`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/database/migrations/007_create_bookings_and_booking_seats_tables.sql): Bookings and itemized booking seats association.
- [`database/migrations/008_create_payments_table.sql`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/database/migrations/008_create_payments_table.sql): Financial transactions attached to bookings.
- [`database/migrate.ts`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/database/migrate.ts): Migration runner tracking applied scripts in `schema_migrations`.
- [`database/seed/index.ts`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/database/seed/index.ts): Realistic development dataset generator.
- [`server/src/db/index.ts`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/server/src/db/index.ts): Connection pool, query runner, and `withTransaction` helper.
- [`server/src/controllers/health.controller.ts`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/server/src/controllers/health.controller.ts): Reports database connectivity status.
- [`server/tests/db.test.ts`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/server/tests/db.test.ts): Schema, constraint, and transaction integration tests.
- [`docs/database/schema.md`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/docs/database/schema.md): Detailed schema specifications.
- [`client/src/components/HealthStatus.tsx`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/client/src/components/HealthStatus.tsx): Displays live database connection badge.

## 6. Architecture Decisions
1. **Separation of Physical Seats and Show Seats**:
   - `seats` defines the immutable physical geometry of a cinema screen.
   - `show_seats` represents the volatile reservation state for that seat during a specific scheduled show.
   - This ensures multiple screenings of the same screen do not collide.
2. **Database-Level Invariants**:
   - `UNIQUE(show_id, seat_id)` guarantees at the relational engine level that duplicate seat records can never be created for a single show.
   - `CHECK (status IN ('AVAILABLE', 'HELD', 'BOOKED'))` prevents invalid booking state corruptions.
3. **Optimistic Versioning Preparation**:
   - `show_seats` includes an integer `version` column alongside row-level locking capabilities (`SELECT ... FOR UPDATE`), enabling both optimistic and pessimistic concurrency strategies.
4. **Idempotency Readiness**:
   - `bookings` and `payments` include a unique `idempotency_key` column for M10.

## 7. Tests and Actual Results

### Automated Integration & Schema Tests (Supertest + Jest)
Command: `npm test --workspace=server`
```text
PASS tests/db.test.ts
  Database Schema & Integrity Verification (M02)
    ✓ should establish connection and execute simple query (12 ms)
    ✓ should confirm all core entity tables exist (18 ms)
    ✓ should enforce UNIQUE(show_id, seat_id) constraint on show_seats (9 ms)
    ✓ should enforce status check constraint on show_seats (5 ms)
    ✓ should enforce foreign key constraint on show_seats (4 ms)
    ✓ should rollback transaction on error in withTransaction helper (8 ms)
    ✓ should commit transaction on success in withTransaction helper (9 ms)

PASS tests/health.test.ts
  Health Check & Basic API Routing
    ✓ GET /api/health should return 200 OK with system status (21 ms)
    ✓ GET /api/nonexistent-route should return 404 Route not found (2 ms)

Test Suites: 2 passed, 2 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        1.535 s
```

### Migration Execution
Command: `npm run db:migrate`
```text
========================================
 Database Migration Runner
 Target: postgresql://localhost:5432/ticket_booking
========================================
 [RUN]  Applying migration: 001_create_users_table.sql...
 [DONE] Successfully applied 001_create_users_table.sql
 ...
 [RUN]  Applying migration: 008_create_payments_table.sql...
 [DONE] Successfully applied 008_create_payments_table.sql

Migration process finished. 8 new migration(s) applied.
```

### Seeding Execution
Command: `npm run db:seed`
```text
Seeding users...
 Seeded 4 users.
Seeding movies...
 Seeded 4 movies.
Seeding venues...
 Seeded 2 venues.
Seeding screens...
 Seeded 3 screens.
Seeding physical seat layouts (50 seats per screen)...
 Generated physical seats layout for all screens.
Scheduling shows...
 Seeded 4 shows.
Generating show-specific seat availability (show_seats)...
 Seeded 200 show_seats records across 4 shows.
```

### Live Frontend Health Check
- Verified via browser subagent: Database card displays **`CONNECTED`** with live latency updates.

## 8. Problems Encountered and Fixes
- **Issue**: Accidental artifact string appended to `server/package.json` causing npm json parse failure.
- **Fix**: Inspected and sanitized `server/package.json`, re-installed dependencies.
- **Issue**: Jest open handle warning during test teardown because database pool remained connected.
- **Fix**: Added `closePool()` helper in `server/src/db/index.ts` and called `afterAll(async () => { await closePool(); })` in test files.

## 9. Completion Checklist
- [x] Configure PostgreSQL environment
- [x] Create migrations for all 8 core entities
- [x] Implement physical seat vs show-seat separation
- [x] Add uniqueness constraints, foreign keys, and check constraints
- [x] Implement high-concurrency compound indexes
- [x] Implement idempotent migration runner (`database/migrate.ts`)
- [x] Implement realistic development dataset seeder (`database/seed/index.ts`)
- [x] Add npm scripts (`db:migrate`, `db:seed`, `db:reset`)
- [x] Verify database transaction rollback and commit behavior
- [x] Verify database constraint violations reject invalid records
- [x] Pass all automated test suites
- [x] Update documentation and SOLID registry
- [x] No premature implementation of M03+ features (Auth endpoints, Redis holds, or Booking APIs)

## 10. Final Status
**COMPLETED** — Ready for user review and explicit approval before starting M03 (Authentication).
