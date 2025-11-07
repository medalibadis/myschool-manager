-- KEEP ONLY STUDENTS IN GROUP 6 (Eng|A2|Child)
-- This script will delete all students NOT in group 6 and their related data
-- WARNING: This is irreversible! Make sure you have a backup if needed.

-- ========================================
-- STEP 1: SHOW WHAT WILL BE DELETED
-- ========================================
SELECT '=== STUDENTS TO BE DELETED ===' as info;

SELECT 
    s.id as student_id,
    s.name as student_name,
    COUNT(DISTINCT sg.group_id) as groups_count,
    STRING_AGG(DISTINCT g.name, ', ') as group_names,
    COUNT(DISTINCT p.id) as payments_count,
    COUNT(DISTINCT a.id) as attendance_records
FROM students s
LEFT JOIN student_groups sg ON s.id = sg.student_id
LEFT JOIN groups g ON sg.group_id = g.id
LEFT JOIN payments p ON s.id = p.student_id
LEFT JOIN attendance a ON s.id = a.student_id
WHERE sg.group_id IS NULL OR sg.group_id != 6
GROUP BY s.id, s.name
ORDER BY s.name;

-- ========================================
-- STEP 2: SHOW STUDENTS THAT WILL BE KEPT (Group 6)
-- ========================================
SELECT '=== STUDENTS TO BE KEPT (Group 6) ===' as info;

SELECT 
    s.id as student_id,
    s.name as student_name,
    COUNT(DISTINCT p.id) as payments_count,
    COUNT(DISTINCT a.id) as attendance_records
FROM students s
INNER JOIN student_groups sg ON s.id = sg.student_id
LEFT JOIN payments p ON s.id = p.student_id
LEFT JOIN attendance a ON s.id = a.student_id
WHERE sg.group_id = 6
GROUP BY s.id, s.name
ORDER BY s.name;

-- ========================================
-- STEP 3: DELETE DATA FOR STUDENTS NOT IN GROUP 6
-- ========================================
SELECT '=== DELETING DATA FOR STUDENTS NOT IN GROUP 6 ===' as step;

-- 3.1: Delete receipts for students not in group 6
DELETE FROM receipts 
WHERE student_id IN (
    SELECT DISTINCT s.id 
    FROM students s
    LEFT JOIN student_groups sg ON s.id = sg.student_id
    WHERE sg.group_id IS NULL OR sg.group_id != 6
);

SELECT '✅ Deleted receipts for students not in group 6' as status;

-- 3.2: Delete payments for students not in group 6
DELETE FROM payments 
WHERE student_id IN (
    SELECT DISTINCT s.id 
    FROM students s
    LEFT JOIN student_groups sg ON s.id = sg.student_id
    WHERE sg.group_id IS NULL OR sg.group_id != 6
);

SELECT '✅ Deleted payments for students not in group 6' as status;

-- 3.3: Delete refund requests for students not in group 6
DELETE FROM refund_requests 
WHERE student_id IN (
    SELECT DISTINCT s.id 
    FROM students s
    LEFT JOIN student_groups sg ON s.id = sg.student_id
    WHERE sg.group_id IS NULL OR sg.group_id != 6
);

SELECT '✅ Deleted refund requests for students not in group 6' as status;

-- 3.4: Delete unpaid balances for students not in group 6
DELETE FROM unpaid_balances 
WHERE student_id IN (
    SELECT DISTINCT s.id 
    FROM students s
    LEFT JOIN student_groups sg ON s.id = sg.student_id
    WHERE sg.group_id IS NULL OR sg.group_id != 6
);

SELECT '✅ Deleted unpaid balances for students not in group 6' as status;

-- 3.5: Delete attendance records for students not in group 6
DELETE FROM attendance 
WHERE student_id IN (
    SELECT DISTINCT s.id 
    FROM students s
    LEFT JOIN student_groups sg ON s.id = sg.student_id
    WHERE sg.group_id IS NULL OR sg.group_id != 6
);

SELECT '✅ Deleted attendance records for students not in group 6' as status;

-- 3.6: Delete call logs for students not in group 6
DELETE FROM call_logs 
WHERE student_id IN (
    SELECT DISTINCT s.id 
    FROM students s
    LEFT JOIN student_groups sg ON s.id = sg.student_id
    WHERE sg.group_id IS NULL OR sg.group_id != 6
);

SELECT '✅ Deleted call logs for students not in group 6' as status;

-- 3.7: Delete student-group relationships for students not in group 6
DELETE FROM student_groups 
WHERE group_id != 6;

SELECT '✅ Deleted student-group relationships for students not in group 6' as status;

-- 3.8: Delete students not in group 6
DELETE FROM students 
WHERE id IN (
    SELECT DISTINCT s.id 
    FROM students s
    LEFT JOIN student_groups sg ON s.id = sg.student_id
    WHERE sg.group_id IS NULL OR sg.group_id != 6
);

SELECT '✅ Deleted students not in group 6' as status;

-- ========================================
-- STEP 4: DELETE OTHER GROUPS (Keep only Group 6)
-- ========================================
SELECT '=== DELETING OTHER GROUPS ===' as step;

-- 4.1: Delete sessions for groups other than 6
DELETE FROM sessions 
WHERE group_id != 6;

SELECT '✅ Deleted sessions for groups other than 6' as status;

-- 4.2: Delete payments for groups other than 6 (should be none left, but just in case)
DELETE FROM payments 
WHERE group_id IS NOT NULL AND group_id != 6;

SELECT '✅ Deleted payments for groups other than 6' as status;

-- 4.3: Delete unpaid balances for groups other than 6
DELETE FROM unpaid_balances 
WHERE group_id IS NOT NULL AND group_id != 6;

SELECT '✅ Deleted unpaid balances for groups other than 6' as status;

-- 4.4: Delete other groups (keep only group 6)
DELETE FROM groups 
WHERE id != 6;

SELECT '✅ Deleted groups other than 6' as status;

-- 4.5: Delete waiting list entries
DELETE FROM waiting_list;

SELECT '✅ Deleted all waiting list entries' as status;

-- ========================================
-- STEP 5: VERIFY RESULTS
-- ========================================
SELECT '=== VERIFICATION ===' as step;

-- 5.1: Show remaining students
SELECT 
    'REMAINING STUDENTS' as info,
    COUNT(*) as student_count
FROM students;

SELECT 
    s.id,
    s.name,
    s.phone,
    s.email
FROM students s
ORDER BY s.name;

-- 5.2: Show remaining groups
SELECT 
    'REMAINING GROUPS' as info,
    COUNT(*) as group_count
FROM groups;

SELECT 
    g.id,
    g.name,
    g.price,
    g.total_sessions
FROM groups g;

-- 5.3: Show student-group relationships
SELECT 
    'STUDENT-GROUP RELATIONSHIPS' as info,
    COUNT(*) as relationship_count
FROM student_groups;

SELECT 
    sg.student_id,
    s.name as student_name,
    sg.group_id,
    g.name as group_name,
    sg.status
FROM student_groups sg
JOIN students s ON sg.student_id = s.id
JOIN groups g ON sg.group_id = g.id;

-- 5.4: Show remaining payments
SELECT 
    'REMAINING PAYMENTS' as info,
    COUNT(*) as payment_count,
    SUM(amount) as total_amount
FROM payments;

-- 5.5: Show remaining attendance records
SELECT 
    'REMAINING ATTENDANCE RECORDS' as info,
    COUNT(*) as attendance_count
FROM attendance;

-- ========================================
-- STEP 6: FINAL SUMMARY
-- ========================================
SELECT '=== FINAL SUMMARY ===' as step;
SELECT '✅ All students NOT in group 6 have been deleted!' as status;
SELECT '✅ All groups except group 6 have been deleted!' as status;
SELECT '✅ All related data (payments, attendance, etc.) has been cleaned up!' as status;
SELECT '✅ Only students in group 6 (Eng|A2|Child) remain!' as status;
SELECT '✅ Teachers have been preserved!' as status;

