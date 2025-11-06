-- Clear All Students and Their Payments
-- This script will delete all students and all related data (payments, receipts, attendance, etc.)
-- TEACHERS AND GROUPS WILL BE PRESERVED
-- WARNING: This is irreversible! Make sure you have a backup if needed.

-- Step 1: Show current counts before deletion
SELECT '=== BEFORE DELETION ===' as info;
SELECT 
    (SELECT COUNT(*) FROM students) as students_count,
    (SELECT COUNT(*) FROM payments) as payments_count,
    (SELECT COUNT(*) FROM receipts) as receipts_count,
    (SELECT COUNT(*) FROM attendance) as attendance_count,
    (SELECT COUNT(*) FROM student_groups) as student_groups_count,
    (SELECT COUNT(*) FROM waiting_list) as waiting_list_count,
    (SELECT COUNT(*) FROM teachers) as teachers_count,
    (SELECT COUNT(*) FROM groups) as groups_count;

-- Step 2: Delete all student-related data in correct order (respecting foreign keys)

-- 2.1: Delete receipts (references payments and students)
DELETE FROM receipts 
WHERE student_id IS NOT NULL;

SELECT '✅ Deleted all receipts' as status;

-- 2.2: Delete payments (references students)
DELETE FROM payments 
WHERE student_id IS NOT NULL;

SELECT '✅ Deleted all payments' as status;

-- 2.3: Delete refund requests (references students)
DELETE FROM refund_requests 
WHERE student_id IS NOT NULL;

SELECT '✅ Deleted all refund requests' as status;

-- 2.4: Delete unpaid balances (references students)
DELETE FROM unpaid_balances 
WHERE student_id IS NOT NULL;

SELECT '✅ Deleted all unpaid balances' as status;

-- 2.5: Delete attendance records (references students)
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

-- 2.8: Delete waiting list entries
DELETE FROM waiting_list;

SELECT '✅ Deleted all waiting list entries' as status;

-- 2.9: Finally, delete all students
DELETE FROM students;

SELECT '✅ Deleted all students' as status;

-- Step 3: Show counts after deletion
SELECT '=== AFTER DELETION ===' as info;
SELECT 
    (SELECT COUNT(*) FROM students) as students_count,
    (SELECT COUNT(*) FROM payments) as payments_count,
    (SELECT COUNT(*) FROM receipts) as receipts_count,
    (SELECT COUNT(*) FROM attendance) as attendance_count,
    (SELECT COUNT(*) FROM student_groups) as student_groups_count,
    (SELECT COUNT(*) FROM waiting_list) as waiting_list_count,
    (SELECT COUNT(*) FROM teachers) as teachers_count,
    (SELECT COUNT(*) FROM groups) as groups_count;

-- Step 4: Verify what was preserved
SELECT '=== PRESERVED DATA ===' as info;
SELECT 
    'Teachers' as table_name,
    COUNT(*) as count
FROM teachers
UNION ALL
SELECT 
    'Groups' as table_name,
    COUNT(*) as count
FROM groups
UNION ALL
SELECT 
    'Sessions' as table_name,
    COUNT(*) as count
FROM sessions
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

-- Step 5: Final confirmation
SELECT '✅ SUCCESS: All students and their payments have been deleted!' as status;
SELECT '✅ Teachers and groups have been preserved!' as status;

