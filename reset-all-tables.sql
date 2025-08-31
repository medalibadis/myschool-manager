-- Reset All Tables for Fresh Testing
-- This script clears all data from tables while preserving structure

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Clear all tables in the correct order (respecting foreign key constraints)

-- 1. Clear receipts table
TRUNCATE TABLE receipts CASCADE;

-- 2. Clear payments table
TRUNCATE TABLE payments CASCADE;

-- 3. Clear teacher_salaries table
TRUNCATE TABLE teacher_salaries CASCADE;

-- 4. Clear attendance table
TRUNCATE TABLE attendance CASCADE;

-- 5. Clear teacher_attendance table
TRUNCATE TABLE teacher_attendance CASCADE;

-- 6. Clear sessions table
TRUNCATE TABLE sessions CASCADE;

-- 7. Clear student_groups table
TRUNCATE TABLE student_groups CASCADE;

-- 8. Clear groups table
TRUNCATE TABLE groups CASCADE;

-- 9. Clear teachers table
TRUNCATE TABLE teachers CASCADE;

-- 10. Clear students table
TRUNCATE TABLE students CASCADE;

-- 11. Clear refund_requests table
TRUNCATE TABLE refund_requests CASCADE;

-- 12. Clear waiting_list table
TRUNCATE TABLE waiting_list CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Verify all tables are empty
SELECT 
    'Table Status After Reset' as status,
    schemaname,
    relname as tablename,
    n_tup_ins as row_count
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY relname;

-- Show tables that should be empty
SELECT 
    'Empty Tables Check' as check_type,
    relname as tablename,
    CASE 
        WHEN n_tup_ins = 0 THEN '✅ Empty'
        ELSE '❌ Has Data'
    END as status
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
    AND relname IN (
        'students', 'teachers', 'groups', 'student_groups', 
        'sessions', 'attendance', 'teacher_attendance',
        'payments', 'receipts', 'teacher_salaries',
        'refund_requests', 'waiting_list'
    )
ORDER BY relname;

-- Reset sequences (auto-increment counters)
ALTER SEQUENCE IF EXISTS students_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS teachers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS groups_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS payments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS receipts_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS teacher_salaries_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS attendance_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS teacher_attendance_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS refund_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS waiting_list_id_seq RESTART WITH 1;

-- Verify sequences are reset
SELECT 
    'Sequence Reset Status' as status,
    sequence_name,
    last_value,
    is_called
FROM information_schema.sequences 
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

SELECT '✅ All tables reset successfully for fresh testing!' as final_status;
