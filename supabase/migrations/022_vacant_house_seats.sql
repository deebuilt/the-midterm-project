-- ============================================================
-- Add 3 Vacant House Seats (2026)
-- CA-1:  Doug LaMalfa (R) died January 6, 2026
-- GA-14: Marjorie Taylor Greene (R) resigned January 5, 2026
-- NJ-11: Mikie Sherrill (D) resigned November 20, 2025
-- ============================================================
-- Idempotent: WHERE NOT EXISTS throughout.
-- (ON CONFLICT won't catch House district duplicates because senate_class
-- is NULL and Postgres treats NULL != NULL in unique constraints.)
-- No race_candidates rows — that's what makes them vacant.

-- ---------- DISTRICTS ----------

INSERT INTO districts (state_id, body_id, number, name)
SELECT s.id, gb.id, v.num, v.dname
FROM (VALUES
  ('CA', 1,  'CA House District 1'),
  ('GA', 14, 'GA House District 14'),
  ('NJ', 11, 'NJ House District 11')
) AS v(abbr, num, dname)
JOIN states s ON s.abbr = v.abbr
CROSS JOIN (SELECT id FROM government_bodies WHERE slug = 'us-house') gb
WHERE NOT EXISTS (
  SELECT 1 FROM districts d
  WHERE d.state_id = s.id
  AND d.body_id = gb.id
  AND d.number = v.num
);

-- ---------- RACES ----------

INSERT INTO races (cycle_id, district_id, is_special_election, is_open_seat, general_date)
SELECT
  (SELECT id FROM election_cycles WHERE name = '2026 Midterms'),
  d.id,
  true,
  true,
  '2026-11-03'::date
FROM districts d
JOIN government_bodies gb ON gb.id = d.body_id AND gb.slug = 'us-house'
JOIN states s ON s.id = d.state_id
WHERE (
    (s.abbr = 'CA' AND d.number = 1)
    OR (s.abbr = 'GA' AND d.number = 14)
    OR (s.abbr = 'NJ' AND d.number = 11)
  )
  AND NOT EXISTS (
    SELECT 1 FROM races r
    WHERE r.district_id = d.id
    AND r.cycle_id = (SELECT id FROM election_cycles WHERE name = '2026 Midterms')
  );
