-- ============================================================
-- DELETE ALL GROUPS, STUDENTS, AND ALL DATA (KEEP ONLY TEACHERS)
-- This script completely deletes ALL Groups, Students, Sessions, 
-- Attendance, Payments, Receipts, Call Logs, Waiting List, etc.
-- ONLY TEACHERS WILL BE KEPT!
-- ============================================================

-- Step 1: Show current counts before deletion
SELECT '=== BEFORE DELETION ===' as info;
SELECT 
    (SELECT COUNT(*) FROM teachers) as teachers_count,
    (SELECT COUNT(*) FROM groups) as groups_count,
    (SELECT COUNT(*) FROM students) as students_count,
    (SELECT COUNT(*) FROM sessions) as sessions_count,
    (SELECT COUNT(*) FROM attendance) as attendance_count,
    (SELECT COUNT(*) FROM payments) as payments_count,
    (SELECT COUNT(*) FROM call_logs) as call_logs_count;

-- Step 2: Delete from all tables in correct dependency order

-- 2.1: Delete child relationship records first
DELETE FROM receipts;
DELETE FROM payments;
DELETE FROM refund_requests;
DELETE FROM unpaid_balances;
DELETE FROM attendance;
DELETE FROM stop_reasons;
DELETE FROM student_groups;

-- 2.2: Delete sessions and teacher group records
DELETE FROM sessions;
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_attendance') THEN
        DELETE FROM teacher_attendance;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_covering') THEN
        DELETE FROM teacher_covering;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_salaries') THEN
        DELETE FROM teacher_salaries;
    END IF;
END $$;

-- 2.3: Delete call logs, waiting list, and students
DELETE FROM call_logs;
DELETE FROM waiting_list;
DELETE FROM students;

-- 2.4: Delete ALL groups (Crucial step)
DELETE FROM groups;

-- Step 3: Reset group ID sequence back to 1
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'groups_id_seq') THEN
        ALTER SEQUENCE groups_id_seq RESTART WITH 1;
    END IF;
END $$;

-- Step 4: Show counts after deletion
SELECT '=== AFTER DELETION ===' as info;
SELECT 
    (SELECT COUNT(*) FROM teachers) as teachers_count,
    (SELECT COUNT(*) FROM groups) as groups_count,
    (SELECT COUNT(*) FROM students) as students_count,
    (SELECT COUNT(*) FROM sessions) as sessions_count,
    (SELECT COUNT(*) FROM attendance) as attendance_count,
    (SELECT COUNT(*) FROM payments) as payments_count,
    (SELECT COUNT(*) FROM call_logs) as call_logs_count;

-- Step 5: Final Confirmation
SELECT '✅ SUCCESS: All groups and students deleted! Only Teachers remain.' as status;
