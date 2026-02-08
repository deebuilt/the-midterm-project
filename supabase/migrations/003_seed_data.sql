-- ============================================================
-- Seed Data — migrated from src/data/*.ts
-- ============================================================

-- ---------- STATES (50) ----------

INSERT INTO states (name, abbr, fips, house_districts) VALUES
  ('Alabama', 'AL', '01', 7),
  ('Alaska', 'AK', '02', 1),
  ('Arizona', 'AZ', '04', 9),
  ('Arkansas', 'AR', '05', 4),
  ('California', 'CA', '06', 52),
  ('Colorado', 'CO', '08', 8),
  ('Connecticut', 'CT', '09', 5),
  ('Delaware', 'DE', '10', 1),
  ('Florida', 'FL', '12', 28),
  ('Georgia', 'GA', '13', 14),
  ('Hawaii', 'HI', '15', 2),
  ('Idaho', 'ID', '16', 2),
  ('Illinois', 'IL', '17', 17),
  ('Indiana', 'IN', '18', 9),
  ('Iowa', 'IA', '19', 4),
  ('Kansas', 'KS', '20', 4),
  ('Kentucky', 'KY', '21', 6),
  ('Louisiana', 'LA', '22', 6),
  ('Maine', 'ME', '23', 2),
  ('Maryland', 'MD', '24', 8),
  ('Massachusetts', 'MA', '25', 9),
  ('Michigan', 'MI', '26', 13),
  ('Minnesota', 'MN', '27', 8),
  ('Mississippi', 'MS', '28', 4),
  ('Missouri', 'MO', '29', 8),
  ('Montana', 'MT', '30', 2),
  ('Nebraska', 'NE', '31', 3),
  ('Nevada', 'NV', '32', 4),
  ('New Hampshire', 'NH', '33', 2),
  ('New Jersey', 'NJ', '34', 12),
  ('New Mexico', 'NM', '35', 3),
  ('New York', 'NY', '36', 26),
  ('North Carolina', 'NC', '37', 14),
  ('North Dakota', 'ND', '38', 1),
  ('Ohio', 'OH', '39', 15),
  ('Oklahoma', 'OK', '40', 5),
  ('Oregon', 'OR', '41', 6),
  ('Pennsylvania', 'PA', '42', 17),
  ('Rhode Island', 'RI', '44', 2),
  ('South Carolina', 'SC', '45', 7),
  ('South Dakota', 'SD', '46', 1),
  ('Tennessee', 'TN', '47', 9),
  ('Texas', 'TX', '48', 38),
  ('Utah', 'UT', '49', 4),
  ('Vermont', 'VT', '50', 1),
  ('Virginia', 'VA', '51', 11),
  ('Washington', 'WA', '53', 10),
  ('West Virginia', 'WV', '54', 2),
  ('Wisconsin', 'WI', '55', 8),
  ('Wyoming', 'WY', '56', 1);


-- ---------- GOVERNMENT BODIES ----------

INSERT INTO government_bodies (name, slug, level, chamber, total_seats, majority_needed, term_years) VALUES
  ('US Senate',    'us-senate',  'federal', 'upper',     100, 51, 6),
  ('US House',     'us-house',   'federal', 'lower',     435, 218, 2),
  ('Governor',     'governor',   'state',   'executive', NULL, NULL, 4);


-- ---------- ELECTION CYCLE ----------

INSERT INTO election_cycles (name, year, election_date, type, is_active, description) VALUES
  ('2026 Midterms', 2026, '2026-11-03', 'midterm', true,
   'All 435 House seats, 33 Senate Class II seats, 2 special Senate elections, and 36 gubernatorial races.');


-- ---------- DISTRICTS (Senate Class II seats + special elections) ----------
-- We create districts for all seats that exist in the current data.
-- Senate seats: one per state with a Class II senator, plus OH/FL specials.

-- Class II Senate seats (33 states that have Class II)
INSERT INTO districts (state_id, body_id, senate_class, name) VALUES
  ((SELECT id FROM states WHERE abbr='AL'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'AL Senate Class II'),
  ((SELECT id FROM states WHERE abbr='AK'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'AK Senate Class II'),
  ((SELECT id FROM states WHERE abbr='AR'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'AR Senate Class II'),
  ((SELECT id FROM states WHERE abbr='CO'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'CO Senate Class II'),
  ((SELECT id FROM states WHERE abbr='DE'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'DE Senate Class II'),
  ((SELECT id FROM states WHERE abbr='GA'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'GA Senate Class II'),
  ((SELECT id FROM states WHERE abbr='ID'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'ID Senate Class II'),
  ((SELECT id FROM states WHERE abbr='IL'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'IL Senate Class II'),
  ((SELECT id FROM states WHERE abbr='IA'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'IA Senate Class II'),
  ((SELECT id FROM states WHERE abbr='KS'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'KS Senate Class II'),
  ((SELECT id FROM states WHERE abbr='KY'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'KY Senate Class II'),
  ((SELECT id FROM states WHERE abbr='LA'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'LA Senate Class II'),
  ((SELECT id FROM states WHERE abbr='ME'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'ME Senate Class II'),
  ((SELECT id FROM states WHERE abbr='MA'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'MA Senate Class II'),
  ((SELECT id FROM states WHERE abbr='MI'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'MI Senate Class II'),
  ((SELECT id FROM states WHERE abbr='MN'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'MN Senate Class II'),
  ((SELECT id FROM states WHERE abbr='MS'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'MS Senate Class II'),
  ((SELECT id FROM states WHERE abbr='MT'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'MT Senate Class II'),
  ((SELECT id FROM states WHERE abbr='NE'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'NE Senate Class II'),
  ((SELECT id FROM states WHERE abbr='NH'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'NH Senate Class II'),
  ((SELECT id FROM states WHERE abbr='NJ'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'NJ Senate Class II'),
  ((SELECT id FROM states WHERE abbr='NM'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'NM Senate Class II'),
  ((SELECT id FROM states WHERE abbr='NC'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'NC Senate Class II'),
  ((SELECT id FROM states WHERE abbr='OK'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'OK Senate Class II'),
  ((SELECT id FROM states WHERE abbr='OR'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'OR Senate Class II'),
  ((SELECT id FROM states WHERE abbr='RI'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'RI Senate Class II'),
  ((SELECT id FROM states WHERE abbr='SC'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'SC Senate Class II'),
  ((SELECT id FROM states WHERE abbr='SD'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'SD Senate Class II'),
  ((SELECT id FROM states WHERE abbr='TN'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'TN Senate Class II'),
  ((SELECT id FROM states WHERE abbr='TX'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'TX Senate Class II'),
  ((SELECT id FROM states WHERE abbr='VA'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'VA Senate Class II'),
  ((SELECT id FROM states WHERE abbr='WV'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'WV Senate Class II'),
  ((SELECT id FROM states WHERE abbr='WY'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 2, 'WY Senate Class II');

-- Special election seats (Class III)
INSERT INTO districts (state_id, body_id, senate_class, name) VALUES
  ((SELECT id FROM states WHERE abbr='OH'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 3, 'OH Senate Class III (Special)'),
  ((SELECT id FROM states WHERE abbr='FL'), (SELECT id FROM government_bodies WHERE slug='us-senate'), 3, 'FL Senate Class III (Special)');


-- ---------- CANDIDATES ----------
-- Migrated from senate-races.ts

INSERT INTO candidates (slug, first_name, last_name, party, photo_url, website, twitter, role_title, is_incumbent, bioguide_id) VALUES
  -- Maine
  ('collins-susan', 'Susan', 'Collins', 'Republican',
    'https://unitedstates.github.io/images/congress/450x550/C001035.jpg',
    'https://www.collins.senate.gov', 'SenatorCollins',
    'U.S. Senator (since 1997)', true, 'C001035'),
  ('mills-janet', 'Janet', 'Mills', 'Democrat',
    '/images/candidates/janet-mills.jpg',
    'https://janetmills.com', 'JanetMillsforME',
    'Governor of Maine', false, NULL),

  -- North Carolina
  ('tillis-thom', 'Thom', 'Tillis', 'Republican',
    'https://unitedstates.github.io/images/congress/450x550/T000476.jpg',
    NULL, NULL,
    'U.S. Senator (retiring)', true, 'T000476'),
  ('cooper-roy', 'Roy', 'Cooper', 'Democrat',
    '/images/candidates/roy-cooper.jpg',
    'https://roycooper.com', 'RoyCooperNC',
    'Former Governor of North Carolina', false, NULL),
  ('whatley-michael', 'Michael', 'Whatley', 'Republican',
    '/images/candidates/michael-whatley.jpg',
    'https://www.michaelwhatley.com', 'WhatleyNC',
    'Former RNC Chairman', false, NULL),

  -- Georgia
  ('ossoff-jon', 'Jon', 'Ossoff', 'Democrat',
    'https://unitedstates.github.io/images/congress/450x550/O000174.jpg',
    'https://electjon.com', 'ossoff',
    'U.S. Senator (since 2021)', true, 'O000174'),
  ('carter-buddy', 'Buddy', 'Carter', 'Republican',
    'https://unitedstates.github.io/images/congress/450x550/C001103.jpg',
    'https://buddycarter.house.gov', 'RepBuddyCarter',
    'U.S. Representative', false, 'C001103'),
  ('mccormick-rich', 'Rich', 'McCormick', 'Republican',
    'https://unitedstates.github.io/images/congress/450x550/M001218.jpg',
    'https://mccormick.house.gov', 'RepMcCormick',
    'U.S. Representative', false, 'M001218'),

  -- Michigan
  ('peters-gary', 'Gary', 'Peters', 'Democrat',
    'https://unitedstates.github.io/images/congress/450x550/P000595.jpg',
    NULL, NULL,
    'U.S. Senator (retiring)', true, 'P000595'),
  ('stevens-haley', 'Haley', 'Stevens', 'Democrat',
    'https://unitedstates.github.io/images/congress/450x550/S001215.jpg',
    'https://stevens.house.gov', 'RepHaleyStevens',
    'U.S. Representative', false, 'S001215'),
  ('mcmorrow-mallory', 'Mallory', 'McMorrow', 'Democrat',
    '/images/candidates/mallory-mcmorrow.jpg',
    'https://www.mcmorrowformichigan.com', 'MalloryMcMorrow',
    'Michigan State Senator & Senate Majority Whip', false, NULL),
  ('el-sayed-abdul', 'Abdul', 'El-Sayed', 'Democrat',
    '/images/candidates/abdul-el-sayed.jpg',
    'https://abdulforsenate.com', 'AbdulElSayed',
    'Physician & Public Health Expert', false, NULL),
  ('rogers-mike', 'Mike', 'Rogers', 'Republican',
    'https://unitedstates.github.io/images/congress/450x550/R000572.jpg',
    'https://mikerogers.com', 'MikeRogersForMI',
    'Former U.S. Representative', false, 'R000572'),

  -- Nebraska
  ('ricketts-pete', 'Pete', 'Ricketts', 'Republican',
    'https://unitedstates.github.io/images/congress/450x550/R000618.jpg',
    'https://www.ricketts.senate.gov', 'SenatorRicketts',
    'U.S. Senator (appointed 2023)', true, 'R000618'),
  ('osborn-dan', 'Dan', 'Osborn', 'Independent',
    '/images/candidates/dan-osborn.jpg',
    'https://www.osbornforsenate.com', 'OsbornForSenate',
    'Labor organizer & mechanic', false, NULL),

  -- Iowa
  ('ernst-joni', 'Joni', 'Ernst', 'Republican',
    'https://unitedstates.github.io/images/congress/450x550/E000295.jpg',
    NULL, NULL,
    'U.S. Senator (retiring)', true, 'E000295'),

  -- Ohio special
  ('vance-jd', 'JD', 'Vance', 'Republican',
    'https://unitedstates.github.io/images/congress/450x550/V000137.jpg',
    NULL, NULL,
    'Vice President of the United States', false, 'V000137'),

  -- Florida special
  ('rubio-marco', 'Marco', 'Rubio', 'Republican',
    'https://unitedstates.github.io/images/congress/450x550/R000595.jpg',
    NULL, NULL,
    'Secretary of State', false, 'R000595'),

  -- Texas
  ('cornyn-john', 'John', 'Cornyn', 'Republican',
    'https://unitedstates.github.io/images/congress/450x550/C001056.jpg',
    'https://www.cornyn.senate.gov', 'JohnCornyn',
    'U.S. Senator (since 2002)', true, 'C001056'),

  -- Virginia
  ('warner-mark', 'Mark', 'Warner', 'Democrat',
    'https://unitedstates.github.io/images/congress/450x550/W000805.jpg',
    'https://www.warner.senate.gov', 'MarkWarner',
    'U.S. Senator (since 2009)', true, 'W000805'),

  -- Colorado
  ('hickenlooper-john', 'John', 'Hickenlooper', 'Democrat',
    'https://unitedstates.github.io/images/congress/450x550/H000273.jpg',
    'https://www.hickenlooper.senate.gov', 'SenatorHick',
    'U.S. Senator (since 2021)', true, 'H000273'),

  -- South Carolina
  ('graham-lindsey', 'Lindsey', 'Graham', 'Republican',
    'https://unitedstates.github.io/images/congress/450x550/G000359.jpg',
    'https://www.lgraham.senate.gov', 'LindseyGrahamSC',
    'U.S. Senator (since 2003)', true, 'G000359');


-- ---------- RACES (2026 Midterm Senate) ----------
-- Link races to the cycle and districts

INSERT INTO races (cycle_id, district_id, rating, is_special_election, is_open_seat, primary_date, general_date, why_competitive)
SELECT
  (SELECT id FROM election_cycles WHERE name = '2026 Midterms'),
  d.id,
  v.rating::race_rating,
  v.is_special,
  v.is_open,
  v.primary_date::date,
  '2026-11-03'::date,
  v.why_competitive
FROM (VALUES
  ('ME Senate Class II', 'Toss-up', false, false, '2026-06-09', 'Blue-leaning state with a long-serving Republican incumbent. Collins won in 2020 but Maine has trended Democratic in recent presidential elections.'),
  ('NC Senate Class II', 'Toss-up', false, true, '2026-03-03', 'Open seat in a purple state. Tillis retiring. Roy Cooper (D) is a popular former governor running against RNC Chairman Michael Whatley (R).'),
  ('GA Senate Class II', 'Toss-up', false, false, '2026-05-19', 'Trump won Georgia in 2024 by a narrow margin. Ossoff won his 2021 special election by just 1.2 points.'),
  ('MI Senate Class II', 'Toss-up', false, true, '2026-08-04', 'Open seat in a battleground state. Peters retiring. Trump won Michigan narrowly in 2024. Three-way Democratic primary.'),
  ('NE Senate Class II', 'Lean R', false, false, '2026-05-12', 'Deep red state but independent Dan Osborn came within 5 points of winning in 2024. Ricketts was appointed, not elected.'),
  ('IA Senate Class II', 'Lean R', false, true, '2026-06-02', 'Open seat. Ernst retiring. Iowa was competitive as recently as 2020. Could attract strong candidates from both parties.'),
  ('OH Senate Class III (Special)', 'Lean R', true, true, '2026-05-05', 'Special election after JD Vance resigned to become Vice President. Ohio has trended red but Democrats won a Senate seat here in 2018.'),
  ('FL Senate Class III (Special)', 'Likely R', true, true, '2026-08-18', 'Special election after Marco Rubio resigned to become Secretary of State. Florida has trended Republican in recent cycles.'),
  ('TX Senate Class II', 'Safe R', false, false, '2026-03-03', NULL),
  ('VA Senate Class II', 'Likely D', false, false, '2026-06-09', NULL),
  ('CO Senate Class II', 'Safe D', false, false, '2026-06-30', NULL),
  ('SC Senate Class II', 'Safe R', false, false, '2026-06-09', NULL)
) AS v(district_name, rating, is_special, is_open, primary_date, why_competitive)
JOIN districts d ON d.name = v.district_name;

-- Non-competitive Class II races (fill in the rest)
INSERT INTO races (cycle_id, district_id, rating, is_special_election, is_open_seat, general_date)
SELECT
  (SELECT id FROM election_cycles WHERE name = '2026 Midterms'),
  d.id,
  v.rating::race_rating,
  false,
  false,
  '2026-11-03'::date
FROM (VALUES
  ('AL Senate Class II', 'Safe R'),
  ('AK Senate Class II', 'Safe R'),
  ('AR Senate Class II', 'Safe R'),
  ('ID Senate Class II', 'Safe R'),
  ('KS Senate Class II', 'Safe R'),
  ('KY Senate Class II', 'Safe R'),
  ('LA Senate Class II', 'Safe R'),
  ('MA Senate Class II', 'Safe D'),
  ('MN Senate Class II', 'Safe D'),
  ('MS Senate Class II', 'Safe R'),
  ('MT Senate Class II', 'Safe R'),
  ('NH Senate Class II', 'Safe D'),
  ('NJ Senate Class II', 'Safe D'),
  ('NM Senate Class II', 'Safe D'),
  ('OK Senate Class II', 'Safe R'),
  ('OR Senate Class II', 'Safe D'),
  ('RI Senate Class II', 'Safe D'),
  ('SD Senate Class II', 'Safe R'),
  ('TN Senate Class II', 'Safe R'),
  ('WV Senate Class II', 'Safe R'),
  ('WY Senate Class II', 'Safe R'),
  ('DE Senate Class II', 'Safe D'),
  ('IL Senate Class II', 'Safe D')
) AS v(district_name, rating)
JOIN districts d ON d.name = v.district_name
WHERE NOT EXISTS (
  SELECT 1 FROM races r
  WHERE r.district_id = d.id
  AND r.cycle_id = (SELECT id FROM election_cycles WHERE name = '2026 Midterms')
);


-- ---------- RACE_CANDIDATES (link candidates to races) ----------

-- Helper: insert race_candidate by district name and candidate slug
INSERT INTO race_candidates (race_id, candidate_id, status, is_incumbent)
SELECT r.id, c.id, v.status::candidate_status, v.is_inc
FROM (VALUES
  -- Maine
  ('ME Senate Class II', 'collins-susan', 'announced', true),
  ('ME Senate Class II', 'mills-janet', 'announced', false),
  -- North Carolina
  ('NC Senate Class II', 'cooper-roy', 'announced', false),
  ('NC Senate Class II', 'whatley-michael', 'announced', false),
  -- Georgia
  ('GA Senate Class II', 'ossoff-jon', 'announced', true),
  ('GA Senate Class II', 'carter-buddy', 'announced', false),
  ('GA Senate Class II', 'mccormick-rich', 'announced', false),
  -- Michigan
  ('MI Senate Class II', 'stevens-haley', 'announced', false),
  ('MI Senate Class II', 'mcmorrow-mallory', 'announced', false),
  ('MI Senate Class II', 'el-sayed-abdul', 'announced', false),
  ('MI Senate Class II', 'rogers-mike', 'announced', false),
  -- Nebraska
  ('NE Senate Class II', 'ricketts-pete', 'announced', true),
  ('NE Senate Class II', 'osborn-dan', 'announced', false),
  -- Texas
  ('TX Senate Class II', 'cornyn-john', 'announced', true),
  -- Virginia
  ('VA Senate Class II', 'warner-mark', 'announced', true),
  -- Colorado
  ('CO Senate Class II', 'hickenlooper-john', 'announced', true),
  -- South Carolina
  ('SC Senate Class II', 'graham-lindsey', 'announced', true)
) AS v(district_name, cand_slug, status, is_inc)
JOIN races r ON r.district_id = (SELECT id FROM districts WHERE name = v.district_name)
  AND r.cycle_id = (SELECT id FROM election_cycles WHERE name = '2026 Midterms')
JOIN candidates c ON c.slug = v.cand_slug;


-- ---------- TOPICS ----------

INSERT INTO topics (name, slug, icon) VALUES
  ('Healthcare', 'healthcare', NULL),
  ('Immigration', 'immigration', NULL),
  ('Gun Safety', 'gun-safety', NULL),
  ('Climate & Energy', 'climate-energy', NULL),
  ('Economy & Jobs', 'economy-jobs', NULL),
  ('Abortion & Reproductive Rights', 'abortion', NULL),
  ('Education', 'education', NULL),
  ('National Security', 'national-security', NULL),
  ('Voting & Elections', 'voting-elections', NULL),
  ('LGBTQ+ Rights', 'lgbtq-rights', NULL),
  ('Criminal Justice', 'criminal-justice', NULL),
  ('Infrastructure', 'infrastructure', NULL),
  ('Technology & Privacy', 'tech-privacy', NULL),
  ('Fiscal Policy', 'fiscal-policy', NULL),
  ('Workers Rights', 'workers-rights', NULL);


-- ---------- CANDIDATE POSITIONS ----------
-- Migrated from the positions[] arrays in senate-races.ts

INSERT INTO candidate_positions (candidate_id, topic_id, stance, summary, source_url)
SELECT c.id, t.id, v.stance::stance, v.summary, NULL
FROM (VALUES
  -- Susan Collins
  ('collins-susan', 'voting-elections', 'supports', 'Voted YES to convict Trump in his second impeachment trial (1 of 7 Republicans)'),
  ('collins-susan', 'criminal-justice', 'supports', 'Voted YES to confirm Ketanji Brown Jackson to the Supreme Court'),
  ('collins-susan', 'infrastructure', 'supports', 'Helped negotiate the bipartisan infrastructure bill ($1.2 trillion)'),
  ('collins-susan', 'voting-elections', 'opposes', 'Refused to endorse Trump in 2024; wrote in Nikki Haley'),

  -- Janet Mills
  ('mills-janet', 'healthcare', 'supports', 'Signed executive order expanding Medicaid on first day in office (56,000+ Mainers covered)'),
  ('mills-janet', 'climate-energy', 'supports', 'Signed landmark climate bills creating the Maine Climate Council (45% emissions cut by 2030)'),
  ('mills-janet', 'workers-rights', 'supports', 'Signed paid family & medical leave into law (up to 12 weeks, starting 2026)'),

  -- Roy Cooper
  ('cooper-roy', 'lgbtq-rights', 'supports', 'Negotiated partial repeal of HB2 (bathroom bill) that cost NC billions in economic damage'),
  ('cooper-roy', 'healthcare', 'supports', 'Secured Medicaid expansion after years of being blocked (600,000+ North Carolinians covered)'),
  ('cooper-roy', 'climate-energy', 'supports', 'Signed landmark clean energy law: 70% carbon reduction by 2030, carbon neutrality by 2050'),

  -- Michael Whatley
  ('whatley-michael', 'voting-elections', 'supports', 'Prioritizes election integrity reform and border security'),
  ('whatley-michael', 'immigration', 'supports', 'Background in energy law; closely aligned with Trump policy agenda'),

  -- Jon Ossoff
  ('ossoff-jon', 'climate-energy', 'supports', 'Voted YES on the Inflation Reduction Act (climate & healthcare spending)'),
  ('ossoff-jon', 'gun-safety', 'supports', 'Voted YES on the Bipartisan Safer Communities Act (gun safety after Uvalde)'),
  ('ossoff-jon', 'lgbtq-rights', 'supports', 'Voted YES on the Respect for Marriage Act (codifying same-sex marriage)'),
  ('ossoff-jon', 'healthcare', 'supports', 'Helped pass the $35/month insulin cap for seniors on Medicare'),

  -- Buddy Carter
  ('carter-buddy', 'voting-elections', 'opposes', 'Voted to object to certifying the 2020 election results (hours after Jan 6 breach)'),
  ('carter-buddy', 'fiscal-policy', 'supports', 'Sponsors the FairTax Act: abolish IRS and replace income tax with ~23% national sales tax'),
  ('carter-buddy', 'abortion', 'supports', 'Supports overturning Roe v. Wade; believes abortion laws should be left to states'),

  -- Rich McCormick
  ('mccormick-rich', 'lgbtq-rights', 'opposes', 'Sponsored legislation to ban federal funding for gender transition procedures for minors'),
  ('mccormick-rich', 'fiscal-policy', 'opposes', 'Voted NO on the bipartisan deal to avoid a debt default (2023)'),
  ('mccormick-rich', 'abortion', 'opposes', 'Co-sponsored a bill recognizing legal personhood as beginning at conception'),

  -- Haley Stevens
  ('stevens-haley', 'economy-jobs', 'supports', 'Drove passage of the CHIPS and Science Act (bringing semiconductor manufacturing to the US)'),
  ('stevens-haley', 'immigration', 'supports', 'Voted YES on the Dream and Promise Act (protecting Dreamers from deportation)'),

  -- Mallory McMorrow
  ('mcmorrow-mallory', 'gun-safety', 'supports', 'Authored Michigan''s first Extreme Risk Protection Order (red flag) law'),
  ('mcmorrow-mallory', 'workers-rights', 'supports', 'Helped pass legislation raising Michigan''s minimum wage to $15/hour'),
  ('mcmorrow-mallory', 'abortion', 'supports', 'Led efforts to repeal Michigan''s 1931 abortion ban after voters codified abortion rights'),

  -- Abdul El-Sayed
  ('el-sayed-abdul', 'healthcare', 'supports', 'Advocates for Medicare for All / single-payer healthcare'),
  ('el-sayed-abdul', 'climate-energy', 'supports', 'Champions affordable housing, clean energy, and quality public education'),

  -- Mike Rogers
  ('rogers-mike', 'healthcare', 'opposes', 'Voted repeatedly against letting Medicare negotiate drug prices'),
  ('rogers-mike', 'immigration', 'supports', 'Supports building a border wall and expanding immigration enforcement'),
  ('rogers-mike', 'economy-jobs', 'supports', 'Supports Trump''s tariff plans on foreign goods'),

  -- Pete Ricketts
  ('ricketts-pete', 'abortion', 'opposes', 'Supports a total ban on abortion with no exceptions for rape or incest'),
  ('ricketts-pete', 'fiscal-policy', 'opposes', 'Voted NO on the bipartisan debt ceiling deal (2023)'),
  ('ricketts-pete', 'criminal-justice', 'supports', 'As governor, personally funded a campaign to restore the death penalty after the legislature abolished it'),

  -- Dan Osborn
  ('osborn-dan', 'workers-rights', 'supports', 'Led the 2021 Kellogg''s strike as union president (IAM & Aerospace Workers)'),
  ('osborn-dan', 'healthcare', 'supports', 'Supports legalizing and taxing marijuana; supports abortion access within Roe v. Wade limits'),

  -- John Cornyn
  ('cornyn-john', 'gun-safety', 'supports', 'Led the effort to pass the Bipartisan Safer Communities Act (first federal gun safety law in ~30 years)'),
  ('cornyn-john', 'voting-elections', 'mixed', 'Did NOT object to certifying the 2020 election (broke with many fellow Republicans)'),

  -- Mark Warner
  ('warner-mark', 'climate-energy', 'supports', 'Voted YES on the Inflation Reduction Act (climate & healthcare spending)'),
  ('warner-mark', 'infrastructure', 'supports', 'Helped negotiate the bipartisan infrastructure bill'),
  ('warner-mark', 'tech-privacy', 'supports', 'Led the push to ban or force sale of TikTok (introduced RESTRICT Act as Senate Intel chairman)'),

  -- John Hickenlooper
  ('hickenlooper-john', 'climate-energy', 'mixed', 'Joined Republicans in voting to block a ban on fracking (broke with his own party)'),
  ('hickenlooper-john', 'infrastructure', 'supports', 'Was part of the 22-senator group that wrote the bipartisan infrastructure bill'),

  -- Lindsey Graham
  ('graham-lindsey', 'abortion', 'opposes', 'Introduced a bill to ban abortion nationwide after 15 weeks'),
  ('graham-lindsey', 'gun-safety', 'supports', 'Supported the Bipartisan Safer Communities Act (gun safety with red flag provisions)')
) AS v(cand_slug, topic_slug, stance, summary)
JOIN candidates c ON c.slug = v.cand_slug
JOIN topics t ON t.slug = v.topic_slug;


-- ---------- CYCLE STATS ----------

-- Senate stats for 2026
INSERT INTO cycle_stats (
  cycle_id, body_id, total_seats, seats_up, special_elections,
  current_split_r, current_split_d, majority_needed,
  dems_need_flip, gops_can_lose, battleground_count,
  retirements_r, retirements_d, extra_data
) VALUES (
  (SELECT id FROM election_cycles WHERE name = '2026 Midterms'),
  (SELECT id FROM government_bodies WHERE slug = 'us-senate'),
  100, 33, 2,
  53, 47, 51,
  4, 2, 9,
  3, 4,
  '{"class_up": 2, "class_breakdown": {"republican": 20, "democrat": 13}}'::jsonb
);

-- House stats for 2026
INSERT INTO cycle_stats (
  cycle_id, body_id, total_seats, seats_up, special_elections,
  current_split_r, current_split_d, majority_needed,
  dems_need_flip, gops_can_lose, battleground_count,
  retirements_r, retirements_d, extra_data
) VALUES (
  (SELECT id FROM election_cycles WHERE name = '2026 Midterms'),
  (SELECT id FROM government_bodies WHERE slug = 'us-house'),
  435, 435, 0,
  220, 215, 218,
  3, 2, 42,
  28, 21,
  '{"battleground_breakdown": {"democrat_held": 22, "republican_held": 20}}'::jsonb
);


-- ---------- GLOSSARY ----------

INSERT INTO glossary (term, slug, short_def, long_def) VALUES
  ('Incumbent', 'incumbent',
    'The person currently holding the office.',
    'The incumbent is the person who currently holds the seat. They''re already in office and are running to keep their job. Incumbents usually have a big advantage because voters already know their name and they have access to more campaign resources. Historically, over 90% of incumbents win re-election.'),
  ('Toss-up', 'toss-up',
    'A race that could go either way. Neither party has a clear advantage.',
    'A toss-up is a race where polls and analysts think either candidate has roughly an equal chance of winning. These are the most closely watched races because they''re the ones most likely to determine which party controls Congress. Think of it like a coin flip.'),
  ('Lean R / Lean D', 'lean',
    'Slightly favors one party, but still competitive.',
    '''Lean R'' means the race slightly favors the Republican candidate, and ''Lean D'' means it slightly favors the Democrat. These races aren''t locked up — upsets happen. The other ratings in order are: Safe > Likely > Lean > Toss-up. ''Safe R'' means the Republican is almost certain to win.'),
  ('Open Seat', 'open-seat',
    'No incumbent is running. The seat is up for grabs.',
    'An open seat is a race where the current officeholder is not running for re-election — they''re retiring, running for a different office, or left for another reason. Open seats tend to be more competitive because neither candidate has the advantage of already being in office.'),
  ('Special Election', 'special-election',
    'An election held to fill a seat that was vacated early.',
    'A special election happens when a senator or representative leaves office before their term is up — maybe they resigned, died, or took another government job. The state then holds a special election to fill the empty seat. In 2026, Ohio and Florida have special elections because JD Vance became Vice President and Marco Rubio became Secretary of State.'),
  ('Class (Senate)', 'class',
    'One of 3 groups of senators. Each class is up for election every 6 years.',
    'The 100 Senate seats are divided into 3 classes (Class I, II, and III) of roughly 33 senators each. Every 2 years, one class is up for election. This means the entire Senate is never replaced at once — it''s designed to provide stability. In 2026, Class II is up for election.'),
  ('Majority', 'majority',
    'The party that controls more than half the seats.',
    'The majority party has more than half the seats in a chamber. In the Senate, that''s 51 out of 100. In the House, it''s 218 out of 435. The majority party controls which bills come to a vote, who chairs committees, and largely sets the agenda. The Majority Leader (Senate) or Speaker (House) is the most powerful person in that chamber.'),
  ('Midterm Election', 'midterm',
    'Elections held halfway through a president''s 4-year term.',
    'Midterm elections happen 2 years after a presidential election — in the middle of the president''s term. All 435 House seats and about one-third of Senate seats are up for election. Midterms historically have lower voter turnout than presidential elections, but they''re just as important for determining which party controls Congress.'),
  ('Primary Election', 'primary',
    'An election within a party to choose their candidate for the general election.',
    'Before the general election in November, each party holds a primary election where voters choose which candidate will represent that party. For example, if 3 Republicans are running for a Senate seat, the primary narrows it down to 1 Republican who then faces the Democrat (and any independents) in November.'),
  ('Flip', 'flip',
    'When a seat changes from one party to the other.',
    'A ''flip'' happens when a seat that was held by one party is won by the other party. For example, if a Republican-held Senate seat is won by a Democrat, that seat has ''flipped.'' Flips are what change the balance of power in Congress.'),
  ('Gerrymandering', 'gerrymandering',
    'Drawing district lines to give one party an unfair advantage.',
    'Gerrymandering is when the boundaries of a congressional district are drawn in a way that favors one political party. State legislatures typically draw these lines, and the party in power often draws them to benefit themselves. This can make some House races less competitive because the district was designed to favor one party.'),
  ('Caucus', 'caucus',
    'A group of lawmakers who share an interest or identity.',
    'A caucus is an informal group of members of Congress who come together around a shared interest, identity, or goal. Examples include the Congressional Black Caucus, the Freedom Caucus (conservative Republicans), or the Progressive Caucus (liberal Democrats). Caucuses can influence legislation and party strategy.');
