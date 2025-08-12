-- Simple Migration script to add the missing status column to student_groups table
-- This version works in any SQL interface (Supabase Dashboard, pgAdmin, etc.)

-- Add the status column if it doesn't exist
ALTER TABLE student_groups 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

-- Add the check constraint (drop first if it exists to avoid errors)
ALTER TABLE student_groups 
DROP CONSTRAINT IF EXISTS check_status_values;

ALTER TABLE student_groups 
ADD CONSTRAINT check_status_values 
CHECK (status IN ('active', 'stopped'));

-- Update any existing records to have 'active' status (if they don't have it)
UPDATE student_groups 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- Verify the column was added
SELECT 'Status column verification:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'student_groups' 
AND column_name = 'status';

-- Show the final table structure
SELECT 'Final table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'student_groups' 
ORDER BY ordinal_position;
