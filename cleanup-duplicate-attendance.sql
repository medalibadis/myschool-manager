-- Cleanup Duplicate Attendance Records
-- This script removes duplicate attendance records before adding the unique constraint

-- First, let's see if there are any duplicates
SELECT session_id, student_id, COUNT(*) as count
FROM attendance
GROUP BY session_id, student_id
HAVING COUNT(*) > 1;

-- Remove duplicates, keeping only the most recent record for each session_id, student_id combination
DELETE FROM attendance 
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY session_id, student_id 
                   ORDER BY created_at DESC
               ) as rn
        FROM attendance
    ) t
    WHERE t.rn > 1
);

-- Verify no duplicates remain
SELECT session_id, student_id, COUNT(*) as count
FROM attendance
GROUP BY session_id, student_id
HAVING COUNT(*) > 1; 