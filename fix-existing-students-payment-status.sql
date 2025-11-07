-- Fix Existing Students Payment Status
-- This script will:
-- 1. Remove incorrectly created automatic group payments
-- 2. Keep legitimate payments (those with proper notes and payment_type)
-- 3. Ensure students show as "pending" for group fees
-- 4. Preserve registration fee payments if they were actually paid

-- Step 1: Show current payment status before fix
SELECT '=== BEFORE FIX: Current Payment Status ===' as info;

SELECT 
    s.id as student_id,
    s.name as student_name,
    COUNT(DISTINCT p.id) as total_payments,
    COUNT(DISTINCT CASE WHEN p.group_id IS NOT NULL THEN p.id END) as group_payments,
    COUNT(DISTINCT CASE WHEN p.group_id IS NULL AND p.payment_type = 'registration_fee' THEN p.id END) as registration_payments,
    SUM(CASE WHEN p.group_id IS NOT NULL THEN p.amount ELSE 0 END) as total_group_paid
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
GROUP BY s.id, s.name
ORDER BY s.name;

-- Step 2: Identify and remove invalid group payments
-- These are payments that were likely created automatically:
-- - Payments with no notes or empty notes
-- - Payments with group_id but missing payment_type
-- - Payments created around the same time as student enrollment (within 1 minute)
SELECT '=== REMOVING INVALID GROUP PAYMENTS ===' as info;

-- Delete payments that are likely automatic/invalid:
-- 1. Group payments with no notes or empty notes
DELETE FROM payments 
WHERE group_id IS NOT NULL 
  AND (notes IS NULL OR notes = '' OR notes = 'Group payment');

-- 2. Group payments without proper payment_type (should be 'group_payment')
DELETE FROM payments 
WHERE group_id IS NOT NULL 
  AND (payment_type IS NULL OR payment_type NOT IN ('group_payment', 'attendance_credit'));

-- 3. Group payments that might have been created automatically
-- (Payments created very close to student enrollment time - within 5 seconds)
DELETE FROM payments p
WHERE p.group_id IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM student_groups sg
    WHERE sg.student_id = p.student_id 
      AND sg.group_id = p.group_id
      AND ABS(EXTRACT(EPOCH FROM (p.created_at - sg.created_at))) < 5
  )
  AND (p.notes IS NULL OR p.notes = '' OR p.notes LIKE '%automatic%' OR p.notes LIKE '%system%');

SELECT '✅ Invalid group payments removed' as status;

-- Step 3: Verify registration fee payments are correct
-- Registration fees should have group_id = NULL and payment_type = 'registration_fee'
SELECT '=== FIXING REGISTRATION FEE PAYMENTS ===' as info;

-- Update registration fee payments to ensure they have correct payment_type
UPDATE payments 
SET payment_type = 'registration_fee'
WHERE group_id IS NULL 
  AND (notes ILIKE '%registration fee%' OR payment_type = 'registration_fee')
  AND payment_type IS NULL;

-- Remove any registration fee payments that incorrectly have a group_id
UPDATE payments 
SET group_id = NULL
WHERE payment_type = 'registration_fee' 
  AND group_id IS NOT NULL;

SELECT '✅ Registration fee payments fixed' as status;

-- Step 4: Show payment status after fix
SELECT '=== AFTER FIX: Updated Payment Status ===' as info;

SELECT 
    s.id as student_id,
    s.name as student_name,
    COUNT(DISTINCT p.id) as total_payments,
    COUNT(DISTINCT CASE WHEN p.group_id IS NOT NULL THEN p.id END) as group_payments,
    COUNT(DISTINCT CASE WHEN p.group_id IS NULL AND p.payment_type = 'registration_fee' THEN p.id END) as registration_payments,
    SUM(CASE WHEN p.group_id IS NOT NULL THEN p.amount ELSE 0 END) as total_group_paid,
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN p.group_id IS NOT NULL THEN p.id END) = 0 THEN '✅ Pending (No group payments)'
        ELSE '⚠️ Has group payments - verify manually'
    END as status
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
GROUP BY s.id, s.name
ORDER BY s.name;

-- Step 5: Show students who should now appear as "pending" for group fees
SELECT '=== STUDENTS WITH PENDING GROUP FEES ===' as info;

SELECT 
    s.id as student_id,
    s.name as student_name,
    sg.group_id,
    g.name as group_name,
    g.price as group_price,
    COALESCE(SUM(CASE WHEN p.group_id = sg.group_id THEN p.amount ELSE 0 END), 0) as amount_paid,
    (g.price - COALESCE(SUM(CASE WHEN p.group_id = sg.group_id THEN p.amount ELSE 0 END), 0)) as remaining_amount,
    CASE 
        WHEN COALESCE(SUM(CASE WHEN p.group_id = sg.group_id THEN p.amount ELSE 0 END), 0) >= g.price THEN '✅ Paid'
        ELSE '⏳ Pending'
    END as payment_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
JOIN groups g ON sg.group_id = g.id
LEFT JOIN payments p ON s.id = p.student_id 
    AND p.group_id = sg.group_id 
    AND p.payment_type = 'group_payment'
    AND p.notes IS NOT NULL 
    AND p.notes != ''
GROUP BY s.id, s.name, sg.group_id, g.name, g.price
ORDER BY s.name, g.name;

-- Step 6: Summary
SELECT '=== FIX COMPLETE ===' as info;
SELECT 
    'Summary' as info,
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT sg.group_id) as total_groups,
    COUNT(DISTINCT CASE WHEN p.group_id IS NOT NULL THEN p.id END) as remaining_group_payments,
    COUNT(DISTINCT CASE WHEN p.group_id IS NULL AND p.payment_type = 'registration_fee' THEN p.id END) as registration_fee_payments
FROM students s
LEFT JOIN student_groups sg ON s.id = sg.student_id
LEFT JOIN payments p ON s.id = p.student_id;

SELECT '✅ All students should now show as "Pending" for group fees unless they have legitimate payments!' as status;

