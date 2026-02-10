-- ============================================================
-- Governor Races (2026 Midterms)
-- 36 states have governor races in 2026
-- Ratings from Cook Political Report + Sabato's Crystal Ball
-- ============================================================

-- ---------- GOVERNOR DISTRICTS ----------
-- One "district" per state that has a governor race, linked to the governor body

INSERT INTO districts (state_id, body_id, name) VALUES
  -- Term-limited / Retiring Republican governors (9 + 1 retiring)
  ((SELECT id FROM states WHERE abbr='AL'), (SELECT id FROM government_bodies WHERE slug='governor'), 'AL Governor'),
  ((SELECT id FROM states WHERE abbr='AK'), (SELECT id FROM government_bodies WHERE slug='governor'), 'AK Governor'),
  ((SELECT id FROM states WHERE abbr='FL'), (SELECT id FROM government_bodies WHERE slug='governor'), 'FL Governor'),
  ((SELECT id FROM states WHERE abbr='GA'), (SELECT id FROM government_bodies WHERE slug='governor'), 'GA Governor'),
  ((SELECT id FROM states WHERE abbr='OH'), (SELECT id FROM government_bodies WHERE slug='governor'), 'OH Governor'),
  ((SELECT id FROM states WHERE abbr='OK'), (SELECT id FROM government_bodies WHERE slug='governor'), 'OK Governor'),
  ((SELECT id FROM states WHERE abbr='SC'), (SELECT id FROM government_bodies WHERE slug='governor'), 'SC Governor'),
  ((SELECT id FROM states WHERE abbr='TN'), (SELECT id FROM government_bodies WHERE slug='governor'), 'TN Governor'),
  ((SELECT id FROM states WHERE abbr='WY'), (SELECT id FROM government_bodies WHERE slug='governor'), 'WY Governor'),
  ((SELECT id FROM states WHERE abbr='IA'), (SELECT id FROM government_bodies WHERE slug='governor'), 'IA Governor'),

  -- Term-limited / Retiring Democratic governors (6 + 2 retiring)
  ((SELECT id FROM states WHERE abbr='CA'), (SELECT id FROM government_bodies WHERE slug='governor'), 'CA Governor'),
  ((SELECT id FROM states WHERE abbr='CO'), (SELECT id FROM government_bodies WHERE slug='governor'), 'CO Governor'),
  ((SELECT id FROM states WHERE abbr='KS'), (SELECT id FROM government_bodies WHERE slug='governor'), 'KS Governor'),
  ((SELECT id FROM states WHERE abbr='ME'), (SELECT id FROM government_bodies WHERE slug='governor'), 'ME Governor'),
  ((SELECT id FROM states WHERE abbr='MI'), (SELECT id FROM government_bodies WHERE slug='governor'), 'MI Governor'),
  ((SELECT id FROM states WHERE abbr='NM'), (SELECT id FROM government_bodies WHERE slug='governor'), 'NM Governor'),
  ((SELECT id FROM states WHERE abbr='WI'), (SELECT id FROM government_bodies WHERE slug='governor'), 'WI Governor'),
  ((SELECT id FROM states WHERE abbr='MN'), (SELECT id FROM government_bodies WHERE slug='governor'), 'MN Governor'),

  -- Incumbents running (Republican)
  ((SELECT id FROM states WHERE abbr='AR'), (SELECT id FROM government_bodies WHERE slug='governor'), 'AR Governor'),
  ((SELECT id FROM states WHERE abbr='ID'), (SELECT id FROM government_bodies WHERE slug='governor'), 'ID Governor'),
  ((SELECT id FROM states WHERE abbr='NE'), (SELECT id FROM government_bodies WHERE slug='governor'), 'NE Governor'),
  ((SELECT id FROM states WHERE abbr='NV'), (SELECT id FROM government_bodies WHERE slug='governor'), 'NV Governor'),
  ((SELECT id FROM states WHERE abbr='NH'), (SELECT id FROM government_bodies WHERE slug='governor'), 'NH Governor'),
  ((SELECT id FROM states WHERE abbr='SD'), (SELECT id FROM government_bodies WHERE slug='governor'), 'SD Governor'),
  ((SELECT id FROM states WHERE abbr='TX'), (SELECT id FROM government_bodies WHERE slug='governor'), 'TX Governor'),
  ((SELECT id FROM states WHERE abbr='VT'), (SELECT id FROM government_bodies WHERE slug='governor'), 'VT Governor'),

  -- Incumbents running (Democratic)
  ((SELECT id FROM states WHERE abbr='AZ'), (SELECT id FROM government_bodies WHERE slug='governor'), 'AZ Governor'),
  ((SELECT id FROM states WHERE abbr='CT'), (SELECT id FROM government_bodies WHERE slug='governor'), 'CT Governor'),
  ((SELECT id FROM states WHERE abbr='HI'), (SELECT id FROM government_bodies WHERE slug='governor'), 'HI Governor'),
  ((SELECT id FROM states WHERE abbr='IL'), (SELECT id FROM government_bodies WHERE slug='governor'), 'IL Governor'),
  ((SELECT id FROM states WHERE abbr='MD'), (SELECT id FROM government_bodies WHERE slug='governor'), 'MD Governor'),
  ((SELECT id FROM states WHERE abbr='MA'), (SELECT id FROM government_bodies WHERE slug='governor'), 'MA Governor'),
  ((SELECT id FROM states WHERE abbr='NY'), (SELECT id FROM government_bodies WHERE slug='governor'), 'NY Governor'),
  ((SELECT id FROM states WHERE abbr='OR'), (SELECT id FROM government_bodies WHERE slug='governor'), 'OR Governor'),
  ((SELECT id FROM states WHERE abbr='PA'), (SELECT id FROM government_bodies WHERE slug='governor'), 'PA Governor'),
  ((SELECT id FROM states WHERE abbr='RI'), (SELECT id FROM government_bodies WHERE slug='governor'), 'RI Governor')
ON CONFLICT (state_id, body_id, number, senate_class) DO NOTHING;


-- ---------- GOVERNOR RACES ----------

-- Competitive races (Toss-up through Lean)
INSERT INTO races (cycle_id, district_id, rating, is_special_election, is_open_seat, general_date, why_competitive)
SELECT
  (SELECT id FROM election_cycles WHERE name = '2026 Midterms'),
  d.id,
  v.rating::race_rating,
  false,
  v.is_open,
  '2026-11-03'::date,
  v.why_competitive
FROM (VALUES
  -- TOSS-UPS
  ('GA Governor', 'Toss-up', true, 'Open seat — Kemp term-limited. Competitive GOP primary (Chris Carr, Burt Jones, Raffensperger). Democrat Keisha Lance Bottoms running.'),
  ('MI Governor', 'Toss-up', true, 'Open seat — Whitmer term-limited. Crowded Dem primary (Jocelyn Benson, Garlin Gilchrist). Independent Mike Duggan (Detroit mayor) could be spoiler. Trump won MI in 2024.'),
  ('NV Governor', 'Toss-up', false, 'Lombardo (R) defending first term. AG Aaron Ford (D) challenging. Medicaid and economy central issues.'),
  ('WI Governor', 'Toss-up', true, 'Open seat — Evers retiring. Large Dem primary (Josh Kaul, Sara Rodriguez, Mandela Barnes). Tom Tiffany (R) leading GOP field. Trump narrowly won WI.'),
  ('AZ Governor', 'Toss-up', false, 'Hobbs (D) won by only 17K votes in 2022. Trump won the state in 2024. Competitive GOP primary (Andy Biggs, Karrin Taylor Robson).'),

  -- LEAN R
  ('IA Governor', 'Lean R', true, 'Open seat — Reynolds retiring. Rob Sand (D) is a strong statewide candidate. Last Dem governor elected in Iowa: 2006.'),
  ('KS Governor', 'Lean R', true, 'Open seat — Kelly (D) term-limited. Red state that elected a Democrat governor twice. GOP sees pickup opportunity.'),

  -- LEAN D
  ('ME Governor', 'Lean D', true, 'Open seat — Mills (D) term-limited. Blue-leaning state but open seats are always more competitive.'),
  ('NM Governor', 'Lean D', true, 'Open seat — Lujan Grisham (D) term-limited. Blue state trending slightly more competitive.'),
  ('NY Governor', 'Lean D', false, 'Hochul (D) defending. Mike Lawler (R-NY17) may challenge. Hochul had a closer-than-expected 2022 win.'),
  ('PA Governor', 'Lean D', false, 'Shapiro (D) very popular (~60% approval). Seen as 2028 presidential contender. Faces Treasurer Stacy Garrity (R).'),
  ('RI Governor', 'Lean D', false, 'McKee (D) defending. Small-state race that could get competitive.'),
  ('MN Governor', 'Lean D', true, 'Surprise open seat — Walz dropped out Jan 2026 amid welfare-fraud scandal. Amy Klobuchar (D) entered. GOP sees opportunity.')
) AS v(district_name, rating, is_open, why_competitive)
JOIN districts d ON d.name = v.district_name
WHERE NOT EXISTS (
  SELECT 1 FROM races r
  WHERE r.district_id = d.id
  AND r.cycle_id = (SELECT id FROM election_cycles WHERE name = '2026 Midterms')
);

-- Safe races (remaining 23 states)
INSERT INTO races (cycle_id, district_id, rating, is_special_election, is_open_seat, general_date)
SELECT
  (SELECT id FROM election_cycles WHERE name = '2026 Midterms'),
  d.id,
  v.rating::race_rating,
  false,
  v.is_open,
  '2026-11-03'::date
FROM (VALUES
  -- Safe R
  ('AL Governor', 'Safe R', true),
  ('AK Governor', 'Safe R', true),
  ('AR Governor', 'Safe R', false),
  ('FL Governor', 'Safe R', true),
  ('ID Governor', 'Safe R', false),
  ('NE Governor', 'Safe R', false),
  ('OH Governor', 'Safe R', true),
  ('OK Governor', 'Safe R', true),
  ('SC Governor', 'Safe R', true),
  ('SD Governor', 'Safe R', false),
  ('TN Governor', 'Safe R', true),
  ('TX Governor', 'Safe R', false),
  ('WY Governor', 'Safe R', true),
  ('NH Governor', 'Safe R', false),
  ('VT Governor', 'Safe R', false),

  -- Safe D
  ('CA Governor', 'Safe D', true),
  ('CO Governor', 'Safe D', true),
  ('CT Governor', 'Safe D', false),
  ('HI Governor', 'Safe D', false),
  ('IL Governor', 'Safe D', false),
  ('MA Governor', 'Safe D', false),
  ('MD Governor', 'Safe D', false),
  ('OR Governor', 'Safe D', false)
) AS v(district_name, rating, is_open)
JOIN districts d ON d.name = v.district_name
WHERE NOT EXISTS (
  SELECT 1 FROM races r
  WHERE r.district_id = d.id
  AND r.cycle_id = (SELECT id FROM election_cycles WHERE name = '2026 Midterms')
);
