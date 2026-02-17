-- Add result column to votes table (e.g. "Passed", "Rejected", "Agreed to")
ALTER TABLE votes ADD COLUMN result text;
