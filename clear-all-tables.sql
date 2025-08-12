-- Clear All Tables Script for Fresh Testing
-- This script will remove all data from all tables while preserving table structure
-- Run this in your Supabase SQL Editor

-- Disable foreign key checks temporarily to avoid constraint issues
SET session_replication_role = replica;

-- Clear all tables in the correct order (respecting foreign key relationships)

-- 1. Clear attendance records first (depends on sessions and students)
DELETE FROM attendance;
ALTER SEQUENCE IF EXISTS attendance_id_seq RESTART WITH 1;

-- 2. Clear call logs
DELETE FROM call_logs;
ALTER SEQUENCE IF EXISTS call_logs_id_seq RESTART WITH 1;

-- 3. Clear payments (depends on students and groups)
DELETE FROM payments;
ALTER SEQUENCE IF EXISTS payments_id_seq RESTART WITH 1;

-- 4. Clear student_groups junction table
DELETE FROM student_groups;
ALTER SEQUENCE IF EXISTS student_groups_id_seq RESTART WITH 1;

-- 5. Clear sessions (depends on groups)
DELETE FROM sessions;
ALTER SEQUENCE IF EXISTS sessions_id_seq RESTART WITH 1;

-- 6. Clear students
DELETE FROM students;

-- 7. Clear groups
DELETE FROM groups;
ALTER SEQUENCE IF EXISTS groups_id_seq RESTART WITH 1;

-- 8. Clear teachers
DELETE FROM teachers;

-- 9. Clear waiting_list
DELETE FROM waiting_list;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Verify all tables are empty
SELECT 
    'attendance' as table_name,
    COUNT(*) as record_count
FROM attendance
UNION ALL
SELECT 
    'call_logs' as table_name,
    COUNT(*) as record_count
FROM call_logs
UNION ALL
SELECT 
    'payments' as table_name,
    COUNT(*) as record_count
FROM payments
UNION ALL
SELECT 
    'student_groups' as table_name,
    COUNT(*) as record_count
FROM student_groups
UNION ALL
SELECT 
    'sessions' as table_name,
    COUNT(*) as record_count
FROM sessions
UNION ALL
SELECT 
    'students' as table_name,
    COUNT(*) as record_count
FROM students
UNION ALL
SELECT 
    'groups' as table_name,
    COUNT(*) as record_count
FROM groups
UNION ALL
SELECT 
    'teachers' as table_name,
    COUNT(*) as record_count
FROM teachers
UNION ALL
SELECT 
    'waiting_list' as table_name,
    COUNT(*) as record_count
FROM waiting_list
ORDER BY table_name;

-- Show message
SELECT 'All tables have been cleared successfully! You can now start fresh testing.' as status; 