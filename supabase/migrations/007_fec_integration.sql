-- ============================================================
-- Migration 007: FEC Integration
-- Adds FEC candidate ID for OpenFEC API sync
-- ============================================================

-- Add FEC candidate ID column (e.g., "S8CA00502", "H0TX07123")
ALTER TABLE candidates ADD COLUMN fec_candidate_id TEXT;
CREATE UNIQUE INDEX idx_candidates_fec_id ON candidates (fec_candidate_id) WHERE fec_candidate_id IS NOT NULL;

-- Add an "office" hint to districts for easier FEC mapping
-- (body_id already tells us Senate vs House vs Governor, but this is handy for queries)
COMMENT ON COLUMN districts.number IS 'House district number (NULL for Senate/Governor seats)';
