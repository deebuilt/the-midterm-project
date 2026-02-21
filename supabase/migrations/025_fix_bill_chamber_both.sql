-- ============================================================
-- Migration 025: Fix chamber detection for cross-chamber bills
--
-- Migration 024 set chamber based on bill_number prefix alone.
-- Bills like H.R. 7148 (Laken Riley Act) that passed BOTH chambers
-- were marked 'house' even though they have Senate votes attached.
-- This fixes those to 'both'.
-- ============================================================

-- House-prefixed bills that also have Senate votes → 'both'
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

-- Senate-prefixed bills that also have House votes → 'both'
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
