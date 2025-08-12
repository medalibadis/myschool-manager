-- Fix payments table for balance additions and debt payments
-- This script makes group_id nullable and ensures proper structure

-- Make group_id column nullable (required for balance additions)
ALTER TABLE payments 
ALTER COLUMN group_id DROP NOT NULL;

-- Add payment_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'payment_type'
    ) THEN
        ALTER TABLE payments ADD COLUMN payment_type VARCHAR(50) DEFAULT 'group_payment';
    END IF;
END $$;

-- Add admin_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'admin_name'
    ) THEN
        ALTER TABLE payments ADD COLUMN admin_name VARCHAR(255);
    END IF;
END $$;

-- Add discount column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'discount'
    ) THEN
        ALTER TABLE payments ADD COLUMN discount DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add original_amount column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'original_amount'
    ) THEN
        ALTER TABLE payments ADD COLUMN original_amount DECIMAL(10,2);
    END IF;
END $$;

-- Update existing records to have proper payment_type
UPDATE payments 
SET payment_type = 'group_payment' 
WHERE payment_type IS NULL;

-- Update existing records to have original_amount = amount if not set
UPDATE payments 
SET original_amount = amount 
WHERE original_amount IS NULL;

-- Verify the table structure
SELECT 'Payments Table Structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- Show sample data
SELECT 'Sample payments data:' as info;
SELECT id, student_id, group_id, amount, payment_type, created_at
FROM payments 
LIMIT 5;
