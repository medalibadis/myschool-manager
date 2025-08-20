-- Check Current Database Schema and Apply Fix
-- This script will check what schema exists and apply the appropriate fix

-- 1. Check what tables exist
SELECT '=== CHECKING CURRENT SCHEMA ===' as info;

SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ Exists' ELSE '❌ Missing' END as status
FROM information_schema.tables 
WHERE table_name IN ('teachers', 'groups', 'students', 'sessions', 'attendance', 'payments', 'student_groups', 'waiting_list')
AND table_schema = 'public'
ORDER BY table_name;

-- 2. Check students table structure
SELECT '=== STUDENTS TABLE STRUCTURE ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if student_groups junction table exists and its structure
SELECT '=== STUDENT_GROUPS JUNCTION TABLE ===' as info;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_groups' AND table_schema = 'public')
        THEN '✅ Junction table exists'
        ELSE '❌ Junction table missing'
    END as junction_table_status;

-- If junction table exists, show its structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_groups' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check current student-group relationships
SELECT '=== CURRENT STUDENT-GROUP RELATIONSHIPS ===' as info;

-- Try to get relationships using junction table first
SELECT 
    'Using junction table:' as method,
    COUNT(*) as relationship_count
FROM student_groups sg
JOIN students s ON sg.student_id = s.id
JOIN groups g ON sg.group_id = g.id;

-- 5. Check for any automatic payments
SELECT '=== CHECKING FOR AUTOMATIC PAYMENTS ===' as info;

SELECT 
    'Automatic payments found:' as status,
    COUNT(*) as count
FROM payments 
WHERE notes IS NULL 
   OR notes = '' 
   OR notes LIKE '%automatic%'
   OR notes LIKE '%auto%'
   OR notes LIKE '%phantom%';

-- 6. Show sample data to understand current state
SELECT '=== SAMPLE DATA ===' as info;

SELECT 'Sample teachers:' as info;
SELECT id, name, email FROM teachers LIMIT 3;

SELECT 'Sample groups:' as info;
SELECT id, name, price FROM groups LIMIT 3;

SELECT 'Sample students:' as info;
SELECT id, name FROM students LIMIT 3;

SELECT 'Sample payments:' as info;
SELECT id, student_id, group_id, amount, notes, created_at FROM payments ORDER BY created_at DESC LIMIT 5;

-- 7. Apply the fix based on current schema
SELECT '=== APPLYING FIX ===' as info;

-- Create the payment status view using the correct schema
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

-- 8. Test the fix
SELECT '=== TESTING THE FIX ===' as info;

SELECT 'Payment status for students:' as info;
SELECT * FROM student_payment_status ORDER BY group_id, student_name LIMIT 10;

-- 9. Summary
SELECT '=== SUMMARY ===' as info;

SELECT 
    'Schema type:' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'group_id')
        THEN 'Direct foreign key (students.group_id)'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_groups')
        THEN 'Junction table (student_groups)'
        ELSE 'Unknown schema'
    END as schema_type;

-- Check if the view was created successfully using PostgreSQL system catalog
SELECT 
    'Fix status:' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'student_payment_status' AND schemaname = 'public')
        THEN '✅ Payment status view created successfully'
        ELSE '❌ Failed to create payment status view'
    END as fix_status;

-- Show the created view details
SELECT 'View details:' as info;
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname = 'student_payment_status' 
AND schemaname = 'public';

SELECT '=== FIX COMPLETED ===' as info;
