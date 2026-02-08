-- ============================================================
-- Migration 006: Ballot Measures
-- State-level ballot measures for federal midterm elections
-- Comprehensive tracking — all measures per state per cycle
-- ============================================================

-- Status enum for ballot measures
CREATE TYPE ballot_measure_status AS ENUM (
  'proposed',
  'qualified',
  'passed',
  'failed',
  'withdrawn'
);

-- Category enum for ballot measures
CREATE TYPE ballot_measure_category AS ENUM (
  'constitutional_amendment',
  'statute',
  'bond',
  'veto_referendum',
  'initiative',
  'legislative_referral',
  'other'
);

-- Main table
CREATE TABLE ballot_measures (
  id              SERIAL PRIMARY KEY,
  cycle_id        INTEGER NOT NULL REFERENCES election_cycles(id),
  state_id        INTEGER NOT NULL REFERENCES states(id),
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL,
  short_title     TEXT,
  description     TEXT NOT NULL,
  category        ballot_measure_category NOT NULL DEFAULT 'initiative',
  yes_means       TEXT,
  no_means        TEXT,
  status          ballot_measure_status NOT NULL DEFAULT 'proposed',
  election_date   DATE,
  source_url      TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, state_id, slug)
);

-- Indexes
CREATE INDEX idx_ballot_measures_cycle ON ballot_measures (cycle_id);
CREATE INDEX idx_ballot_measures_state ON ballot_measures (state_id);
CREATE INDEX idx_ballot_measures_status ON ballot_measures (status);

-- Updated_at trigger (reuses existing function from migration 001)
CREATE TRIGGER trg_ballot_measures_updated_at
  BEFORE UPDATE ON ballot_measures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE ballot_measures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read: ballot_measures" ON ballot_measures
  FOR SELECT USING (true);

CREATE POLICY "Admin write: ballot_measures" ON ballot_measures
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
