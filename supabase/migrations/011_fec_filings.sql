-- Migration 011: FEC filings staging table
-- Raw FEC candidate data — staging area before primaries.
-- After primary, admin promotes winners to candidates table via promoted_to_candidate_id.

CREATE TABLE fec_filings (
  id                        SERIAL PRIMARY KEY,
  fec_candidate_id          TEXT NOT NULL,
  cycle_id                  INTEGER NOT NULL REFERENCES election_cycles(id),
  state_id                  INTEGER NOT NULL REFERENCES states(id),
  name                      TEXT NOT NULL,
  first_name                TEXT NOT NULL,
  last_name                 TEXT NOT NULL,
  party                     TEXT NOT NULL,
  office                    TEXT NOT NULL CHECK (office IN ('S', 'H')),
  district_number           INTEGER,
  is_incumbent              BOOLEAN NOT NULL DEFAULT false,
  funds_raised              NUMERIC(12,2) NOT NULL DEFAULT 0,
  funds_spent               NUMERIC(12,2) NOT NULL DEFAULT 0,
  cash_on_hand              NUMERIC(12,2) NOT NULL DEFAULT 0,
  promoted_to_candidate_id  INTEGER REFERENCES candidates(id),
  last_synced_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, fec_candidate_id),
  CHECK (funds_raised >= 0),
  CHECK (funds_spent >= 0)
);

CREATE INDEX idx_fec_filings_cycle ON fec_filings (cycle_id);
CREATE INDEX idx_fec_filings_state ON fec_filings (state_id);
CREATE INDEX idx_fec_filings_funds ON fec_filings (funds_raised DESC);
CREATE INDEX idx_fec_filings_promoted ON fec_filings (promoted_to_candidate_id);

-- RLS
ALTER TABLE fec_filings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read: fec_filings" ON fec_filings
  FOR SELECT USING (true);

CREATE POLICY "Admin write: fec_filings" ON fec_filings
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
