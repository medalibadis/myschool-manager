-- =====================================================
-- SIMPLE DATABASE CHECK - NO CHANGES MADE
-- This will show us exactly what we have right now
-- =====================================================

-- 1. What tables exist?
SELECT 'EXISTING TABLES:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. What columns does groups table have?
SELECT 'GROUPS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'groups' 
ORDER BY ordinal_position;

-- 3. What columns does students table have?
SELECT 'STUDENTS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- 4. What columns does call_logs table have?
SELECT 'CALL_LOGS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'call_logs' 
ORDER BY ordinal_position;

-- 5. How much data do we have?
SELECT 'DATA COUNTS:' as info;
SELECT 'Groups' as table_name, COUNT(*) as count FROM groups
UNION ALL
SELECT 'Students' as table_name, COUNT(*) as count FROM students
UNION ALL
SELECT 'Call Logs' as table_name, COUNT(*) as count FROM call_logs
UNION ALL
SELECT 'Teachers' as table_name, COUNT(*) as count FROM teachers;

-- 6. Show me a sample of what we have
SELECT 'SAMPLE GROUPS:' as info;
SELECT * FROM groups LIMIT 2;

SELECT 'SAMPLE STUDENTS:' as info;
SELECT * FROM students LIMIT 2;

SELECT 'SAMPLE CALL_LOGS:' as info;
SELECT * FROM call_logs LIMIT 2;
