-- Remove price_per_session column from waiting_list table
ALTER TABLE waiting_list DROP COLUMN IF EXISTS price_per_session; 