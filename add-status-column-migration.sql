-- Migration script to add the missing status column to student_groups table
-- Run this if you get "column 'status' does not exist" error

-- Add the status column if it doesn't exist
DO $$ 
BEGIN
    -- Check if the status column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'student_groups' 
        AND column_name = 'status'
    ) THEN
        -- Add the status column
        ALTER TABLE student_groups 
        ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';
        
        -- Add the check constraint
        ALTER TABLE student_groups 
        ADD CONSTRAINT check_status_values 
        CHECK (status IN ('active', 'stopped'));
        
        RAISE NOTICE 'Added status column to student_groups table';
    ELSE
        RAISE NOTICE 'Status column already exists in student_groups table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'student_groups' 
AND column_name = 'status';

-- Update any existing records to have 'active' status (if they don't have it)
UPDATE student_groups 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- Show the final table structure
SELECT 'Final table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'student_groups' 
ORDER BY ordinal_position;
