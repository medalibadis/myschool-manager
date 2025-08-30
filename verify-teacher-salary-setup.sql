-- Teacher Salary System Verification Script
-- Run this to check if everything is working correctly

-- Check if teacher_salaries table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'teacher_salaries') 
        THEN '✅ teacher_salaries table exists'
        ELSE '❌ teacher_salaries table missing'
    END as table_status;

-- Check if price_per_session column exists in teachers table
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'price_per_session') 
        THEN '✅ price_per_session column exists in teachers table'
        ELSE '❌ price_per_session column missing from teachers table'
    END as column_status;

-- Check RLS policies
SELECT 
    policyname,
    CASE 
        WHEN cmd = 'r' THEN 'SELECT'
        WHEN cmd = 'a' THEN 'INSERT'
        WHEN cmd = 'w' THEN 'UPDATE'
        WHEN cmd = 'd' THEN 'DELETE'
        ELSE cmd
    END as operation,
    '✅ Policy exists' as status
FROM pg_policies 
WHERE tablename = 'teacher_salaries'
ORDER BY policyname;

-- Check indexes
SELECT 
    indexname,
    '✅ Index exists' as status
FROM pg_indexes 
WHERE tablename = 'teacher_salaries'
ORDER BY indexname;

-- Show sample data counts
SELECT 'Teachers with price_per_session set:' as info, COUNT(*) as count
FROM teachers 
WHERE price_per_session IS NOT NULL AND price_per_session > 0;

-- Show any existing salary records
SELECT 'Existing salary records:' as info, COUNT(*) as count
FROM teacher_salaries;

-- Final status
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'teacher_salaries')
        AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'price_per_session')
        THEN '🎉 Teacher salary system is ready to use!'
        ELSE '⚠️ Some components are missing. Run the setup script again.'
    END as final_status;
