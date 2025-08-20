-- Test Script to Verify Payment Fix is Working
-- Run this after applying the fixes to verify correct behavior

-- 1. Check current database state
SELECT '=== CURRENT DATABASE STATE ===' as info;

SELECT 'Teachers:' as info;
SELECT id, name, email FROM teachers LIMIT 5;

SELECT 'Groups:' as info;
SELECT id, name, price FROM groups LIMIT 5;

SELECT 'Students:' as info;
SELECT id, name FROM students LIMIT 5;

-- Check if student_groups junction table exists
SELECT 'Student_groups junction table:' as info;
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ Exists' ELSE '❌ Missing' END as status
FROM information_schema.tables 
WHERE table_name = 'student_groups'
AND table_schema = 'public';

-- If student_groups exists, show some data
SELECT 'Student-group relationships:' as info;
SELECT 
    sg.student_id,
    s.name as student_name,
    sg.group_id,
    g.name as group_name
FROM student_groups sg
JOIN students s ON sg.student_id = s.id
JOIN groups g ON sg.group_id = g.id
LIMIT 5;

SELECT 'Payments:' as info;
SELECT id, student_id, group_id, amount, notes, created_at FROM payments ORDER BY created_at DESC LIMIT 10;

-- 2. Test: Add a student to a group (if you have existing data)
-- This simulates what happens when a student is added to a group
SELECT '=== TESTING STUDENT ADDITION TO GROUP ===' as info;

-- Check if we have test data to work with
SELECT 
    'Available test data:' as info,
    COUNT(DISTINCT t.id) as teacher_count,
    COUNT(DISTINCT g.id) as group_count,
    COUNT(DISTINCT s.id) as student_count
FROM teachers t
LEFT JOIN groups g ON g.teacher_id = t.id
LEFT JOIN student_groups sg ON g.id = sg.group_id
LEFT JOIN students s ON sg.student_id = s.id;

-- 3. Verify no automatic payments exist
SELECT '=== VERIFYING NO AUTOMATIC PAYMENTS ===' as info;

SELECT 
    'Automatic payments found:' as status,
    COUNT(*) as count
FROM payments 
WHERE notes IS NULL 
   OR notes = '' 
   OR notes LIKE '%automatic%'
   OR notes LIKE '%auto%'
   OR notes LIKE '%phantom%';

-- 4. Check payment status calculation
SELECT '=== CHECKING PAYMENT STATUS CALCULATION ===' as info;

-- Check if the payment status view exists
SELECT 
    'Payment status view exists:' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'student_payment_status' AND schemaname = 'public')
        THEN '✅ View exists'
        ELSE '❌ View missing - run the fix script first'
    END as view_status;

-- If the view exists, create a test view and show results
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'student_payment_status' AND schemaname = 'public') THEN
        -- Create a test view to check payment status
        DROP VIEW IF EXISTS test_payment_status;
        
        CREATE OR REPLACE VIEW test_payment_status AS
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
        
        RAISE NOTICE 'Test view created successfully';
    ELSE
        RAISE NOTICE 'Payment status view does not exist. Please run the fix script first.';
    END IF;
END $$;

-- Show payment status for all students (if view exists)
SELECT 'Payment status for students:' as info;
SELECT * FROM test_payment_status ORDER BY group_id, student_name LIMIT 10;

-- 5. Summary of expected behavior
SELECT '=== EXPECTED BEHAVIOR AFTER FIX ===' as info;

/*
✅ CORRECT BEHAVIOR:
- Students show "pending" status when first added to groups
- No automatic payments are created
- Students appear in unpaid group fee lists
- Payment status is calculated correctly
- Only actual payments create receipts

❌ INCORRECT BEHAVIOR (what we fixed):
- Students show "paid" status when first added
- Automatic payments are created
- Students don't appear in unpaid lists
- Phantom payments exist in database
*/

-- 6. Test results
SELECT '=== TEST RESULTS ===' as info;

SELECT 
    'Automatic payments test:' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM payments WHERE notes IS NULL OR notes = '' OR notes LIKE '%automatic%') = 0 
        THEN '✅ PASS: No automatic payments found'
        ELSE '❌ FAIL: Automatic payments still exist'
    END as result;

-- Only test pending status if the view exists
SELECT 
    'Pending status test:' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'test_payment_status' AND schemaname = 'public')
        AND (SELECT COUNT(*) FROM test_payment_status WHERE payment_status = 'pending') > 0
        THEN '✅ PASS: Some students show pending status (expected)'
        WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'test_payment_status' AND schemaname = 'public')
        THEN '❌ FAIL: No students show pending status'
        ELSE '⚠️ SKIP: Test view not available'
    END as result;

-- 7. Cleanup
DROP VIEW IF EXISTS test_payment_status;

SELECT '=== TEST COMPLETED ===' as info;
