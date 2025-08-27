-- Update Teacher Attendance Table to Remove 'sick' Status
-- This script updates the status constraint to only allow essential statuses

-- First, update any existing records with 'sick' status to 'absent'
UPDATE teacher_attendance 
SET status = 'absent' 
WHERE status = 'sick';

-- Now alter the table to remove 'sick' from the status constraint
ALTER TABLE teacher_attendance 
DROP CONSTRAINT IF EXISTS teacher_attendance_status_check;

-- Add the new constraint without 'sick'
ALTER TABLE teacher_attendance 
ADD CONSTRAINT teacher_attendance_status_check 
CHECK (status IN ('present', 'late', 'absent', 'justified'));

-- Verify the change
SELECT DISTINCT status FROM teacher_attendance ORDER BY status;

-- Show the new constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'teacher_attendance'::regclass 
AND contype = 'c';
