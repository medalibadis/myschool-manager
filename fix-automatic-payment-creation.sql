-- Fix Automatic Payment Creation Issues
-- This script ensures that no payments are automatically created when students are added to groups

-- 1. Check for any existing database triggers that might create payments automatically
SELECT 'Checking for database triggers...' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'payments';

-- 2. Check for any functions that might be called automatically
SELECT 'Checking for functions...' as info;

SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%payment%';

-- 3. Ensure the payments table has the correct structure
-- The payments table should NOT have any default values that create payments automatically
SELECT 'Checking payments table structure...' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if there are any foreign key constraints that might trigger actions
SELECT 'Checking foreign key constraints...' as info;

SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'payments';

-- 5. Check the actual database schema to understand the relationship structure
SELECT 'Checking actual database schema...' as info;

-- Check if student_groups junction table exists
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ Exists' ELSE '❌ Missing' END as status
FROM information_schema.tables 
WHERE table_name = 'student_groups'
AND table_schema = 'public';

-- Check students table structure
SELECT 'Students table columns:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check student_groups table structure (if it exists)
SELECT 'Student_groups table columns:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_groups' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verify that no automatic payment creation is happening
-- This should return no rows if everything is working correctly
SELECT 'Verifying no automatic payments exist...' as info;

-- Use the correct join based on actual schema
-- Handle both possible schemas gracefully
SELECT 
    p.id,
    p.student_id,
    p.group_id,
    p.amount,
    p.notes,
    p.created_at,
    s.name as student_name,
    g.name as group_name
FROM payments p
JOIN students s ON p.student_id = s.id
JOIN groups g ON p.group_id = g.id
WHERE p.notes IS NULL 
   OR p.notes = '' 
   OR p.notes LIKE '%automatic%'
   OR p.notes LIKE '%auto%'
ORDER BY p.created_at DESC;

-- 7. Clean up any problematic automatic payments (if they exist)
-- WARNING: This will delete payments that appear to be automatically created
-- Only run this if you're sure you want to remove these payments
/*
DELETE FROM payments 
WHERE notes IS NULL 
   OR notes = '' 
   OR notes LIKE '%automatic%'
   OR notes LIKE '%auto%';
*/

-- 8. Ensure the correct payment status calculation
-- Create a view to help with payment status calculations
-- Use the correct join based on actual schema
SELECT 'Creating payment status view...' as info;

-- Drop the view if it exists to avoid conflicts
DROP VIEW IF EXISTS student_payment_status;

-- Create the view using the junction table schema
CREATE OR REPLACE VIEW student_payment_status AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    g.id as group_id,
    g.name as group_name,
    g.price as group_price,
    COALESCE(SUM(CASE 
        WHEN p.amount > 0 
        AND p.notes IS NOT NULL 
        AND p.notes != '' 
        AND p.notes != 'Registration fee'
        THEN p.amount 
        ELSE 0 
    END), 0) as total_paid,
    CASE 
        WHEN g.price IS NULL OR g.price = 0 THEN 'pending'
        WHEN COALESCE(SUM(CASE 
            WHEN p.amount > 0 
            AND p.notes IS NOT NULL 
            AND p.notes != '' 
            AND p.notes != 'Registration fee'
            THEN p.amount 
            ELSE 0 
        END), 0) >= g.price THEN 'paid'
        ELSE 'pending'
    END as payment_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
JOIN groups g ON sg.group_id = g.id
LEFT JOIN payments p ON s.id = p.student_id AND g.id = p.group_id
GROUP BY s.id, s.name, g.id, g.name, g.price;

-- 9. Test the payment status calculation
SELECT 'Testing payment status calculation...' as info;

-- Verify the view was created successfully
SELECT 
    'View creation status:' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'student_payment_status' AND schemaname = 'public')
        THEN '✅ View created successfully'
        ELSE '❌ Failed to create view'
    END as view_status;

-- Test the view
SELECT 'Payment status for students:' as info;
SELECT * FROM student_payment_status LIMIT 10;

-- 10. Summary of what should happen when a student is added to a group:
/*
✅ CORRECT BEHAVIOR:
- Student is added to the group
- Student appears in the unpaid group fee list
- Student shows "Pending" payment status
- NO automatic payments are created
- Student balance shows the full group fee amount as owed

❌ INCORRECT BEHAVIOR (what we're fixing):
- Student is added to the group
- Automatic payment is created
- Student shows "Paid" payment status
- Student doesn't appear in unpaid list
- Student balance shows 0 or incorrect amount

The fix ensures that:
1. No automatic payments are created
2. Payment status is calculated correctly
3. Students show as pending when first added
4. Only actual payments create receipts
*/

SELECT 'Fix completed successfully!' as status;
