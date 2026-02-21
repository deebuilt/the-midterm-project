-- Migration 026: Dual-date chamber model
-- Instead of duplicating rows for bills that pass both chambers,
-- store chamber-specific dates and source URLs on a single row.
--
-- vote_date remains as the "primary" display date (first chamber to vote).
-- source_url remains as the primary display link.
-- senate_vote_date / house_vote_date track per-chamber vote dates.
-- senate_source_url / house_source_url track per-chamber roll call links.

ALTER TABLE votes ADD COLUMN senate_vote_date date;
ALTER TABLE votes ADD COLUMN house_vote_date date;
ALTER TABLE votes ADD COLUMN senate_source_url text;
ALTER TABLE votes ADD COLUMN house_source_url text;

-- Backfill existing rows: populate chamber-specific fields from current data
UPDATE votes
SET senate_vote_date = vote_date::date,
    senate_source_url = source_url
WHERE chamber = 'senate' AND vote_date IS NOT NULL;

UPDATE votes
SET house_vote_date = vote_date::date,
    house_source_url = source_url
WHERE chamber = 'house' AND vote_date IS NOT NULL;

-- For "both" rows, we only know the current vote_date/source_url —
-- put them in senate fields since most "both" bills were imported via Senate first.
-- Admin can correct these manually.
UPDATE votes
SET senate_vote_date = vote_date::date,
    senate_source_url = source_url
WHERE chamber = 'both' AND vote_date IS NOT NULL;
