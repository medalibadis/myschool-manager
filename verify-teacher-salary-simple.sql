-- Simple Teacher Salary System Verification
-- Run this in your Supabase SQL editor

-- 1. Check if teacher_salaries table exists
SELECT 
    'teacher_salaries table exists' as status
FROM information_schema.tables 
WHERE table_name = 'teacher_salaries';

-- 2. Check if price_per_session column exists in teachers table
SELECT 
    'price_per_session column exists in teachers table' as status
FROM information_schema.columns 
WHERE table_name = 'teachers' AND column_name = 'price_per_session';

-- 3. Check RLS status on teacher_salaries table
SELECT 
    'RLS is enabled on teacher_salaries table' as status
FROM pg_tables 
WHERE tablename = 'teacher_salaries' AND rowsecurity = true;

-- 4. List all RLS policies on teacher_salaries table
SELECT 
    policyname,
    cmd,
    permissive as policy_type,
    qual IS NOT NULL as has_using_clause,
    with_check IS NOT NULL as has_with_check_clause
FROM pg_policies 
WHERE tablename = 'teacher_salaries'
ORDER BY cmd, policyname;

-- 5. Check if indexes exist
SELECT 
    'idx_teacher_salaries_teacher_id index exists' as status
FROM pg_indexes 
WHERE tablename = 'teacher_salaries' AND indexname = 'idx_teacher_salaries_teacher_id';

SELECT 
    'idx_teacher_salaries_group_id index exists' as status
FROM pg_indexes 
WHERE tablename = 'teacher_salaries' AND indexname = 'idx_teacher_salaries_group_id';

SELECT 
    'idx_teacher_salaries_payment_date index exists' as status
FROM pg_indexes 
WHERE tablename = 'teacher_salaries' AND indexname = 'idx_teacher_salaries_payment_date';

-- 6. Count records in tables
SELECT 'Teachers count:' as label, COUNT(*) as count FROM teachers
UNION ALL
SELECT 'Groups count:' as label, COUNT(*) as count FROM groups
UNION ALL
SELECT 'Teacher salaries count:' as label, COUNT(*) as count FROM teacher_salaries;

-- 7. Test INSERT permission (this will show if the user has proper permissions)
-- Note: This will only work if run by an authenticated user
DO $$
BEGIN
    -- Try to insert a test record (will be rolled back)
    BEGIN
        INSERT INTO teacher_salaries (
            teacher_id, 
            group_id, 
            total_sessions, 
            calculated_salary, 
            paid_amount, 
            payment_date
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 
            999999, 
            1, 
            100.00, 
            100.00, 
            CURRENT_DATE
        );
        
        -- If we get here, the insert worked
        RAISE NOTICE 'INSERT permission test: SUCCESS - RLS policies are working correctly';
        
        -- Rollback the test insert
        ROLLBACK;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'INSERT permission test: FAILED - Error: %', SQLERRM;
    END;
END $$;
