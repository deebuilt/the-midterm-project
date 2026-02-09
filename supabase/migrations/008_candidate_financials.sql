-- ============================================================
-- Migration 008: Candidate Financials
-- Adds fundraising data columns from OpenFEC financial totals
-- ============================================================

-- Financial snapshot from FEC /candidate/{id}/totals/ endpoint
ALTER TABLE candidates ADD COLUMN funds_raised NUMERIC(14,2);
ALTER TABLE candidates ADD COLUMN funds_spent NUMERIC(14,2);
ALTER TABLE candidates ADD COLUMN cash_on_hand NUMERIC(14,2);
ALTER TABLE candidates ADD COLUMN fec_financials_updated_at TIMESTAMPTZ;
