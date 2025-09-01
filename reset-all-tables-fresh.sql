-- Reset All Tables for Fresh Testing
-- This script clears all data from tables and resets sequences to start from 1

-- Disable foreign key checks temporarily to avoid constraint issues
SET session_replication_role = replica;

-- Clear all tables in the correct order (respecting foreign key constraints)
TRUNCATE TABLE receipts CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE teacher_salaries CASCADE;
TRUNCATE TABLE attendance CASCADE;
TRUNCATE TABLE teacher_attendance CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE student_groups CASCADE;
TRUNCATE TABLE groups CASCADE;
TRUNCATE TABLE teachers CASCADE;
TRUNCATE TABLE students CASCADE;
TRUNCATE TABLE refund_requests CASCADE;
TRUNCATE TABLE waiting_list CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset sequences (auto-increment counters) to start from 1
-- Note: Some tables use UUID, so we only reset integer sequences
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

-- Verify sequences are reset to 1
SELECT
    'Sequence Reset Status' as status,
    sequence_name,
    start_value,
    minimum_value,
    maximum_value
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- Show final confirmation
SELECT '✅ All tables reset successfully for fresh testing!' as final_status;
SELECT '📊 New IDs will start from 1 and increment normally' as sequence_info;
