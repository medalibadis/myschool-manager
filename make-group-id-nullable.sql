-- Migration to make group_id nullable in payments table
-- This allows balance additions (payments without a specific group)

-- First, drop the NOT NULL constraint
ALTER TABLE payments ALTER COLUMN group_id DROP NOT NULL;

-- Add a comment to explain the change
COMMENT ON COLUMN payments.group_id IS 'NULL for balance additions, INTEGER for group payments';
