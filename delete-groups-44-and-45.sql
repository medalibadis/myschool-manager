-- DELETE GROUPS 44 AND 45 AND ALL RELATED DATA
-- This script safely deletes groups 44 and 45 along with all their related records

-- ========================================
-- STEP 1: CHECK WHAT WILL BE DELETED
-- ========================================
SELECT '=== CHECKING GROUPS TO DELETE ===' as info;

SELECT 
    g.id as group_id,
    g.name as group_name,
    COUNT(DISTINCT sg.student_id) as student_count,
    COUNT(DISTINCT s.id) as session_count
FROM groups g
LEFT JOIN student_groups sg ON sg.group_id = g.id
LEFT JOIN sessions s ON s.group_id = g.id
WHERE g.id IN (44, 45)
GROUP BY g.id, g.name;

-- ========================================
-- STEP 2: DELETE IN ORDER (respecting foreign key constraints)
-- ========================================

-- Delete receipts for payments in these groups
SELECT '=== DELETING RECEIPTS ===' as info;
DELETE FROM receipts 
WHERE payment_id IN (
    SELECT id FROM payments WHERE group_id IN (44, 45)
);

-- Delete attendance records for sessions in these groups
SELECT '=== DELETING ATTENDANCE ===' as info;
DELETE FROM attendance 
WHERE session_id IN (
    SELECT id FROM sessions WHERE group_id IN (44, 45)
);

-- Delete payments for these groups
SELECT '=== DELETING PAYMENTS ===' as info;
DELETE FROM payments WHERE group_id IN (44, 45);

-- Delete student_groups relationships for these groups
SELECT '=== DELETING STUDENT_GROUPS RELATIONSHIPS ===' as info;
DELETE FROM student_groups WHERE group_id IN (44, 45);

-- Delete sessions for these groups
SELECT '=== DELETING SESSIONS ===' as info;
DELETE FROM sessions WHERE group_id IN (44, 45);

-- Delete the groups themselves
SELECT '=== DELETING GROUPS ===' as info;
DELETE FROM groups WHERE id IN (44, 45);

-- ========================================
-- STEP 3: VERIFICATION
-- ========================================
SELECT '=== VERIFICATION ===' as info;

-- Check if groups still exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM groups WHERE id IN (44, 45)) 
        THEN '❌ Groups still exist'
        ELSE '✅ Groups deleted'
    END as groups_status;

-- Check if any related data still exists
SELECT 
    'Remaining sessions: ' || COUNT(*) as remaining_data
FROM sessions 
WHERE group_id IN (44, 45)
UNION ALL
SELECT 
    'Remaining attendance: ' || COUNT(*)
FROM attendance 
WHERE session_id IN (SELECT id FROM sessions WHERE group_id IN (44, 45))
UNION ALL
SELECT 
    'Remaining payments: ' || COUNT(*)
FROM payments 
WHERE group_id IN (44, 45)
UNION ALL
SELECT 
    'Remaining student_groups: ' || COUNT(*)
FROM student_groups 
WHERE group_id IN (44, 45);

SELECT '✅ Deletion complete!' as result;

