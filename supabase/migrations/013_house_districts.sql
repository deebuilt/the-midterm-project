-- ============================================================
-- House Battleground Districts & Races (2026 Midterms)
-- ~42 competitive House districts per Cook Political Report
-- and Sabato's Crystal Ball (as of Jan-Feb 2026)
-- ============================================================

-- ---------- HOUSE DISTRICTS ----------
-- Seed competitive House districts into the districts table

INSERT INTO districts (state_id, body_id, number, name) VALUES
  -- TOSS-UPS (18 per Cook, Jan 2026)
  ((SELECT id FROM states WHERE abbr='AZ'), (SELECT id FROM government_bodies WHERE slug='us-house'), 1, 'AZ House District 1'),
  ((SELECT id FROM states WHERE abbr='AZ'), (SELECT id FROM government_bodies WHERE slug='us-house'), 6, 'AZ House District 6'),
  ((SELECT id FROM states WHERE abbr='CO'), (SELECT id FROM government_bodies WHERE slug='us-house'), 8, 'CO House District 8'),
  ((SELECT id FROM states WHERE abbr='IA'), (SELECT id FROM government_bodies WHERE slug='us-house'), 1, 'IA House District 1'),
  ((SELECT id FROM states WHERE abbr='IA'), (SELECT id FROM government_bodies WHERE slug='us-house'), 3, 'IA House District 3'),
  ((SELECT id FROM states WHERE abbr='MI'), (SELECT id FROM government_bodies WHERE slug='us-house'), 7, 'MI House District 7'),
  ((SELECT id FROM states WHERE abbr='MI'), (SELECT id FROM government_bodies WHERE slug='us-house'), 10, 'MI House District 10'),
  ((SELECT id FROM states WHERE abbr='NE'), (SELECT id FROM government_bodies WHERE slug='us-house'), 2, 'NE House District 2'),
  ((SELECT id FROM states WHERE abbr='NJ'), (SELECT id FROM government_bodies WHERE slug='us-house'), 7, 'NJ House District 7'),
  ((SELECT id FROM states WHERE abbr='NY'), (SELECT id FROM government_bodies WHERE slug='us-house'), 17, 'NY House District 17'),
  ((SELECT id FROM states WHERE abbr='OH'), (SELECT id FROM government_bodies WHERE slug='us-house'), 9, 'OH House District 9'),
  ((SELECT id FROM states WHERE abbr='PA'), (SELECT id FROM government_bodies WHERE slug='us-house'), 7, 'PA House District 7'),
  ((SELECT id FROM states WHERE abbr='PA'), (SELECT id FROM government_bodies WHERE slug='us-house'), 8, 'PA House District 8'),
  ((SELECT id FROM states WHERE abbr='PA'), (SELECT id FROM government_bodies WHERE slug='us-house'), 10, 'PA House District 10'),
  ((SELECT id FROM states WHERE abbr='TX'), (SELECT id FROM government_bodies WHERE slug='us-house'), 34, 'TX House District 34'),
  ((SELECT id FROM states WHERE abbr='VA'), (SELECT id FROM government_bodies WHERE slug='us-house'), 2, 'VA House District 2'),
  ((SELECT id FROM states WHERE abbr='WA'), (SELECT id FROM government_bodies WHERE slug='us-house'), 3, 'WA House District 3'),
  ((SELECT id FROM states WHERE abbr='WI'), (SELECT id FROM government_bodies WHERE slug='us-house'), 3, 'WI House District 3'),

  -- LEAN D (8)
  ((SELECT id FROM states WHERE abbr='CA'), (SELECT id FROM government_bodies WHERE slug='us-house'), 13, 'CA House District 13'),
  ((SELECT id FROM states WHERE abbr='CA'), (SELECT id FROM government_bodies WHERE slug='us-house'), 27, 'CA House District 27'),
  ((SELECT id FROM states WHERE abbr='NM'), (SELECT id FROM government_bodies WHERE slug='us-house'), 2, 'NM House District 2'),
  ((SELECT id FROM states WHERE abbr='NV'), (SELECT id FROM government_bodies WHERE slug='us-house'), 3, 'NV House District 3'),
  ((SELECT id FROM states WHERE abbr='NY'), (SELECT id FROM government_bodies WHERE slug='us-house'), 3, 'NY House District 3'),
  ((SELECT id FROM states WHERE abbr='NY'), (SELECT id FROM government_bodies WHERE slug='us-house'), 4, 'NY House District 4'),
  ((SELECT id FROM states WHERE abbr='NY'), (SELECT id FROM government_bodies WHERE slug='us-house'), 19, 'NY House District 19'),
  ((SELECT id FROM states WHERE abbr='OH'), (SELECT id FROM government_bodies WHERE slug='us-house'), 1, 'OH House District 1'),

  -- LEAN R (5)
  ((SELECT id FROM states WHERE abbr='CA'), (SELECT id FROM government_bodies WHERE slug='us-house'), 22, 'CA House District 22'),
  ((SELECT id FROM states WHERE abbr='CA'), (SELECT id FROM government_bodies WHERE slug='us-house'), 40, 'CA House District 40'),
  ((SELECT id FROM states WHERE abbr='CA'), (SELECT id FROM government_bodies WHERE slug='us-house'), 48, 'CA House District 48'),
  ((SELECT id FROM states WHERE abbr='NC'), (SELECT id FROM government_bodies WHERE slug='us-house'), 1, 'NC House District 1'),
  ((SELECT id FROM states WHERE abbr='PA'), (SELECT id FROM government_bodies WHERE slug='us-house'), 1, 'PA House District 1'),

  -- LIKELY COMPETITIVE (11)
  ((SELECT id FROM states WHERE abbr='CA'), (SELECT id FROM government_bodies WHERE slug='us-house'), 45, 'CA House District 45'),
  ((SELECT id FROM states WHERE abbr='MI'), (SELECT id FROM government_bodies WHERE slug='us-house'), 8, 'MI House District 8'),
  ((SELECT id FROM states WHERE abbr='OH'), (SELECT id FROM government_bodies WHERE slug='us-house'), 13, 'OH House District 13'),
  ((SELECT id FROM states WHERE abbr='TX'), (SELECT id FROM government_bodies WHERE slug='us-house'), 28, 'TX House District 28'),
  ((SELECT id FROM states WHERE abbr='NH'), (SELECT id FROM government_bodies WHERE slug='us-house'), 1, 'NH House District 1'),
  ((SELECT id FROM states WHERE abbr='ME'), (SELECT id FROM government_bodies WHERE slug='us-house'), 2, 'ME House District 2'),
  ((SELECT id FROM states WHERE abbr='MN'), (SELECT id FROM government_bodies WHERE slug='us-house'), 2, 'MN House District 2'),
  ((SELECT id FROM states WHERE abbr='VA'), (SELECT id FROM government_bodies WHERE slug='us-house'), 7, 'VA House District 7'),
  ((SELECT id FROM states WHERE abbr='CO'), (SELECT id FROM government_bodies WHERE slug='us-house'), 5, 'CO House District 5'),
  ((SELECT id FROM states WHERE abbr='FL'), (SELECT id FROM government_bodies WHERE slug='us-house'), 7, 'FL House District 7'),
  ((SELECT id FROM states WHERE abbr='KY'), (SELECT id FROM government_bodies WHERE slug='us-house'), 6, 'KY House District 6')
ON CONFLICT (state_id, body_id, number, senate_class) DO NOTHING;


-- ---------- HOUSE RACES ----------
-- Create races for each district in the active 2026 cycle

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
  ('AZ House District 1', 'Toss-up', true, 'Open seat — Schweikert running for governor. Maricopa County district. Biden won here in 2020.'),
  ('AZ House District 6', 'Toss-up', false, 'Tucson area. Ciscomani won by 5 pts in 2024. Top Democratic target.'),
  ('CO House District 8', 'Toss-up', false, 'North of Denver. New district created after 2020 Census. Gabe Evans (R) won narrowly in 2024.'),
  ('IA House District 1', 'Toss-up', false, 'Davenport / Iowa City. Miller-Meeks won by just 6 votes in 2020. Competitive every cycle.'),
  ('IA House District 3', 'Toss-up', false, 'Des Moines area. Moved from Lean R to Toss-up Jan 2026. Zach Nunn (R) is vulnerable.'),
  ('MI House District 7', 'Toss-up', false, 'Lansing area. Tom Barrett (R) won in 2024. Battleground state dynamics.'),
  ('MI House District 10', 'Toss-up', true, 'Northern Detroit suburbs. John James (R) open seat. Key suburban battleground.'),
  ('NE House District 2', 'Toss-up', true, 'Omaha. Don Bacon (R) retiring. Harris won this district in 2024. Swing district.'),
  ('NJ House District 7', 'Toss-up', false, 'Suburban northern New Jersey. Tom Kean Jr. (R) in Biden-won district.'),
  ('NY House District 17', 'Toss-up', false, 'Exurban NYC. Mike Lawler (R) may vacate for governor run. Moved to Toss-up Jan 2026.'),
  ('OH House District 9', 'Toss-up', false, 'Toledo. Marcy Kaptur (D) is longest-serving woman in House history. District redrawn redder.'),
  ('PA House District 7', 'Toss-up', false, 'Lehigh Valley. Ryan Mackenzie (R) won by just 1 pt in 2024.'),
  ('PA House District 8', 'Toss-up', false, 'Northeastern PA. Rob Bresnahan Jr. (R) won narrowly. Blue-collar district.'),
  ('PA House District 10', 'Toss-up', false, 'Harrisburg-York area. Scott Perry (R) has been targeted by Democrats for years.'),
  ('TX House District 34', 'Toss-up', false, 'Brownsville/McAllen. Vicente Gonzalez (D) in a district trending Republican along the border.'),
  ('VA House District 2', 'Toss-up', false, 'Virginia Beach. Jen Kiggans (R) in a competitive coastal district.'),
  ('WA House District 3', 'Toss-up', false, 'Rural southwest WA. Marie Gluesenkamp Perez (D) won upset in 2022. One of most-watched races.'),
  ('WI House District 3', 'Toss-up', false, 'La Crosse / Eau Claire. Derrick Van Orden (R) in a western Wisconsin swing district.'),

  -- LEAN D
  ('CA House District 13', 'Lean D', false, 'Central Valley. Adam Gray (D) won narrowly in 2024. Agricultural district.'),
  ('CA House District 27', 'Lean D', false, 'North LA suburbs. George Whitesides (D). New map may help Democrats.'),
  ('NM House District 2', 'Lean D', false, 'Southern NM. Gabe Vasquez (D) in a border district. Moved from Toss-up to Lean D Jan 2026.'),
  ('NV House District 3', 'Lean D', false, 'Las Vegas suburbs. Susie Lee (D). Competitive in recent cycles.'),
  ('NY House District 3', 'Lean D', false, 'Long Island. Tom Suozzi (D) won special election in 2024. Suburban swing.'),
  ('NY House District 4', 'Lean D', false, 'Nassau County. Laura Gillen (D). Moved from Toss-up to Lean D Jan 2026.'),
  ('NY House District 19', 'Lean D', false, 'Hudson Valley. Josh Riley (D) won in 2024. Rural-suburban mix.'),
  ('OH House District 1', 'Lean D', false, 'Cincinnati. Greg Landsman (D) won in 2022. Urban-suburban district.'),

  -- LEAN R
  ('CA House District 22', 'Lean R', false, 'Central Valley. David Valadao (R). Moved to Lean R after CA redistricting.'),
  ('CA House District 40', 'Lean R', false, 'Orange County. Young Kim (R). Suburban district with shifting demographics.'),
  ('CA House District 48', 'Lean R', false, 'Southern CA. Darrell Issa (R). Redistricting made this more competitive.'),
  ('NC House District 1', 'Lean R', false, 'Eastern NC. Redistricted. Don Davis (D) faces tough new lines.'),
  ('PA House District 1', 'Lean R', false, 'Bucks County. Brian Fitzpatrick (R). Suburban Philadelphia swing district.'),

  -- LIKELY D
  ('CA House District 45', 'Likely D', false, 'Western Orange County. Derek Tran (D). New redistricting may lock this in.'),
  ('OH House District 13', 'Likely D', false, 'Akron-Canton. Emilia Sykes (D). Urban district but could get competitive.'),
  ('VA House District 7', 'Likely D', false, 'Northern Virginia. Eugene Vindman (D). Suburban DC. Likely safe but on watch list.'),
  ('MN House District 2', 'Likely D', true, 'Southern Twin Cities suburbs. Angie Craig (D) open seat.'),
  ('NH House District 1', 'Likely D', true, 'Eastern NH. Chris Pappas (D) running for Senate. Open seat.'),

  -- LIKELY R
  ('MI House District 8', 'Likely R', false, 'Northern MI suburbs. Moved from Safe R to Likely R. On watch.'),
  ('TX House District 28', 'Likely R', false, 'Laredo. Henry Cuellar (D) faces legal issues. District trending R.'),
  ('ME House District 2', 'Likely R', true, 'Rural Maine. Jared Golden (D) open seat. Cook rates Likely R.'),
  ('CO House District 5', 'Likely R', false, 'Colorado Springs. Moved from Safe R to Likely R Jan 2026.'),
  ('FL House District 7', 'Likely R', false, 'Central FL. Moved from Safe R to Likely R Jan 2026.'),
  ('KY House District 6', 'Likely R', true, 'Lexington area. Andy Barr (R) open seat.')
) AS v(district_name, rating, is_open, why_competitive)
JOIN districts d ON d.name = v.district_name
WHERE NOT EXISTS (
  SELECT 1 FROM races r
  WHERE r.district_id = d.id
  AND r.cycle_id = (SELECT id FROM election_cycles WHERE name = '2026 Midterms')
);
