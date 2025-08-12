-- Complete Fix for All Database Issues
-- This script fixes both student_groups and attendance tables

-- ========================================
-- PART 1: Fix student_groups table
-- ========================================

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

-- ========================================
-- PART 2: Fix attendance table
-- ========================================

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
   OR status NOT IN ('default', 'present', 'absent', 'justified', 'change', 'stop', 'new', 'too_late');

-- Add check constraint for status values (drop first if it exists)
ALTER TABLE attendance 
DROP CONSTRAINT IF EXISTS check_attendance_status;

ALTER TABLE attendance 
ADD CONSTRAINT check_attendance_status 
CHECK (status IN ('default', 'present', 'absent', 'justified', 'change', 'stop', 'new', 'too_late'));

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

-- ========================================
-- PART 3: Verification
-- ========================================

-- Verify student_groups table
SELECT 'Student Groups Table Structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'student_groups' 
ORDER BY ordinal_position;

-- Verify attendance table
SELECT 'Attendance Table Structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'attendance' 
ORDER BY ordinal_position;

-- Show constraints
SELECT 'Table Constraints:' as info;
SELECT table_name, constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('student_groups', 'attendance');

-- Show triggers
SELECT 'Table Triggers:' as info;
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('student_groups', 'attendance');
