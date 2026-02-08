-- ============================================================
-- Add governor and other-senator columns to states table
-- These were previously hardcoded in src/data/states.ts
-- ============================================================

ALTER TABLE states
  ADD COLUMN current_governor       TEXT,
  ADD COLUMN current_governor_party  party,
  ADD COLUMN other_senator          TEXT,
  ADD COLUMN other_senator_party    party;

-- Populate from the hardcoded data in states.ts

UPDATE states SET current_governor = 'Kay Ivey',              current_governor_party = 'Republican', other_senator = 'Katie Britt',         other_senator_party = 'Republican' WHERE abbr = 'AL';
UPDATE states SET current_governor = 'Mike Dunleavy',         current_governor_party = 'Republican', other_senator = 'Lisa Murkowski',      other_senator_party = 'Republican' WHERE abbr = 'AK';
UPDATE states SET current_governor = 'Katie Hobbs',           current_governor_party = 'Democrat',   other_senator = 'Ruben Gallego',       other_senator_party = 'Democrat'   WHERE abbr = 'AZ';
UPDATE states SET current_governor = 'Sarah Huckabee Sanders',current_governor_party = 'Republican', other_senator = 'John Boozman',        other_senator_party = 'Republican' WHERE abbr = 'AR';
UPDATE states SET current_governor = 'Gavin Newsom',          current_governor_party = 'Democrat',   other_senator = 'Alex Padilla',        other_senator_party = 'Democrat'   WHERE abbr = 'CA';
UPDATE states SET current_governor = 'Jared Polis',           current_governor_party = 'Democrat',   other_senator = 'Michael Bennet',      other_senator_party = 'Democrat'   WHERE abbr = 'CO';
UPDATE states SET current_governor = 'Ned Lamont',            current_governor_party = 'Democrat',   other_senator = 'Richard Blumenthal',  other_senator_party = 'Democrat'   WHERE abbr = 'CT';
UPDATE states SET                                                                                    other_senator = 'Lisa Blunt Rochester',other_senator_party = 'Democrat'   WHERE abbr = 'DE';
UPDATE states SET current_governor = 'Ron DeSantis',          current_governor_party = 'Republican', other_senator = 'Rick Scott',          other_senator_party = 'Republican' WHERE abbr = 'FL';
UPDATE states SET current_governor = 'Brian Kemp',            current_governor_party = 'Republican', other_senator = 'Jon Ossoff',          other_senator_party = 'Democrat'   WHERE abbr = 'GA';
UPDATE states SET current_governor = 'Josh Green',            current_governor_party = 'Democrat',   other_senator = 'Brian Schatz',        other_senator_party = 'Democrat'   WHERE abbr = 'HI';
UPDATE states SET current_governor = 'Brad Little',           current_governor_party = 'Republican', other_senator = 'Mike Crapo',          other_senator_party = 'Republican' WHERE abbr = 'ID';
UPDATE states SET current_governor = 'J.B. Pritzker',         current_governor_party = 'Democrat',   other_senator = 'Tammy Duckworth',    other_senator_party = 'Democrat'   WHERE abbr = 'IL';
UPDATE states SET                                                                                    other_senator = 'Jim Banks',           other_senator_party = 'Republican' WHERE abbr = 'IN';
UPDATE states SET current_governor = 'Kim Reynolds',          current_governor_party = 'Republican', other_senator = 'Chuck Grassley',      other_senator_party = 'Republican' WHERE abbr = 'IA';
UPDATE states SET current_governor = 'Laura Kelly',           current_governor_party = 'Democrat',   other_senator = 'Roger Marshall',      other_senator_party = 'Republican' WHERE abbr = 'KS';
UPDATE states SET                                                                                    other_senator = 'Rand Paul',           other_senator_party = 'Republican' WHERE abbr = 'KY';
UPDATE states SET                                                                                    other_senator = 'John Kennedy',        other_senator_party = 'Republican' WHERE abbr = 'LA';
UPDATE states SET current_governor = 'Janet Mills',           current_governor_party = 'Democrat',   other_senator = 'Angus King',          other_senator_party = 'Independent' WHERE abbr = 'ME';
UPDATE states SET current_governor = 'Wes Moore',             current_governor_party = 'Democrat',   other_senator = 'Angela Alsobrooks',   other_senator_party = 'Democrat'   WHERE abbr = 'MD';
UPDATE states SET current_governor = 'Maura Healey',          current_governor_party = 'Democrat',   other_senator = 'Elizabeth Warren',    other_senator_party = 'Democrat'   WHERE abbr = 'MA';
UPDATE states SET current_governor = 'Gretchen Whitmer',      current_governor_party = 'Democrat',   other_senator = 'Elissa Slotkin',     other_senator_party = 'Democrat'   WHERE abbr = 'MI';
UPDATE states SET current_governor = 'Tim Walz',              current_governor_party = 'Democrat',   other_senator = 'Amy Klobuchar',      other_senator_party = 'Democrat'   WHERE abbr = 'MN';
UPDATE states SET                                                                                    other_senator = 'Cindy Hyde-Smith',   other_senator_party = 'Republican' WHERE abbr = 'MS';
UPDATE states SET                                                                                    other_senator = 'Josh Hawley',        other_senator_party = 'Republican' WHERE abbr = 'MO';
UPDATE states SET current_governor = 'Greg Gianforte',        current_governor_party = 'Republican', other_senator = 'Tim Sheehy',         other_senator_party = 'Republican' WHERE abbr = 'MT';
UPDATE states SET current_governor = 'Jim Pillen',            current_governor_party = 'Republican', other_senator = 'Pete Ricketts',      other_senator_party = 'Republican' WHERE abbr = 'NE';
UPDATE states SET current_governor = 'Joe Lombardo',          current_governor_party = 'Republican', other_senator = 'Jacky Rosen',        other_senator_party = 'Democrat'   WHERE abbr = 'NV';
UPDATE states SET current_governor = 'Kelly Ayotte',          current_governor_party = 'Republican', other_senator = 'Maggie Hassan',      other_senator_party = 'Democrat'   WHERE abbr = 'NH';
UPDATE states SET current_governor = 'Phil Murphy',           current_governor_party = 'Democrat',   other_senator = 'Andy Kim',           other_senator_party = 'Democrat'   WHERE abbr = 'NJ';
UPDATE states SET current_governor = 'Michelle Lujan Grisham',current_governor_party = 'Democrat',   other_senator = 'Ben Ray Lujan',     other_senator_party = 'Democrat'   WHERE abbr = 'NM';
UPDATE states SET current_governor = 'Kathy Hochul',          current_governor_party = 'Democrat',   other_senator = 'Kirsten Gillibrand', other_senator_party = 'Democrat'   WHERE abbr = 'NY';
UPDATE states SET                                                                                    other_senator = 'Ted Budd',           other_senator_party = 'Republican' WHERE abbr = 'NC';
UPDATE states SET                                                                                    other_senator = 'Kevin Cramer',       other_senator_party = 'Republican' WHERE abbr = 'ND';
UPDATE states SET current_governor = 'Mike DeWine',           current_governor_party = 'Republican', other_senator = 'Sherrod Brown',      other_senator_party = 'Republican' WHERE abbr = 'OH';
UPDATE states SET current_governor = 'Kevin Stitt',           current_governor_party = 'Republican', other_senator = 'Markwayne Mullin',  other_senator_party = 'Republican' WHERE abbr = 'OK';
UPDATE states SET current_governor = 'Tina Kotek',            current_governor_party = 'Democrat',   other_senator = 'Ron Wyden',         other_senator_party = 'Democrat'   WHERE abbr = 'OR';
UPDATE states SET current_governor = 'Josh Shapiro',          current_governor_party = 'Democrat',   other_senator = 'John Fetterman',    other_senator_party = 'Democrat'   WHERE abbr = 'PA';
UPDATE states SET current_governor = 'Dan McKee',             current_governor_party = 'Democrat',   other_senator = 'Sheldon Whitehouse', other_senator_party = 'Democrat'   WHERE abbr = 'RI';
UPDATE states SET current_governor = 'Henry McMaster',        current_governor_party = 'Republican', other_senator = 'Tim Scott',          other_senator_party = 'Republican' WHERE abbr = 'SC';
UPDATE states SET current_governor = 'Kristi Noem',           current_governor_party = 'Republican', other_senator = 'John Thune',         other_senator_party = 'Republican' WHERE abbr = 'SD';
UPDATE states SET current_governor = 'Bill Lee',              current_governor_party = 'Republican', other_senator = 'Bill Hagerty',       other_senator_party = 'Republican' WHERE abbr = 'TN';
UPDATE states SET current_governor = 'Greg Abbott',           current_governor_party = 'Republican', other_senator = 'Ted Cruz',           other_senator_party = 'Republican' WHERE abbr = 'TX';
UPDATE states SET                                                                                    other_senator = 'John Curtis',        other_senator_party = 'Republican' WHERE abbr = 'UT';
UPDATE states SET current_governor = 'Phil Scott',            current_governor_party = 'Republican', other_senator = 'Bernie Sanders',     other_senator_party = 'Independent' WHERE abbr = 'VT';
UPDATE states SET current_governor = 'Glenn Youngkin',        current_governor_party = 'Republican', other_senator = 'Tim Kaine',          other_senator_party = 'Democrat'   WHERE abbr = 'VA';
UPDATE states SET                                                                                    other_senator = 'Maria Cantwell',     other_senator_party = 'Democrat'   WHERE abbr = 'WA';
UPDATE states SET                                                                                    other_senator = 'Jim Justice',        other_senator_party = 'Republican' WHERE abbr = 'WV';
UPDATE states SET current_governor = 'Tony Evers',            current_governor_party = 'Democrat',   other_senator = 'Ron Johnson',        other_senator_party = 'Republican' WHERE abbr = 'WI';
UPDATE states SET                                                                                    other_senator = 'Cynthia Lummis',    other_senator_party = 'Republican' WHERE abbr = 'WY';
