-- Add registration fee fields to students table
-- This migration adds the missing registration fee fields that the application expects

-- Add registration_fee_paid column (defaults to false for existing students)
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_fee_paid BOOLEAN DEFAULT false;

-- Add registration_fee_amount column (defaults to 500 for existing students)
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_fee_amount DECIMAL(10,2) DEFAULT 500;

-- Update any NULL values to proper defaults (in case columns existed but had NULL values)
UPDATE students 
SET registration_fee_paid = false 
WHERE registration_fee_paid IS NULL;

UPDATE students 
SET registration_fee_amount = 500 
WHERE registration_fee_amount IS NULL;

-- Add comments to document the fields
COMMENT ON COLUMN students.registration_fee_paid IS 'Whether the student has paid the registration fee';
COMMENT ON COLUMN students.registration_fee_amount IS 'Amount of registration fee (usually 500)';
