-- ============================================================
-- Migration 020: Add body_id FK to candidates, drop role_title
--
-- Replaces free-text role_title with a proper FK to government_bodies.
-- Adds is_retiring boolean and term_start_year integer.
-- Adds member_title to government_bodies for display purposes.
-- ============================================================

-- 1. Add member_title to government_bodies (display name for members)
ALTER TABLE government_bodies ADD COLUMN member_title TEXT;

UPDATE government_bodies SET member_title = 'U.S. Senator' WHERE slug = 'us-senate';
UPDATE government_bodies SET member_title = 'U.S. Representative' WHERE slug = 'us-house';
UPDATE government_bodies SET member_title = 'Governor' WHERE slug = 'governor';

-- 2. Add structured columns to candidates
ALTER TABLE candidates
  ADD COLUMN body_id INTEGER REFERENCES government_bodies(id),
  ADD COLUMN is_retiring BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN term_start_year INTEGER;

CREATE INDEX idx_candidates_body ON candidates (body_id);

-- 3. Backfill body_id from existing role_title text
UPDATE candidates SET body_id = (SELECT id FROM government_bodies WHERE slug = 'us-senate')
  WHERE lower(role_title) LIKE '%senator%';

UPDATE candidates SET body_id = (SELECT id FROM government_bodies WHERE slug = 'governor')
  WHERE lower(role_title) LIKE '%governor%';

UPDATE candidates SET body_id = (SELECT id FROM government_bodies WHERE slug = 'us-house')
  WHERE lower(role_title) LIKE '%representative%' OR lower(role_title) LIKE '%rep.%';

-- 4. Backfill is_retiring from role_title
UPDATE candidates SET is_retiring = true
  WHERE lower(role_title) LIKE '%retiring%';

-- 5. Backfill term_start_year where "(since YYYY)" pattern exists
UPDATE candidates SET term_start_year =
  CAST(substring(role_title FROM '\(since (\d{4})\)') AS INTEGER)
  WHERE role_title ~ '\(since \d{4}\)';

-- 6. Drop role_title — all logic now uses body_id, is_retiring, term_start_year
ALTER TABLE candidates DROP COLUMN role_title;
