-- Migration 009: Calendar events table + seed 2026 primary dates
-- Stores election calendar events (primaries, runoffs, filing deadlines, etc.)
-- linked to states and election cycles.

-- ─── Enum ───

CREATE TYPE calendar_event_type AS ENUM (
  'primary',
  'runoff',
  'general',
  'filing_deadline',
  'registration_deadline',
  'early_voting_start',
  'early_voting_end',
  'other'
);

-- ─── Table ───

CREATE TABLE calendar_events (
  id              SERIAL PRIMARY KEY,
  cycle_id        INTEGER NOT NULL REFERENCES election_cycles(id),
  state_id        INTEGER NOT NULL REFERENCES states(id),
  event_type      calendar_event_type NOT NULL,
  event_date      DATE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  source_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, state_id, event_type, event_date)
);

-- ─── Indexes ───

CREATE INDEX idx_calendar_events_cycle ON calendar_events (cycle_id);
CREATE INDEX idx_calendar_events_state ON calendar_events (state_id);
CREATE INDEX idx_calendar_events_date  ON calendar_events (event_date);
CREATE INDEX idx_calendar_events_type  ON calendar_events (event_type);

-- ─── Trigger ───

CREATE TRIGGER trg_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS ───

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read: calendar_events" ON calendar_events
  FOR SELECT USING (true);

CREATE POLICY "Admin write: calendar_events" ON calendar_events
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ─── Seed: 2026 State Primary Dates ───
-- Sources: NCSL (ncsl.org/elections-and-campaigns/2026-state-primary-election-dates)
--          270toWin (270towin.com/2026-state-primary-calendar)

INSERT INTO calendar_events (cycle_id, state_id, event_type, event_date, title, source_url)
VALUES
  -- March 2026
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'AR'), 'primary', '2026-03-03', 'Arkansas Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'NC'), 'primary', '2026-03-03', 'North Carolina Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'TX'), 'primary', '2026-03-03', 'Texas Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'MS'), 'primary', '2026-03-10', 'Mississippi Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'IL'), 'primary', '2026-03-17', 'Illinois Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),

  -- May 2026
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'IN'), 'primary', '2026-05-05', 'Indiana Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'OH'), 'primary', '2026-05-05', 'Ohio Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'NE'), 'primary', '2026-05-12', 'Nebraska Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'WV'), 'primary', '2026-05-12', 'West Virginia Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'LA'), 'primary', '2026-05-16', 'Louisiana Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'AL'), 'primary', '2026-05-19', 'Alabama Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'GA'), 'primary', '2026-05-19', 'Georgia Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'ID'), 'primary', '2026-05-19', 'Idaho Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'KY'), 'primary', '2026-05-19', 'Kentucky Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'OR'), 'primary', '2026-05-19', 'Oregon Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'PA'), 'primary', '2026-05-19', 'Pennsylvania Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),

  -- June 2026
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'CA'), 'primary', '2026-06-02', 'California Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'IA'), 'primary', '2026-06-02', 'Iowa Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'MT'), 'primary', '2026-06-02', 'Montana Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'NJ'), 'primary', '2026-06-02', 'New Jersey Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'NM'), 'primary', '2026-06-02', 'New Mexico Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'SD'), 'primary', '2026-06-02', 'South Dakota Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'ME'), 'primary', '2026-06-09', 'Maine Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'NV'), 'primary', '2026-06-09', 'Nevada Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'ND'), 'primary', '2026-06-09', 'North Dakota Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'SC'), 'primary', '2026-06-09', 'South Carolina Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'OK'), 'primary', '2026-06-16', 'Oklahoma Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'VA'), 'primary', '2026-06-16', 'Virginia Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'MD'), 'primary', '2026-06-23', 'Maryland Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'NY'), 'primary', '2026-06-23', 'New York Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'UT'), 'primary', '2026-06-23', 'Utah Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'CO'), 'primary', '2026-06-30', 'Colorado Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),

  -- July 2026
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'AZ'), 'primary', '2026-08-04', 'Arizona Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),

  -- August 2026
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'KS'), 'primary', '2026-08-04', 'Kansas Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'MI'), 'primary', '2026-08-04', 'Michigan Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'MO'), 'primary', '2026-08-04', 'Missouri Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'WA'), 'primary', '2026-08-04', 'Washington Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'TN'), 'primary', '2026-08-06', 'Tennessee Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'HI'), 'primary', '2026-08-08', 'Hawaii Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'CT'), 'primary', '2026-08-11', 'Connecticut Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'MN'), 'primary', '2026-08-11', 'Minnesota Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'VT'), 'primary', '2026-08-11', 'Vermont Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'WI'), 'primary', '2026-08-11', 'Wisconsin Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'AK'), 'primary', '2026-08-18', 'Alaska Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'FL'), 'primary', '2026-08-18', 'Florida Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'WY'), 'primary', '2026-08-18', 'Wyoming Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),

  -- September 2026
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'MA'), 'primary', '2026-09-01', 'Massachusetts Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'NH'), 'primary', '2026-09-08', 'New Hampshire Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'RI'), 'primary', '2026-09-08', 'Rhode Island Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates'),
  ((SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true), (SELECT id FROM states WHERE abbr = 'DE'), 'primary', '2026-09-15', 'Delaware Primary Election', 'https://www.ncsl.org/elections-and-campaigns/2026-state-primary-election-dates');

-- ─── Seed: General Election for all 50 states ───

INSERT INTO calendar_events (cycle_id, state_id, event_type, event_date, title)
SELECT
  (SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true),
  id,
  'general',
  '2026-11-03',
  name || ' General Election'
FROM states;
