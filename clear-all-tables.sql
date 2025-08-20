-- Clear All Database Tables for Fresh Testing
-- This script will safely remove all data from all tables
-- WARNING: This will delete ALL data - only run if you want to start completely fresh!

-- 1. First, check what tables exist
SELECT '=== CHECKING EXISTING TABLES ===' as info;

SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ Exists' ELSE '❌ Missing' END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name NOT LIKE 'pg_%'
AND table_name NOT LIKE 'information_schema%'
ORDER BY table_name;

-- 2. Disable foreign key constraints temporarily (if they exist)
-- This prevents issues with foreign key violations during deletion
SELECT '=== DISABLING FOREIGN KEY CONSTRAINTS ===' as info;

-- Note: PostgreSQL doesn't have a simple "disable all constraints" command
-- We'll handle this by deleting in the correct order

-- 3. Clear all tables in the correct order (child tables first, then parent tables)
SELECT '=== CLEARING ALL TABLES ===' as info;

-- Clear child/reference tables first
SELECT 'Clearing attendance table...' as info;
TRUNCATE TABLE attendance CASCADE;

SELECT 'Clearing payments table...' as info;
TRUNCATE TABLE payments CASCADE;

SELECT 'Clearing call_logs table...' as info;
TRUNCATE TABLE call_logs CASCADE;

SELECT 'Clearing sessions table...' as info;
TRUNCATE TABLE sessions CASCADE;

SELECT 'Clearing student_groups junction table...' as info;
TRUNCATE TABLE student_groups CASCADE;

SELECT 'Clearing waiting_list table...' as info;
TRUNCATE TABLE waiting_list CASCADE;

-- Clear main entity tables
SELECT 'Clearing students table...' as info;
TRUNCATE TABLE students CASCADE;

SELECT 'Clearing groups table...' as info;
TRUNCATE TABLE groups CASCADE;

SELECT 'Clearing teachers table...' as info;
TRUNCATE TABLE teachers CASCADE;

-- 4. Reset any auto-increment sequences
SELECT '=== RESETTING AUTO-INCREMENT SEQUENCES ===' as info;

-- Reset sequences for all tables that might have them
DO $$
DECLARE
    seq_name text;
BEGIN
    -- Get all sequence names and reset them
    FOR seq_name IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || seq_name || ' RESTART WITH 1';
        RAISE NOTICE 'Reset sequence: %', seq_name;
    END LOOP;
END $$;

-- 5. Drop any views that might exist
SELECT '=== DROPPING EXISTING VIEWS ===' as info;

DROP VIEW IF EXISTS student_payment_status CASCADE;
DROP VIEW IF EXISTS test_payment_status CASCADE;

-- 6. Verify all tables are empty
SELECT '=== VERIFYING ALL TABLES ARE EMPTY ===' as info;

SELECT 
    'attendance' as table_name,
    COUNT(*) as record_count
FROM attendance
UNION ALL
SELECT 
    'payments' as table_name,
    COUNT(*) as record_count
FROM payments
UNION ALL
SELECT 
    'call_logs' as table_name,
    COUNT(*) as record_count
FROM call_logs
UNION ALL
SELECT 
    'sessions' as table_name,
    COUNT(*) as record_count
FROM sessions
UNION ALL
SELECT 
    'student_groups' as table_name,
    COUNT(*) as record_count
FROM student_groups
UNION ALL
SELECT 
    'waiting_list' as table_name,
    COUNT(*) as record_count
FROM waiting_list
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
FROM teachers;

-- 7. Summary
SELECT '=== CLEANUP COMPLETED ===' as info;

SELECT 
    'Status:' as info,
    CASE 
        WHEN (SELECT COUNT(*) FROM attendance) = 0 
         AND (SELECT COUNT(*) FROM payments) = 0
         AND (SELECT COUNT(*) FROM call_logs) = 0
         AND (SELECT COUNT(*) FROM sessions) = 0
         AND (SELECT COUNT(*) FROM student_groups) = 0
         AND (SELECT COUNT(*) FROM waiting_list) = 0
         AND (SELECT COUNT(*) FROM students) = 0
         AND (SELECT COUNT(*) FROM groups) = 0
         AND (SELECT COUNT(*) FROM teachers) = 0
        THEN '✅ SUCCESS: All tables are empty'
        ELSE '❌ FAILED: Some tables still contain data'
    END as cleanup_status;

-- 8. Ready for testing message
SELECT '=== READY FOR TESTING ===' as info;
SELECT 'All tables have been cleared. You can now:' as info;
SELECT '1. Add teachers' as next_step;
SELECT '2. Create groups' as next_step;
SELECT '3. Add students to groups' as next_step;
SELECT '4. Test the payment system' as next_step;
SELECT '5. Verify no automatic payments are created' as next_step; 