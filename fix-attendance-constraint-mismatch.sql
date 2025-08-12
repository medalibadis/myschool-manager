-- Fix attendance table constraint to match application status values
-- This script updates the constraint to allow all the status values your application uses

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
   OR status = '';

-- Update any NULL or empty status values to 'default'
UPDATE attendance 
SET status = 'default' 
WHERE status IS NULL 
   OR status = '';

-- Drop the existing constraint (if it exists)
ALTER TABLE attendance 
DROP CONSTRAINT IF EXISTS check_attendance_status;

-- Add the correct constraint that matches your application
ALTER TABLE attendance 
ADD CONSTRAINT check_attendance_status 
CHECK (status IN ('default', 'present', 'absent', 'justified', 'change', 'stop', 'new', 'too_late'));

-- Verify the constraint was added
SELECT 'Constraint verification:' as info;
SELECT constraint_name, check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'check_attendance_status';

-- Show final status values
SELECT 'Final status values:' as info;
SELECT status, COUNT(*) as count
FROM attendance 
GROUP BY status
ORDER BY status;
