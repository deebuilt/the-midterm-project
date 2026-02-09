-- Seed incumbent senators for all 2026 Senate races
-- 23 Class II incumbents + 2 special election incumbents (OH, FL)
-- (10 Class II incumbents already exist: Collins, Tillis, Ossoff, Peters, Ricketts, Ernst, Cornyn, Warner, Hickenlooper, Graham)

INSERT INTO candidates (slug, first_name, last_name, party, photo_url, website, twitter, bio, role_title, is_incumbent, bioguide_id)
VALUES
  -- Alabama
  ('tuberville-tommy', 'Tommy', 'Tuberville', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/T000278.jpg',
   'https://www.tuberville.senate.gov/', 'SenTuberville', NULL,
   'U.S. Senator (retiring)', true, 'T000278'),

  -- Alaska
  ('sullivan-dan', 'Dan', 'Sullivan', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/S001198.jpg',
   'https://www.sullivan.senate.gov/', 'SenDanSullivan', NULL,
   'U.S. Senator (since 2015)', true, 'S001198'),

  -- Arkansas
  ('cotton-tom', 'Tom', 'Cotton', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/C001095.jpg',
   'https://www.cotton.senate.gov/', 'SenTomCotton', NULL,
   'U.S. Senator (since 2015)', true, 'C001095'),

  -- Delaware
  ('coons-chris', 'Chris', 'Coons', 'Democrat',
   'https://unitedstates.github.io/images/congress/450x550/C001088.jpg',
   'https://www.coons.senate.gov/', 'ChrisCoons', NULL,
   'U.S. Senator (since 2010)', true, 'C001088'),

  -- Idaho
  ('risch-jim', 'Jim', 'Risch', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/R000584.jpg',
   'https://www.risch.senate.gov/', 'SenatorRisch', NULL,
   'U.S. Senator (since 2009)', true, 'R000584'),

  -- Illinois
  ('durbin-dick', 'Dick', 'Durbin', 'Democrat',
   'https://unitedstates.github.io/images/congress/450x550/D000563.jpg',
   'https://www.durbin.senate.gov/', 'SenatorDurbin', NULL,
   'U.S. Senator (retiring)', true, 'D000563'),

  -- Kansas
  ('marshall-roger', 'Roger', 'Marshall', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/M001198.jpg',
   'https://www.marshall.senate.gov/', 'RogerMarshallMD', NULL,
   'U.S. Senator (since 2021)', true, 'M001198'),

  -- Kentucky
  ('mcconnell-mitch', 'Mitch', 'McConnell', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/M000355.jpg',
   'https://www.mcconnell.senate.gov/', 'LeaderMcConnell', NULL,
   'U.S. Senator (retiring)', true, 'M000355'),

  -- Louisiana
  ('cassidy-bill', 'Bill', 'Cassidy', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/C001075.jpg',
   'https://www.cassidy.senate.gov/', 'SenBillCassidy', NULL,
   'U.S. Senator (since 2015)', true, 'C001075'),

  -- Massachusetts
  ('markey-ed', 'Ed', 'Markey', 'Democrat',
   'https://unitedstates.github.io/images/congress/450x550/M000133.jpg',
   'https://www.markey.senate.gov/', 'SenMarkey', NULL,
   'U.S. Senator (since 2013)', true, 'M000133'),

  -- Minnesota
  ('smith-tina', 'Tina', 'Smith', 'Democrat',
   'https://unitedstates.github.io/images/congress/450x550/S001203.jpg',
   'https://www.smith.senate.gov/', 'SenTinaSmith', NULL,
   'U.S. Senator (retiring)', true, 'S001203'),

  -- Mississippi
  ('hyde-smith-cindy', 'Cindy', 'Hyde-Smith', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/H001079.jpg',
   'https://www.hydesmith.senate.gov/', 'SenHydeSmith', NULL,
   'U.S. Senator (since 2018)', true, 'H001079'),

  -- Montana
  ('daines-steve', 'Steve', 'Daines', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/D000618.jpg',
   'https://www.daines.senate.gov/', 'SteveDaines', NULL,
   'U.S. Senator (since 2015)', true, 'D000618'),

  -- New Hampshire
  ('shaheen-jeanne', 'Jeanne', 'Shaheen', 'Democrat',
   'https://unitedstates.github.io/images/congress/450x550/S001181.jpg',
   'https://www.shaheen.senate.gov/', 'SenatorShaheen', NULL,
   'U.S. Senator (retiring)', true, 'S001181'),

  -- New Jersey
  ('booker-cory', 'Cory', 'Booker', 'Democrat',
   'https://unitedstates.github.io/images/congress/450x550/B001288.jpg',
   'https://www.booker.senate.gov/', 'CoryBooker', NULL,
   'U.S. Senator (since 2013)', true, 'B001288'),

  -- New Mexico
  ('lujan-ben-ray', 'Ben Ray', 'Luján', 'Democrat',
   'https://unitedstates.github.io/images/congress/450x550/L000570.jpg',
   'https://www.lujan.senate.gov/', 'SenatorLujan', NULL,
   'U.S. Senator (since 2021)', true, 'L000570'),

  -- Oklahoma
  ('mullin-markwayne', 'Markwayne', 'Mullin', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/M001190.jpg',
   'https://www.mullin.senate.gov/', 'SenMullin', NULL,
   'U.S. Senator (since 2023)', true, 'M001190'),

  -- Oregon
  ('merkley-jeff', 'Jeff', 'Merkley', 'Democrat',
   'https://unitedstates.github.io/images/congress/450x550/M001176.jpg',
   'https://www.merkley.senate.gov/', 'SenJeffMerkley', NULL,
   'U.S. Senator (since 2009)', true, 'M001176'),

  -- Rhode Island
  ('reed-jack', 'Jack', 'Reed', 'Democrat',
   'https://unitedstates.github.io/images/congress/450x550/R000122.jpg',
   'https://www.reed.senate.gov/', 'SenJackReed', NULL,
   'U.S. Senator (since 1997)', true, 'R000122'),

  -- South Dakota
  ('rounds-mike', 'Mike', 'Rounds', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/R000605.jpg',
   'https://www.rounds.senate.gov/', 'SenatorRounds', NULL,
   'U.S. Senator (since 2015)', true, 'R000605'),

  -- Tennessee
  ('hagerty-bill', 'Bill', 'Hagerty', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/H000601.jpg',
   'https://www.hagerty.senate.gov/', 'SenatorHagerty', NULL,
   'U.S. Senator (since 2021)', true, 'H000601'),

  -- West Virginia
  ('capito-shelley-moore', 'Shelley Moore', 'Capito', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/C001047.jpg',
   'https://www.capito.senate.gov/', 'SenCapito', NULL,
   'U.S. Senator (since 2015)', true, 'C001047'),

  -- Wyoming
  ('lummis-cynthia', 'Cynthia', 'Lummis', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/L000571.jpg',
   'https://www.lummis.senate.gov/', 'SenLummis', NULL,
   'U.S. Senator (retiring)', true, 'L000571'),

  -- Special Election seats (Class III vacancies, elected Nov 2026)

  -- Ohio (replacing JD Vance, who became VP)
  ('husted-jon', 'Jon', 'Husted', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/H001104.jpg',
   'https://www.husted.senate.gov/', 'SenJonHusted', NULL,
   'U.S. Senator (appointed 2025)', true, 'H001104'),

  -- Florida (replacing Marco Rubio, who became Secretary of State)
  ('moody-ashley', 'Ashley', 'Moody', 'Republican',
   'https://unitedstates.github.io/images/congress/450x550/M001244.jpg',
   'https://www.moody.senate.gov/', 'SenAshleyMoody', NULL,
   'U.S. Senator (appointed 2025)', true, 'M001244')

ON CONFLICT (slug) DO NOTHING;
