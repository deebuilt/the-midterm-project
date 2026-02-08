-- Migration 005: Admin panel preparation
-- - Drop unused glossary and resources tables
-- - Extend volunteers table with auth_id and application fields
-- - Update RLS policies for volunteer signup flow

-- ============================================================
-- 1. Drop unused tables (content stays hardcoded in the app)
-- ============================================================
DROP TABLE IF EXISTS glossary CASCADE;
DROP TABLE IF EXISTS resources CASCADE;

-- ============================================================
-- 2. Extend volunteers table
-- ============================================================

-- Link volunteers to Supabase Auth users
ALTER TABLE volunteers
  ADD COLUMN auth_id UUID REFERENCES auth.users(id);

-- Application / vetting fields
ALTER TABLE volunteers
  ADD COLUMN experience TEXT,
  ADD COLUMN availability TEXT,
  ADD COLUMN roles TEXT[],
  ADD COLUMN applied_at TIMESTAMPTZ DEFAULT now();

-- Partial unique index: one auth account per volunteer, but NULLs allowed
CREATE UNIQUE INDEX idx_volunteers_auth_id
  ON volunteers (auth_id) WHERE auth_id IS NOT NULL;

-- ============================================================
-- 3. RLS policy updates
-- ============================================================

-- Volunteer can read their own record (by matching auth_id)
CREATE POLICY "Volunteer self-read" ON volunteers
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND auth_id = auth.uid()
  );

-- Replace the overly-permissive public insert policy
DROP POLICY IF EXISTS "Public insert: volunteers" ON volunteers;

-- Anonymous form submissions: cannot set auth_id (prevents spoofing)
CREATE POLICY "Public signup: volunteers" ON volunteers
  FOR INSERT WITH CHECK (auth_id IS NULL);

-- Authenticated users can insert with their own auth_id only
CREATE POLICY "Authenticated signup: volunteers" ON volunteers
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND auth_id = auth.uid()
  );
