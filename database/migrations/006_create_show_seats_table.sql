-- Migration: 006_create_show_seats_table.sql
-- Purpose: Per-show seat state and real-time availability.
-- Architectural Note: 
-- Physical seat definitions in `seats` are immutable layout blueprints.
-- `show_seats` represents the mutable booking state for a specific physical seat at a specific show screening.
-- A composite UNIQUE(show_id, seat_id) constraint guarantees at the database level that no duplicate seat record can exist for a given show.

CREATE TABLE IF NOT EXISTS show_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'HELD', 'BOOKED')),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_show_seat UNIQUE(show_id, seat_id)
);

-- High-concurrency indexing:
-- 1. Essential for filtering available/held/booked seats by show in real-time
CREATE INDEX IF NOT EXISTS idx_show_seats_show_status ON show_seats(show_id, status);

-- 2. Fast lookup by physical seat
CREATE INDEX IF NOT EXISTS idx_show_seats_seat_id ON show_seats(seat_id);
