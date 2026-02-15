-- Migration 015: Fix primary election dates + add DC
-- Arizona HB 2022 (signed Feb 6, 2026) moved primary from Aug 4 to Jul 21.
-- DC was missing from the states table entirely.

-- Fix Arizona: Aug 4 → Jul 21 (HB 2022)
UPDATE calendar_events
SET event_date = '2026-07-21',
    description = 'Date moved from August 4 via HB 2022 (signed Feb 6, 2026).',
    updated_at = now()
WHERE state_id = (SELECT id FROM states WHERE abbr = 'AZ')
  AND event_type = 'primary'
  AND cycle_id = (SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true);

-- Add DC to states table (FIPS 11, 1 non-voting House delegate)
INSERT INTO states (name, abbr, fips, house_districts)
VALUES ('District of Columbia', 'DC', '11', 1)
ON CONFLICT (abbr) DO NOTHING;

-- Add DC primary
INSERT INTO calendar_events (cycle_id, state_id, event_type, event_date, title, source_url)
VALUES (
  (SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true),
  (SELECT id FROM states WHERE abbr = 'DC'),
  'primary',
  '2026-06-16',
  'District of Columbia Primary Election',
  'https://www.dcboe.org/elections/2026-elections'
)
ON CONFLICT (cycle_id, state_id, event_type, event_date) DO NOTHING;

-- Add DC general election (all other states got this from migration 009)
INSERT INTO calendar_events (cycle_id, state_id, event_type, event_date, title)
VALUES (
  (SELECT id FROM election_cycles WHERE year = 2026 AND is_active = true),
  (SELECT id FROM states WHERE abbr = 'DC'),
  'general',
  '2026-11-03',
  'District of Columbia General Election'
)
ON CONFLICT (cycle_id, state_id, event_type, event_date) DO NOTHING;
