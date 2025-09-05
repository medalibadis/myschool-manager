-- Check the student_payment_summary view structure
-- This will help us understand how it's calculated

-- Step 1: Check if it's a view or table
SELECT 
    schemaname,
    tablename,
    tabletype
FROM pg_tables 
WHERE tablename = 'student_payment_summary'
UNION ALL
SELECT 
    schemaname,
    viewname as tablename,
    'VIEW' as tabletype
FROM pg_views 
WHERE viewname = 'student_payment_summary';

-- Step 2: Get the view definition
SELECT 
    viewname,
    definition
FROM pg_views 
WHERE viewname = 'student_payment_summary';

-- Step 3: Check the current data for our student
SELECT 
    'Current View Data' as status,
    *
FROM student_payment_summary
WHERE student_id = 'bb002411-c634-4f6c-abaa-021152c3fd15';

-- Step 4: Check if there are any underlying tables we can update
SELECT 
    'Underlying Tables' as status,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('students', 'payments', 'student_groups', 'groups')
AND column_name LIKE '%payment%' OR column_name LIKE '%balance%' OR column_name LIKE '%discount%'
ORDER BY table_name, column_name;
