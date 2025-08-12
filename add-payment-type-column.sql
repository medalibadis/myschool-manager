-- Migration to add payment_type column to payments table
-- This supports both group payments and balance additions

-- Add payment_type column with default value
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'group_payment';

-- Update existing payments to have the default payment type
UPDATE payments SET payment_type = 'group_payment' WHERE payment_type IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE payments ALTER COLUMN payment_type SET NOT NULL;

-- Add index for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);

-- Add index for payments with null group_id (balance additions) (if not exists)
CREATE INDEX IF NOT EXISTS idx_payments_null_group_id ON payments(group_id) WHERE group_id IS NULL;
