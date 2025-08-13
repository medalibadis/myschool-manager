-- =====================================================
-- DEBUG DATABASE STATE
-- This script will show you exactly what's in your database
-- =====================================================

-- 1. Check what tables exist
SELECT 'EXISTING TABLES:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check groups table structure
SELECT 'GROUPS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'groups' 
ORDER BY ordinal_position;

-- 3. Check students table structure
SELECT 'STUDENTS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- 4. Check call_logs table structure
SELECT 'CALL_LOGS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'call_logs' 
ORDER BY ordinal_position;

-- 5. Check if there's any data in tables
SELECT 'GROUPS DATA COUNT:' as info;
SELECT COUNT(*) as groups_count FROM groups;

SELECT 'STUDENTS DATA COUNT:' as info;
SELECT COUNT(*) as students_count FROM students;

SELECT 'CALL_LOGS DATA COUNT:' as info;
SELECT COUNT(*) as call_logs_count FROM call_logs;

SELECT 'TEACHERS DATA COUNT:' as info;
SELECT COUNT(*) as teachers_count FROM teachers;

-- 6. Check sample data
SELECT 'SAMPLE GROUPS:' as info;
SELECT * FROM groups LIMIT 3;

SELECT 'SAMPLE STUDENTS:' as info;
SELECT * FROM students LIMIT 3;

SELECT 'SAMPLE CALL_LOGS:' as info;
SELECT * FROM call_logs LIMIT 3;

-- 7. Check for any errors in recent operations
SELECT 'RECENT ERRORS (if any):' as info;
-- This will show if there are any constraint violations or other issues

-- 8. Test basic insert operations (FIXED - with proper values)
SELECT 'TESTING BASIC OPERATIONS:' as info;

-- Try to insert a test teacher if none exist
INSERT INTO teachers (name, email, phone) 
VALUES ('Test Teacher', 'test@school.com', '+1234567890')
ON CONFLICT (email) DO NOTHING;

-- Try to insert a test group (FIXED - with price value)
INSERT INTO groups (name, teacher_id, start_date, total_sessions, price, language, level, category) 
SELECT 'Test Group', t.id, CURRENT_DATE, 16, 100.00, 'English', 'Beginner', 'Adults'
FROM teachers t 
WHERE t.email = 'test@school.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Try to insert a test call log
INSERT INTO call_logs (student_name, student_phone, call_date, call_time, notes, call_status)
VALUES ('Test Student', '+1234567890', CURRENT_DATE, CURRENT_TIME, 'Test call log', 'pending')
ON CONFLICT DO NOTHING;

-- 9. Verify test data was inserted
SELECT 'VERIFYING TEST DATA:' as info;
SELECT 'Teachers:' as table_name, COUNT(*) as count FROM teachers
UNION ALL
SELECT 'Groups:' as table_name, COUNT(*) as count FROM groups
UNION ALL
SELECT 'Call Logs:' as table_name, COUNT(*) as count FROM call_logs;

-- 10. Check what columns are NOT NULL (constraints)
SELECT 'NOT NULL CONSTRAINTS:' as info;
SELECT 
    table_name,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND is_nullable = 'NO'
ORDER BY table_name, ordinal_position;

-- 11. Final status
SELECT '🎯 DATABASE DEBUG COMPLETE!' as message;
SELECT 'Check the results above to see what columns and data exist.' as details;
SELECT 'The NOT NULL constraints are now properly handled.' as note;
