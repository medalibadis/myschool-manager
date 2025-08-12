-- Simple Migration script to fix attendance table structure
-- This version works in any SQL interface (Supabase Dashboard, pgAdmin, etc.)

-- Add updated_at column if it doesn't exist
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add status column if it doesn't exist
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'default';

-- First, clean up any invalid status values
UPDATE attendance 
SET status = 'default' 
WHERE status IS NULL 
   OR status = '' 
   OR status NOT IN ('present', 'absent', 'late', 'excused', 'default');

-- Add check constraint for status values (drop first if it exists)
ALTER TABLE attendance 
DROP CONSTRAINT IF EXISTS check_attendance_status;

ALTER TABLE attendance 
ADD CONSTRAINT check_attendance_status 
CHECK (status IN ('present', 'absent', 'late', 'excused', 'default'));

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at (drop first if it exists)
DROP TRIGGER IF EXISTS trigger_update_attendance_updated_at ON attendance;
CREATE TRIGGER trigger_update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_updated_at();

-- Verify the final table structure
SELECT 'Final attendance table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'attendance' 
ORDER BY ordinal_position;

-- Show any constraints
SELECT 'Table constraints:' as info;
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'attendance';
