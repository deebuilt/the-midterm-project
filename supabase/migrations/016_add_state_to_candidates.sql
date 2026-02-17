-- Add state_id to candidates table
-- This gives candidates a direct state association independent of race_candidates.
-- Previously the only path was: candidates → race_candidates → races → districts → states
-- which required race_candidates to be populated.

ALTER TABLE candidates ADD COLUMN state_id INTEGER REFERENCES states(id);
CREATE INDEX idx_candidates_state ON candidates (state_id);

-- Backfill state_id for all 35 Senate incumbents (Class II + 2 special elections)
-- Matching by candidate slug since slugs are unique and stable

-- Class II incumbents (from migrations 003 + 010)
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'AL') WHERE slug = 'tuberville-tommy';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'AK') WHERE slug = 'sullivan-dan';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'AR') WHERE slug = 'cotton-tom';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'CO') WHERE slug = 'hickenlooper-john';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'DE') WHERE slug = 'coons-chris';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'GA') WHERE slug = 'ossoff-jon';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'ID') WHERE slug = 'risch-jim';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'IL') WHERE slug = 'durbin-dick';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'IA') WHERE slug = 'ernst-joni';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'KS') WHERE slug = 'marshall-roger';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'KY') WHERE slug = 'mcconnell-mitch';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'LA') WHERE slug = 'cassidy-bill';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'ME') WHERE slug = 'collins-susan';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'MA') WHERE slug = 'markey-ed';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'MI') WHERE slug = 'peters-gary';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'MN') WHERE slug = 'smith-tina';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'MS') WHERE slug = 'hyde-smith-cindy';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'MT') WHERE slug = 'daines-steve';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'NE') WHERE slug = 'ricketts-pete';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'NH') WHERE slug = 'shaheen-jeanne';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'NJ') WHERE slug = 'booker-cory';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'NM') WHERE slug = 'lujan-ben-ray';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'NC') WHERE slug = 'tillis-thom';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'OK') WHERE slug = 'mullin-markwayne';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'OR') WHERE slug = 'merkley-jeff';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'RI') WHERE slug = 'reed-jack';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'SC') WHERE slug = 'graham-lindsey';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'SD') WHERE slug = 'rounds-mike';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'TN') WHERE slug = 'hagerty-bill';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'TX') WHERE slug = 'cornyn-john';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'VA') WHERE slug = 'warner-mark';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'WV') WHERE slug = 'capito-shelley-moore';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'WY') WHERE slug = 'lummis-cynthia';

-- Special election incumbents
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'OH') WHERE slug = 'husted-jon';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'FL') WHERE slug = 'moody-ashley';

-- Non-incumbent candidates from seed data (003) that have known states
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'ME') WHERE slug = 'mills-janet';
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'NC') WHERE slug IN ('cooper-roy', 'whatley-michael');
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'GA') WHERE slug IN ('carter-buddy', 'mccormick-rich');
UPDATE candidates SET state_id = (SELECT id FROM states WHERE abbr = 'MI') WHERE slug IN ('stevens-haley', 'mcmorrow-mallory', 'el-sayed-abdul');
