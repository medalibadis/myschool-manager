-- Verify Teacher Salary System Setup
-- Run this in your Supabase SQL editor to check if everything is set up correctly

-- 1. Check if teacher_salaries table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'teacher_salaries') 
        THEN '✅ teacher_salaries table exists'
        ELSE '❌ teacher_salaries table does not exist'
    END as table_status;

-- 2. Check if price_per_session column exists in teachers table
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'price_per_session') 
        THEN '✅ price_per_session column exists in teachers table'
        ELSE '❌ price_per_session column does not exist in teachers table'
    END as column_status;

-- 3. Check RLS status on teacher_salaries table
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'teacher_salaries' AND rowsecurity = true) 
        THEN '✅ RLS is enabled on teacher_salaries table'
        ELSE '❌ RLS is not enabled on teacher_salaries table'
    END as rls_status;

-- 4. List all RLS policies on teacher_salaries table
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
    END as policy_type,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies 
WHERE tablename = 'teacher_salaries'
ORDER BY cmd, policyname;

-- 5. Check if indexes exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM pg_indexes WHERE tablename = 'teacher_salaries' AND indexname = 'idx_teacher_salaries_teacher_id') 
        THEN '✅ idx_teacher_salaries_teacher_id index exists'
        ELSE '❌ idx_teacher_salaries_teacher_id index does not exist'
    END as teacher_id_index_status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM pg_indexes WHERE tablename = 'teacher_salaries' AND indexname = 'idx_teacher_salaries_group_id') 
        THEN '✅ idx_teacher_salaries_group_id index exists'
        ELSE '❌ idx_teacher_salaries_group_id index does not exist'
    END as group_id_index_status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM pg_indexes WHERE tablename = 'teacher_salaries' AND indexname = 'idx_teacher_salaries_payment_date') 
        THEN '✅ idx_teacher_salaries_payment_date index exists'
        ELSE '❌ idx_teacher_salaries_payment_date index does not exist'
    END as payment_date_index_status;

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
        RAISE NOTICE '✅ INSERT permission test: SUCCESS - RLS policies are working correctly';
        
        -- Rollback the test insert
        ROLLBACK;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ INSERT permission test: FAILED - Error: %', SQLERRM;
    END;
END $$;
