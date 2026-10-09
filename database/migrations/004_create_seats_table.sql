-- Migration: 004_create_seats_table.sql
-- Purpose: Defines physical seats for each screen.
-- Architectural Note: Physical seats do NOT hold show-specific availability states.

CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id UUID NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  row VARCHAR(10) NOT NULL,
  number INTEGER NOT NULL CHECK (number > 0),
  seat_label VARCHAR(20) NOT NULL,
  tier VARCHAR(50) NOT NULL DEFAULT 'STANDARD' CHECK (tier IN ('STANDARD', 'PREMIUM', 'VIP')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_screen_seat_label UNIQUE(screen_id, seat_label)
);

CREATE INDEX IF NOT EXISTS idx_seats_screen_id ON seats(screen_id);
CREATE INDEX IF NOT EXISTS idx_seats_screen_row ON seats(screen_id, row);
