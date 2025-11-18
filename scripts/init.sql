-- Development database bootstrap script for PostgreSQL
-- Extend or replace these statements with your own seed data as needed.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Example schema placeholder (safe to remove)
CREATE TABLE IF NOT EXISTS dev_healthcheck (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  note text
);
