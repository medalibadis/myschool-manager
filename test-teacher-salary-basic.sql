-- Basic Teacher Salary System Test
-- Run this in your Supabase SQL editor

-- 1. Check if table exists
SELECT 'teacher_salaries table exists' as check_result
FROM information_schema.tables 
WHERE table_name = 'teacher_salaries';

-- 2. Check if column exists
SELECT 'price_per_session column exists' as check_result
FROM information_schema.columns 
WHERE table_name = 'teachers' AND column_name = 'price_per_session';

-- 3. Check RLS
SELECT 'RLS is enabled' as check_result
FROM pg_tables 
WHERE tablename = 'teacher_salaries' AND rowsecurity = true;

-- 4. List policies (simple)
SELECT policyname, cmd, permissive
FROM pg_policies 
WHERE tablename = 'teacher_salaries';

-- 5. Count records
SELECT 'Teachers:' as label, COUNT(*) as count FROM teachers
UNION ALL
SELECT 'Groups:' as label, COUNT(*) as count FROM groups
UNION ALL
SELECT 'Salaries:' as label, COUNT(*) as count FROM teacher_salaries;
