-- Migration 012: Automation infrastructure
-- Adds sync_logs table, automation_config singleton, and new fec_filings columns

-- ═══════════════════════════════════════════
-- 1. sync_logs — audit trail for every sync run
-- ═══════════════════════════════════════════

CREATE TABLE sync_logs (
  id                  SERIAL PRIMARY KEY,
  sync_type           TEXT NOT NULL DEFAULT 'fec_auto',
  status              TEXT NOT NULL DEFAULT 'running',
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  states_synced       TEXT[],
  filings_created     INTEGER NOT NULL DEFAULT 0,
  filings_updated     INTEGER NOT NULL DEFAULT 0,
  filings_deactivated INTEGER NOT NULL DEFAULT 0,
  api_requests        INTEGER NOT NULL DEFAULT 0,
  error_message       TEXT,
  details             JSONB,
  triggered_rebuild   BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_sync_logs_started ON sync_logs (started_at DESC);

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read: sync_logs"
  ON sync_logs FOR SELECT USING (true);

CREATE POLICY "Admin write: sync_logs"
  ON sync_logs FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Service role write: sync_logs"
  ON sync_logs FOR ALL USING (auth.role() = 'service_role');


-- ═══════════════════════════════════════════
-- 2. automation_config — singleton configuration
-- ═══════════════════════════════════════════

CREATE TABLE automation_config (
  id                 INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  fec_sync_enabled   BOOLEAN NOT NULL DEFAULT true,
  lookahead_days     INTEGER NOT NULL DEFAULT 60,
  lookback_days      INTEGER NOT NULL DEFAULT 30,
  min_funds_raised   INTEGER NOT NULL DEFAULT 5000,
  major_parties_only BOOLEAN NOT NULL DEFAULT true,
  active_only        BOOLEAN NOT NULL DEFAULT true,
  vercel_deploy_hook TEXT,
  webhook_secret     TEXT,
  last_sync_at       TIMESTAMPTZ,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO automation_config (id) VALUES (1);

ALTER TABLE automation_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read: automation_config"
  ON automation_config FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin write: automation_config"
  ON automation_config FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Service role access: automation_config"
  ON automation_config FOR ALL USING (auth.role() = 'service_role');


-- ═══════════════════════════════════════════
-- 3. fec_filings — new columns
-- ═══════════════════════════════════════════

ALTER TABLE fec_filings ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE fec_filings ADD COLUMN IF NOT EXISTS incumbent_challenge TEXT;
ALTER TABLE fec_filings ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
ALTER TABLE fec_filings ADD COLUMN IF NOT EXISTS fec_candidate_status TEXT;

CREATE INDEX IF NOT EXISTS idx_fec_filings_active ON fec_filings (is_active);
