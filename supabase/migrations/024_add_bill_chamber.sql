-- ============================================================
-- Migration 024: Add chamber column to votes (bills) table
--
-- Distinguishes Senate vs House votes so the admin UI can
-- scope its delete/re-insert to only the relevant chamber,
-- preventing cross-chamber data loss.
-- ============================================================

-- 1. Create the enum type (named bill_chamber to avoid collision
--    with the existing 'chamber' enum on government_bodies)
CREATE TYPE bill_chamber AS ENUM ('senate', 'house', 'both');

-- 2. Add the column as nullable (existing rows default to NULL)
ALTER TABLE votes ADD COLUMN chamber bill_chamber;

-- 3. Backfill from bill_number prefix heuristics
--    House bills: H.R., H.J.Res., H.Con.Res., H.Res.
UPDATE votes
SET chamber = 'house'
WHERE bill_number IS NOT NULL
  AND (
    bill_number ILIKE 'H.R.%'
    OR bill_number ILIKE 'H.J.Res.%'
    OR bill_number ILIKE 'H.Con.Res.%'
    OR bill_number ILIKE 'H.Res.%'
  );

--    Senate bills: S., S.J.Res., S.Con.Res., S.Res.
UPDATE votes
SET chamber = 'senate'
WHERE bill_number IS NOT NULL
  AND chamber IS NULL
  AND (
    bill_number ILIKE 'S.%'
    OR bill_number ILIKE 'S.J.Res.%'
    OR bill_number ILIKE 'S.Con.Res.%'
    OR bill_number ILIKE 'S.Res.%'
  );

-- 4. For remaining NULLs: infer from candidate_votes → candidates → government_bodies
--    If a bill has votes from Senate incumbents, mark as senate
UPDATE votes v
SET chamber = 'senate'
WHERE v.chamber IS NULL
  AND EXISTS (
    SELECT 1
    FROM candidate_votes cv
    JOIN candidates c ON c.id = cv.candidate_id
    JOIN government_bodies gb ON gb.id = c.body_id
    WHERE cv.vote_id = v.id
      AND gb.slug = 'us-senate'
  );

--    If a bill has votes from House incumbents, mark as house
UPDATE votes v
SET chamber = 'house'
WHERE v.chamber IS NULL
  AND EXISTS (
    SELECT 1
    FROM candidate_votes cv
    JOIN candidates c ON c.id = cv.candidate_id
    JOIN government_bodies gb ON gb.id = c.body_id
    WHERE cv.vote_id = v.id
      AND gb.slug = 'us-house'
  );

-- 5. Upgrade to 'both' if a bill has votes from BOTH chambers
--    (e.g. H.R. bills that also passed the Senate)
UPDATE votes v
SET chamber = 'both'
WHERE v.chamber = 'house'
  AND EXISTS (
    SELECT 1
    FROM candidate_votes cv
    JOIN candidates c ON c.id = cv.candidate_id
    JOIN government_bodies gb ON gb.id = c.body_id
    WHERE cv.vote_id = v.id
      AND gb.slug = 'us-senate'
  );

UPDATE votes v
SET chamber = 'both'
WHERE v.chamber = 'senate'
  AND EXISTS (
    SELECT 1
    FROM candidate_votes cv
    JOIN candidates c ON c.id = cv.candidate_id
    JOIN government_bodies gb ON gb.id = c.body_id
    WHERE cv.vote_id = v.id
      AND gb.slug = 'us-house'
  );

-- 6. Remaining NULLs (no votes, ambiguous bill_number) stay NULL.
--    The application treats NULL as 'senate' for backward compat.

-- 7. Create index for filtering
CREATE INDEX idx_votes_chamber ON votes (chamber);
