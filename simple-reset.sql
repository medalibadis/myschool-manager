-- Simple Reset for Main Tables
-- Run this in your Supabase SQL editor

-- Clear main tables
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

-- Verify tables are empty
SELECT 
    relname as tablename,
    CASE 
        WHEN n_tup_ins = 0 THEN '✅ Empty'
        ELSE '❌ Has Data'
    END as status
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
    AND relname IN (
        'students', 'teachers', 'groups', 'payments', 'receipts'
    )
ORDER BY relname;

SELECT '✅ Tables reset successfully!' as status;
