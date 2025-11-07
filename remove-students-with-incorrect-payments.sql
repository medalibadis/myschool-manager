-- Remove Students and Groups with Incorrect Payment Status
-- This script will delete students, groups, and all their related data
-- ONLY TEACHERS WILL BE PRESERVED
-- WARNING: This is irreversible! Make sure you have a backup if needed.

-- Step 1: Show what will be deleted
SELECT '=== STUDENTS AND DATA TO BE DELETED ===' as info;

SELECT 
    s.id as student_id,
    s.name as student_name,
    COUNT(DISTINCT p.id) as total_payments,
    COUNT(DISTINCT sg.group_id) as groups_count,
    STRING_AGG(DISTINCT g.name, ', ') as group_names
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
LEFT JOIN student_groups sg ON s.id = sg.student_id
LEFT JOIN groups g ON sg.group_id = g.id
GROUP BY s.id, s.name
ORDER BY s.name;

-- Step 2: Delete all student and group-related data in correct order

-- 2.1: Delete receipts (references payments and students)
DELETE FROM receipts 
WHERE student_id IS NOT NULL;

SELECT '✅ Deleted all receipts' as status;

-- 2.2: Delete payments (references students and groups)
DELETE FROM payments 
WHERE student_id IS NOT NULL OR group_id IS NOT NULL;

SELECT '✅ Deleted all payments' as status;

-- 2.3: Delete refund requests (references students)
DELETE FROM refund_requests 
WHERE student_id IS NOT NULL;

SELECT '✅ Deleted all refund requests' as status;

-- 2.4: Delete unpaid balances (references students and groups)
DELETE FROM unpaid_balances 
WHERE student_id IS NOT NULL OR group_id IS NOT NULL;

SELECT '✅ Deleted all unpaid balances' as status;

-- 2.5: Delete attendance records (references students and sessions)
DELETE FROM attendance 
WHERE student_id IS NOT NULL;

SELECT '✅ Deleted all attendance records' as status;

-- 2.6: Delete call logs (references students)
DELETE FROM call_logs 
WHERE student_id IS NOT NULL;

SELECT '✅ Deleted all call logs' as status;

-- 2.7: Delete student-group relationships (junction table)
DELETE FROM student_groups;

SELECT '✅ Deleted all student-group relationships' as status;

-- 2.8: Delete sessions (references groups)
DELETE FROM sessions;

SELECT '✅ Deleted all sessions' as status;

-- 2.9: Delete waiting list entries
DELETE FROM waiting_list;

SELECT '✅ Deleted all waiting list entries' as status;

-- 2.10: Delete all students
DELETE FROM students;

SELECT '✅ Deleted all students' as status;

-- 2.11: Delete all groups
DELETE FROM groups;

SELECT '✅ Deleted all groups' as status;

-- Step 3: Verify what was preserved
SELECT '=== PRESERVED DATA ===' as info;
SELECT 
    'Teachers' as table_name,
    COUNT(*) as count
FROM teachers
UNION ALL
SELECT 
    'Teacher Attendance' as table_name,
    COUNT(*) as count
FROM teacher_attendance
UNION ALL
SELECT 
    'Teacher Salaries' as table_name,
    COUNT(*) as count
FROM teacher_salaries;

-- Step 4: Final confirmation
SELECT '✅ SUCCESS: All students, groups, and their payments have been deleted!' as status;
SELECT '✅ Only teachers have been preserved - you can now start fresh!' as status;
SELECT '✅ When you create new groups and add students, they will show as "Pending" correctly!' as status;

