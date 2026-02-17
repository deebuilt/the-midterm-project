-- ============================================================
-- Migration 017: Refactor votes → bills + candidate_votes
--
-- The votes table is currently EMPTY, so this is a safe schema change.
-- Split into: votes (bill data) + candidate_votes (join table).
-- ============================================================

-- 1. Create vote_enum type
CREATE TYPE vote_enum AS ENUM ('yea', 'nay', 'abstain', 'not_voting');

-- 2. Drop old indexes and constraints on votes table
DROP INDEX IF EXISTS idx_votes_candidate;
DROP INDEX IF EXISTS idx_votes_topic;

-- 3. Alter votes table: remove candidate_id and vote columns, keep bill data
-- Since table is empty, safe to just drop columns
ALTER TABLE votes
  DROP COLUMN IF EXISTS candidate_id,
  DROP COLUMN IF EXISTS vote;

-- 4. Add updated_at to votes (bills table) for consistency
ALTER TABLE votes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Re-create topic index on votes
CREATE INDEX idx_votes_topic ON votes (topic_id);

-- Add updated_at trigger
CREATE TRIGGER trg_votes_updated_at
  BEFORE UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Create candidate_votes join table
CREATE TABLE candidate_votes (
  id              SERIAL PRIMARY KEY,
  candidate_id    INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  vote_id         INTEGER NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  vote            vote_enum NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, vote_id)
);

CREATE INDEX idx_candidate_votes_candidate ON candidate_votes (candidate_id);
CREATE INDEX idx_candidate_votes_vote ON candidate_votes (vote_id);

-- 6. RLS policies for candidate_votes (match existing pattern: public read, admin write)
ALTER TABLE candidate_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read candidate_votes"
  ON candidate_votes FOR SELECT
  USING (true);

CREATE POLICY "Admin insert candidate_votes"
  ON candidate_votes FOR INSERT
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR (SELECT (auth.jwt() -> 'user_metadata' ->> 'role')) = 'admin'
  );

CREATE POLICY "Admin update candidate_votes"
  ON candidate_votes FOR UPDATE
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR (SELECT (auth.jwt() -> 'user_metadata' ->> 'role')) = 'admin'
  );

CREATE POLICY "Admin delete candidate_votes"
  ON candidate_votes FOR DELETE
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR (SELECT (auth.jwt() -> 'user_metadata' ->> 'role')) = 'admin'
  );
