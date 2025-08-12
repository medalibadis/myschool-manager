-- Fix Attendance Table Constraint
-- This script adds a unique constraint to prevent duplicate attendance records

-- Add unique constraint to attendance table
ALTER TABLE attendance 
ADD CONSTRAINT attendance_session_student_unique 
UNIQUE (session_id, student_id);

-- Verify the constraint was added
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'attendance' 
    AND tc.constraint_type = 'UNIQUE'; 