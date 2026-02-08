-- ============================================================
-- The Midterm Project — Database Schema
-- Supabase (Postgres) migration
-- ============================================================

-- ---------- ENUMS ----------

CREATE TYPE party AS ENUM ('Democrat', 'Republican', 'Independent', 'Libertarian', 'Green', 'Other');

CREATE TYPE race_rating AS ENUM (
  'Safe D', 'Likely D', 'Lean D', 'Toss-up', 'Lean R', 'Likely R', 'Safe R'
);

CREATE TYPE candidate_status AS ENUM ('announced', 'primary_winner', 'withdrawn', 'won', 'lost', 'runoff');

CREATE TYPE govt_level AS ENUM ('federal', 'state', 'local');

CREATE TYPE chamber AS ENUM ('upper', 'lower', 'executive');

CREATE TYPE cycle_type AS ENUM ('midterm', 'presidential', 'special', 'primary', 'runoff');

CREATE TYPE stance AS ENUM ('supports', 'opposes', 'mixed', 'unknown');

CREATE TYPE volunteer_status AS ENUM ('active', 'inactive', 'pending');


-- ---------- STATES ----------

CREATE TABLE states (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  abbr        CHAR(2) NOT NULL UNIQUE,
  fips        CHAR(2) NOT NULL UNIQUE,
  house_districts INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_states_abbr ON states (abbr);
CREATE INDEX idx_states_fips ON states (fips);


-- ---------- GOVERNMENT BODIES ----------

CREATE TABLE government_bodies (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,        -- 'US Senate', 'US House', 'Governor', etc.
  slug        TEXT NOT NULL UNIQUE,        -- 'us-senate', 'us-house', 'governor'
  level       govt_level NOT NULL,
  chamber     chamber,                     -- upper (Senate), lower (House), executive (Governor)
  total_seats INTEGER,                     -- 100 for Senate, 435 for House, NULL for Governor
  majority_needed INTEGER,                 -- 51 for Senate, 218 for House
  term_years  INTEGER NOT NULL DEFAULT 2,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ---------- ELECTION CYCLES ----------

CREATE TABLE election_cycles (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL UNIQUE,    -- '2026 Midterms', '2028 Presidential'
  year            INTEGER NOT NULL,
  election_date   DATE NOT NULL,
  type            cycle_type NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT false,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one active cycle at a time
CREATE UNIQUE INDEX idx_one_active_cycle ON election_cycles (is_active) WHERE is_active = true;


-- ---------- DISTRICTS / SEATS ----------
-- A "district" represents a specific seat: e.g. CA House District 12, ME Senate seat, TX Governor

CREATE TABLE districts (
  id              SERIAL PRIMARY KEY,
  state_id        INTEGER NOT NULL REFERENCES states(id),
  body_id         INTEGER NOT NULL REFERENCES government_bodies(id),
  number          INTEGER,                 -- NULL for Senate/Governor, 1-53 for House
  senate_class    INTEGER CHECK (senate_class IN (1, 2, 3)),  -- only for Senate seats
  name            TEXT NOT NULL,           -- 'ME Senate Class II', 'CA House District 12'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (state_id, body_id, number, senate_class)
);

CREATE INDEX idx_districts_state ON districts (state_id);
CREATE INDEX idx_districts_body ON districts (body_id);


-- ---------- CANDIDATES ----------

CREATE TABLE candidates (
  id              SERIAL PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,    -- 'collins-susan', 'mills-janet'
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  party           party NOT NULL,
  photo_url       TEXT,
  website         TEXT,
  twitter         TEXT,
  bio             TEXT,
  role_title      TEXT,                    -- 'U.S. Senator (since 1997)'
  is_incumbent    BOOLEAN NOT NULL DEFAULT false,
  bioguide_id     TEXT,                   -- for linking to Congressional photos/APIs
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidates_party ON candidates (party);
CREATE INDEX idx_candidates_slug ON candidates (slug);


-- ---------- RACES ----------
-- A race is a specific contest in a specific cycle

CREATE TABLE races (
  id                  SERIAL PRIMARY KEY,
  cycle_id            INTEGER NOT NULL REFERENCES election_cycles(id),
  district_id         INTEGER NOT NULL REFERENCES districts(id),
  rating              race_rating,
  is_special_election BOOLEAN NOT NULL DEFAULT false,
  is_open_seat        BOOLEAN NOT NULL DEFAULT false,
  primary_date        DATE,
  general_date        DATE,
  why_competitive     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, district_id)
);

CREATE INDEX idx_races_cycle ON races (cycle_id);
CREATE INDEX idx_races_rating ON races (rating);


-- ---------- RACE ↔ CANDIDATE (join) ----------

CREATE TABLE race_candidates (
  id              SERIAL PRIMARY KEY,
  race_id         INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  candidate_id    INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status          candidate_status NOT NULL DEFAULT 'announced',
  is_incumbent    BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (race_id, candidate_id)
);

CREATE INDEX idx_race_candidates_race ON race_candidates (race_id);
CREATE INDEX idx_race_candidates_candidate ON race_candidates (candidate_id);


-- ---------- TOPICS ----------

CREATE TABLE topics (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,        -- 'Healthcare', 'Immigration'
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,                        -- emoji or icon class
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ---------- CANDIDATE POSITIONS ----------

CREATE TABLE candidate_positions (
  id              SERIAL PRIMARY KEY,
  candidate_id    INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  topic_id        INTEGER NOT NULL REFERENCES topics(id),
  stance          stance NOT NULL DEFAULT 'unknown',
  summary         TEXT NOT NULL,           -- one-liner describing their position
  source_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, topic_id, summary)
);

CREATE INDEX idx_positions_candidate ON candidate_positions (candidate_id);
CREATE INDEX idx_positions_topic ON candidate_positions (topic_id);


-- ---------- VOTING RECORDS ----------
-- Legislative votes by incumbents

CREATE TABLE votes (
  id              SERIAL PRIMARY KEY,
  candidate_id    INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  bill_name       TEXT NOT NULL,
  bill_number     TEXT,                    -- 'H.R. 3076', 'S. 2747'
  vote            TEXT NOT NULL CHECK (vote IN ('yea', 'nay', 'abstain', 'not_voting')),
  vote_date       DATE,
  topic_id        INTEGER REFERENCES topics(id),
  summary         TEXT,
  source_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_votes_candidate ON votes (candidate_id);
CREATE INDEX idx_votes_topic ON votes (topic_id);


-- ---------- CYCLE OVERVIEW STATS ----------
-- Denormalized stats for quick display (avoids counting queries)

CREATE TABLE cycle_stats (
  id              SERIAL PRIMARY KEY,
  cycle_id        INTEGER NOT NULL REFERENCES election_cycles(id) ON DELETE CASCADE,
  body_id         INTEGER NOT NULL REFERENCES government_bodies(id),
  total_seats     INTEGER,
  seats_up        INTEGER,
  special_elections INTEGER DEFAULT 0,
  current_split_r INTEGER,
  current_split_d INTEGER,
  majority_needed INTEGER,
  dems_need_flip  INTEGER,
  gops_can_lose   INTEGER,
  battleground_count INTEGER,
  retirements_r   INTEGER,
  retirements_d   INTEGER,
  extra_data      JSONB DEFAULT '{}',      -- for any body-specific stats
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, body_id)
);


-- ---------- GLOSSARY ----------

CREATE TABLE glossary (
  id          SERIAL PRIMARY KEY,
  term        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  short_def   TEXT NOT NULL,
  long_def    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ---------- VOLUNTEERS ----------

CREATE TABLE volunteers (
  id              SERIAL PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  state_id        INTEGER REFERENCES states(id),
  interests       TEXT[],                  -- array of interest tags
  status          volunteer_status NOT NULL DEFAULT 'pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_volunteers_email ON volunteers (email);
CREATE INDEX idx_volunteers_status ON volunteers (status);


-- ---------- RESOURCES ----------

CREATE TABLE resources (
  id              SERIAL PRIMARY KEY,
  title           TEXT NOT NULL,
  url             TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL CHECK (category IN ('voter_tool', 'news', 'education', 'data', 'government')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ---------- UPDATED_AT TRIGGERS ----------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_races_updated_at
  BEFORE UPDATE ON races
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_volunteers_updated_at
  BEFORE UPDATE ON volunteers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cycle_stats_updated_at
  BEFORE UPDATE ON cycle_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
