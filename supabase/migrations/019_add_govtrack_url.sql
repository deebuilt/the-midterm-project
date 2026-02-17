-- Add GovTrack URL to candidates table for linking to candidate profiles
ALTER TABLE candidates ADD COLUMN govtrack_url TEXT;
