-- Clean up test groups and all associated data
-- This script will safely remove test groups and all related records

-- Step 1: First, let's identify test groups
SELECT 
    'Test Groups Found' as info,
    id,
    name,
    teacher_id,
    created_at
FROM groups 
WHERE LOWER(name) LIKE '%test%' 
   OR LOWER(name) LIKE '%demo%'
   OR LOWER(name) LIKE '%sample%'
   OR name = 'Test Group'
   OR name = 'Test Group 2'
ORDER BY created_at;

-- Step 2: Show what data will be affected
WITH test_groups AS (
    SELECT id, name
    FROM groups 
    WHERE LOWER(name) LIKE '%test%' 
       OR LOWER(name) LIKE '%demo%'
       OR LOWER(name) LIKE '%sample%'
       OR name = 'Test Group'
       OR name = 'Test Group 2'
)
SELECT 
    'Data to be removed' as info,
    (SELECT COUNT(*) FROM student_groups WHERE group_id IN (SELECT id FROM test_groups)) as students_in_test_groups,
    (SELECT COUNT(*) FROM sessions WHERE group_id IN (SELECT id FROM test_groups)) as sessions_count,
    (SELECT COUNT(*) FROM attendance WHERE session_id IN (SELECT id FROM sessions WHERE group_id IN (SELECT id FROM test_groups))) as attendance_count,
    (SELECT COUNT(*) FROM payments WHERE group_id IN (SELECT id FROM test_groups)) as payments_count,
    (SELECT COUNT(*) FROM student_groups WHERE group_id IN (SELECT id FROM test_groups)) as student_groups_count;

-- Step 3: Get the test group IDs for deletion
WITH test_group_ids AS (
    SELECT id, name
    FROM groups 
    WHERE LOWER(name) LIKE '%test%' 
       OR LOWER(name) LIKE '%demo%'
       OR LOWER(name) LIKE '%sample%'
       OR name = 'Test Group'
       OR name = 'Test Group 2'
)
-- Step 4: Delete attendance records for test group sessions
DELETE FROM attendance 
WHERE session_id IN (
    SELECT s.id 
    FROM sessions s
    INNER JOIN test_group_ids tg ON s.group_id = tg.id
);

-- Step 5: Delete sessions for test groups
DELETE FROM sessions 
WHERE group_id IN (
    SELECT id 
    FROM groups 
    WHERE LOWER(name) LIKE '%test%' 
       OR LOWER(name) LIKE '%demo%'
       OR LOWER(name) LIKE '%sample%'
       OR name = 'Test Group'
       OR name = 'Test Group 2'
);

-- Step 6: Delete payments related to test groups
DELETE FROM payments 
WHERE group_id IN (
    SELECT id 
    FROM groups 
    WHERE LOWER(name) LIKE '%test%' 
       OR LOWER(name) LIKE '%demo%'
       OR LOWER(name) LIKE '%sample%'
       OR name = 'Test Group'
       OR name = 'Test Group 2'
);

-- Step 7: Delete student-group relationships for test groups
DELETE FROM student_groups 
WHERE group_id IN (
    SELECT id 
    FROM groups 
    WHERE LOWER(name) LIKE '%test%' 
       OR LOWER(name) LIKE '%demo%'
       OR LOWER(name) LIKE '%sample%'
       OR name = 'Test Group'
       OR name = 'Test Group 2'
);

-- Step 8: Delete students that belong only to test groups
-- (Students who have no other group memberships)
DELETE FROM students 
WHERE id IN (
    SELECT sg.student_id
    FROM student_groups sg
    WHERE sg.group_id IN (
        SELECT id 
        FROM groups 
        WHERE LOWER(name) LIKE '%test%' 
           OR LOWER(name) LIKE '%demo%'
           OR LOWER(name) LIKE '%sample%'
           OR name = 'Test Group'
           OR name = 'Test Group 2'
    )
    AND NOT EXISTS (
        SELECT 1 
        FROM student_groups sg2 
        WHERE sg2.student_id = sg.student_id 
        AND sg2.group_id NOT IN (
            SELECT id 
            FROM groups 
            WHERE LOWER(name) LIKE '%test%' 
               OR LOWER(name) LIKE '%demo%'
               OR LOWER(name) LIKE '%sample%'
               OR name = 'Test Group'
               OR name = 'Test Group 2'
        )
    )
);

-- Step 9: Delete the test groups themselves
DELETE FROM groups 
WHERE LOWER(name) LIKE '%test%' 
   OR LOWER(name) LIKE '%demo%'
   OR LOWER(name) LIKE '%sample%'
   OR name = 'Test Group'
   OR name = 'Test Group 2';

-- Step 10: Verify cleanup results
SELECT 
    'Cleanup Complete - Remaining Groups' as info,
    COUNT(*) as total_groups,
    STRING_AGG(name, ', ') as group_names
FROM groups;

-- Step 11: Show remaining students count
SELECT 
    'Remaining Students' as info,
    COUNT(*) as total_students
FROM students;

-- Step 12: Show remaining sessions count
SELECT 
    'Remaining Sessions' as info,
    COUNT(*) as total_sessions
FROM sessions;

-- Step 13: Show remaining payments count
SELECT 
    'Remaining Payments' as info,
    COUNT(*) as total_payments
FROM payments;

-- Step 14: Show remaining attendance count
SELECT 
    'Remaining Attendance Records' as info,
    COUNT(*) as total_attendance
FROM attendance;
