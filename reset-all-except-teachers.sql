-- ============================================================
-- RESET DATABASE KEEPING ONLY TEACHERS
-- This script erases all students, groups, sessions, attendance,
-- payments, receipts, call logs, waiting list, etc.
-- ONLY TEACHERS ARE PRESERVED!
-- ============================================================

-- Step 1: Show counts before deletion
SELECT '=== BEFORE RESET ===' as info;
SELECT 
    (SELECT COUNT(*) FROM teachers) as teachers_count,
    (SELECT COUNT(*) FROM groups) as groups_count,
    (SELECT COUNT(*) FROM students) as students_count,
    (SELECT COUNT(*) FROM sessions) as sessions_count,
    (SELECT COUNT(*) FROM attendance) as attendance_count,
    (SELECT COUNT(*) FROM payments) as payments_count,
    (SELECT COUNT(*) FROM call_logs) as call_logs_count;

-- Step 2: Clear all tables except teachers (using TRUNCATE CASCADE)
TRUNCATE TABLE 
    receipts,
    payments,
    refund_requests,
    unpaid_balances,
    attendance,
    sessions,
    student_groups,
    stop_reasons,
    call_logs,
    waiting_list,
    students,
    groups
CASCADE;

-- Step 3: Reset group ID sequence so new groups start from ID 1
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'groups_id_seq') THEN
        ALTER SEQUENCE groups_id_seq RESTART WITH 1;
    END IF;
END $$;

-- Step 4: Show counts after reset
SELECT '=== AFTER RESET ===' as info;
SELECT 
    (SELECT COUNT(*) FROM teachers) as teachers_count,
    (SELECT COUNT(*) FROM groups) as groups_count,
    (SELECT COUNT(*) FROM students) as students_count,
    (SELECT COUNT(*) FROM sessions) as sessions_count,
    (SELECT COUNT(*) FROM attendance) as attendance_count,
    (SELECT COUNT(*) FROM payments) as payments_count,
    (SELECT COUNT(*) FROM call_logs) as call_logs_count;

-- Final Confirmation
SELECT '✅ SUCCESS: Everything has been erased. Only Teachers remain!' as status;
