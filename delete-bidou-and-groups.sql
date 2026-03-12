-- DELETE STUDENT "bidou" AND HIS GROUPS
-- Student ID: 4ad9ca36-433c-4fd0-8c5d-d1ffc2306259
-- Groups: 44 (Ger|C1|Teens) and any other groups

-- ========================================
-- STEP 1: IDENTIFY GROUPS TO DELETE
-- ========================================
SELECT '=== IDENTIFYING GROUPS TO DELETE ===' as info;

SELECT 
    g.id as group_id,
    g.name as group_name,
    COUNT(DISTINCT sg.student_id) as student_count
FROM groups g
JOIN student_groups sg ON sg.group_id = g.id
WHERE sg.student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259'
GROUP BY g.id, g.name;

-- ========================================
-- STEP 2: DELETE IN ORDER (respecting foreign key constraints)
-- ========================================

-- Delete receipts for this student
SELECT '=== DELETING RECEIPTS ===' as info;
DELETE FROM receipts WHERE student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259';

-- Delete attendance records for this student
SELECT '=== DELETING ATTENDANCE ===' as info;
DELETE FROM attendance WHERE student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259';

-- Delete payments for this student
SELECT '=== DELETING PAYMENTS ===' as info;
DELETE FROM payments WHERE student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259';

-- Delete student_groups relationships for this student
SELECT '=== DELETING STUDENT_GROUPS RELATIONSHIPS ===' as info;
DELETE FROM student_groups WHERE student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259';

-- Delete waiting list entries for this student (if any)
SELECT '=== DELETING WAITING LIST ENTRIES ===' as info;
DELETE FROM waiting_list WHERE name = 'bidou' OR phone IN (
    SELECT phone FROM students WHERE id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259'
);

-- Delete call logs for this student (if any)
SELECT '=== DELETING CALL LOGS ===' as info;
DELETE FROM call_logs WHERE student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259';

-- Delete the student
SELECT '=== DELETING STUDENT ===' as info;
DELETE FROM students WHERE id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259';

-- ========================================
-- STEP 3: DELETE GROUPS (only if they have no other students)
-- ========================================
SELECT '=== DELETING GROUPS (if empty) ===' as info;

-- Delete sessions for groups that only had this student
DELETE FROM sessions 
WHERE group_id IN (
    SELECT g.id
    FROM groups g
    WHERE NOT EXISTS (
        SELECT 1 FROM student_groups sg 
        WHERE sg.group_id = g.id 
        AND sg.student_id != '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259'
    )
    AND EXISTS (
        SELECT 1 FROM student_groups sg 
        WHERE sg.group_id = g.id 
        AND sg.student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259'
    )
);

-- Delete the groups themselves (only if they have no other students)
DELETE FROM groups 
WHERE id IN (
    SELECT g.id
    FROM groups g
    WHERE NOT EXISTS (
        SELECT 1 FROM student_groups sg 
        WHERE sg.group_id = g.id 
        AND sg.student_id != '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259'
    )
    AND EXISTS (
        SELECT 1 FROM student_groups sg 
        WHERE sg.group_id = g.id 
        AND sg.student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259'
    )
);

-- ========================================
-- STEP 4: VERIFICATION
-- ========================================
SELECT '=== VERIFICATION ===' as info;

-- Check if student still exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM students WHERE id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259') 
        THEN '❌ Student still exists'
        ELSE '✅ Student deleted'
    END as student_status;

-- Check if any related data still exists
SELECT 
    'Remaining payments: ' || COUNT(*) as remaining_data
FROM payments 
WHERE student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259'
UNION ALL
SELECT 
    'Remaining attendance: ' || COUNT(*)
FROM attendance 
WHERE student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259'
UNION ALL
SELECT 
    'Remaining receipts: ' || COUNT(*)
FROM receipts 
WHERE student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259';

-- Show which groups were deleted
SELECT 
    'Groups that were deleted (if they had no other students):' as info;

-- Note: This will only show groups if they were actually deleted
-- If groups had other students, they won't be deleted and won't appear here

SELECT '✅ Deletion complete!' as result;

