-- Fix student email constraint issue
-- This script allows students to have NULL or empty email values

-- First, update any existing empty email strings to NULL
UPDATE students SET email = NULL WHERE email = '' OR email IS NULL;

-- Drop the existing unique constraint on email
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_email_key;

-- Add a new unique constraint that only applies to non-NULL, non-empty emails
CREATE UNIQUE INDEX idx_students_email_unique 
ON students(email) 
WHERE email IS NOT NULL AND email != '';

-- Also update the waiting_list table to handle empty emails
UPDATE waiting_list SET email = NULL WHERE email = '' OR email IS NULL;

-- Drop the existing unique constraint on waiting_list email
ALTER TABLE waiting_list DROP CONSTRAINT IF EXISTS waiting_list_email_key;

-- Add a new unique constraint for waiting_list that only applies to non-NULL, non-empty emails
CREATE UNIQUE INDEX idx_waiting_list_email_unique 
ON waiting_list(email) 
WHERE email IS NOT NULL AND email != '';

-- Verify the changes
SELECT 
    'students' as table_name,
    COUNT(*) as total_students,
    COUNT(email) as students_with_email,
    COUNT(*) - COUNT(email) as students_without_email
FROM students
UNION ALL
SELECT 
    'waiting_list' as table_name,
    COUNT(*) as total_students,
    COUNT(email) as students_with_email,
    COUNT(*) - COUNT(email) as students_without_email
FROM waiting_list; 