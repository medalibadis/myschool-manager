-- Add receipt_number column to receipts table
-- This generates a sequential human-readable receipt number like MY000001

-- Add a serial column for sequential numbering
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS receipt_number SERIAL;

-- Create a unique index on receipt_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'receipts' AND column_name = 'receipt_number';
