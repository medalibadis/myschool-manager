-- Fix missing freeze columns in groups table
-- This migration adds the is_frozen and freeze_date columns that are referenced in the payment system

-- Add is_frozen column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' AND column_name = 'is_frozen'
    ) THEN
        ALTER TABLE groups ADD COLUMN is_frozen BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add freeze_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' AND column_name = 'freeze_date'
    ) THEN
        ALTER TABLE groups ADD COLUMN freeze_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update existing groups to have is_frozen = false by default
UPDATE groups SET is_frozen = FALSE WHERE is_frozen IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'groups' 
AND column_name IN ('is_frozen', 'freeze_date')
ORDER BY column_name;
