-- Fix attendance table constraint violation
-- This script handles existing data before adding constraints

-- First, let's see what values currently exist in the status column
SELECT 'Current status values in attendance table:' as info;
SELECT status, COUNT(*) as count
FROM attendance 
GROUP BY status
ORDER BY status;

-- Check if there are any NULL or invalid values
SELECT 'Checking for problematic values:' as info;
SELECT id, session_id, student_id, status, created_at
FROM attendance 
WHERE status IS NULL 
   OR status NOT IN ('present', 'absent', 'late', 'excused', 'default')
   OR status = '';

-- Update any NULL, empty, or invalid status values to 'default'
UPDATE attendance 
SET status = 'default' 
WHERE status IS NULL 
   OR status = '' 
   OR status NOT IN ('present', 'absent', 'late', 'excused', 'default');

-- Verify all values are now valid
SELECT 'Status values after cleanup:' as info;
SELECT status, COUNT(*) as count
FROM attendance 
GROUP BY status
ORDER BY status;

-- Now we can safely add the constraint
ALTER TABLE attendance 
DROP CONSTRAINT IF EXISTS check_attendance_status;

ALTER TABLE attendance 
ADD CONSTRAINT check_attendance_status 
CHECK (status IN ('present', 'absent', 'late', 'excused', 'default'));

-- Verify the constraint was added
SELECT 'Constraint verification:' as info;
SELECT constraint_name, check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'check_attendance_status';
