-- ============================================================
-- Row Level Security Policies
--
-- Strategy:
--   - All tables: public can READ
--   - Only authenticated users with 'admin' role can INSERT/UPDATE/DELETE
--   - Volunteers table: public can INSERT (signup form), only admin can read/update
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;


-- ========== PUBLIC READ (anonymous + authenticated) ==========

-- Reference data: anyone can read
CREATE POLICY "Public read: states" ON states FOR SELECT USING (true);
CREATE POLICY "Public read: government_bodies" ON government_bodies FOR SELECT USING (true);
CREATE POLICY "Public read: election_cycles" ON election_cycles FOR SELECT USING (true);
CREATE POLICY "Public read: districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Public read: candidates" ON candidates FOR SELECT USING (true);
CREATE POLICY "Public read: races" ON races FOR SELECT USING (true);
CREATE POLICY "Public read: race_candidates" ON race_candidates FOR SELECT USING (true);
CREATE POLICY "Public read: topics" ON topics FOR SELECT USING (true);
CREATE POLICY "Public read: candidate_positions" ON candidate_positions FOR SELECT USING (true);
CREATE POLICY "Public read: votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Public read: cycle_stats" ON cycle_stats FOR SELECT USING (true);
CREATE POLICY "Public read: glossary" ON glossary FOR SELECT USING (true);
CREATE POLICY "Public read: resources" ON resources FOR SELECT USING (true);


-- ========== VOLUNTEER SIGNUP (public insert) ==========

CREATE POLICY "Public insert: volunteers" ON volunteers
  FOR INSERT WITH CHECK (true);

-- Only admin can read volunteer data
CREATE POLICY "Admin read: volunteers" ON volunteers
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Only admin can update/delete volunteers
CREATE POLICY "Admin manage: volunteers" ON volunteers
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );


-- ========== ADMIN WRITE (all content tables) ==========

-- Helper: Check if user is admin
-- Usage in policies: auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'

CREATE POLICY "Admin write: states" ON states
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin write: government_bodies" ON government_bodies
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin write: election_cycles" ON election_cycles
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin write: districts" ON districts
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin write: candidates" ON candidates
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin write: races" ON races
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin write: race_candidates" ON race_candidates
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin write: topics" ON topics
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin write: candidate_positions" ON candidate_positions
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin write: votes" ON votes
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin write: cycle_stats" ON cycle_stats
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin write: glossary" ON glossary
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin write: resources" ON resources
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
