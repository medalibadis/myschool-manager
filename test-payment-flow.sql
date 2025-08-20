-- Test Payment Flow - Verify Group Fees are Tracked Correctly
-- This script helps verify that the payment system is working as expected

-- 1. Check current payment types distribution
SELECT 
    payment_type,
    COUNT(*) as count
FROM payments 
GROUP BY payment_type
ORDER BY count DESC;

-- 2. Check a specific student's current state
-- Replace 'STUDENT_ID_HERE' with an actual student ID from your database
SELECT 
    '=== STUDENT INFO ===' as section,
    s.id,
    s.name,
    s.registration_fee_paid,
    s.registration_fee_amount
FROM students s
WHERE s.id = 'STUDENT_ID_HERE';  -- Replace with actual student ID

-- 3. Check student's group enrollments
SELECT 
    '=== GROUP ENROLLMENTS ===' as section,
    sg.student_id,
    sg.group_id,
    sg.status,
    g.name as group_name,
    g.price as group_price,
    g.start_date
FROM student_groups sg
JOIN groups g ON sg.group_id = g.id
WHERE sg.student_id = 'STUDENT_ID_HERE'  -- Replace with actual student ID
ORDER BY g.start_date;

-- 4. Check student's payment history
SELECT 
    '=== PAYMENT HISTORY ===' as section,
    p.id,
    p.student_id,
    p.group_id,
    p.amount,
    p.original_amount,
    p.payment_type,
    p.notes,
    p.created_at,
    CASE 
        WHEN p.group_id IS NOT NULL THEN 'Group Payment'
        WHEN p.group_id IS NULL AND p.notes ILIKE '%registration fee%' THEN 'Registration Fee'
        WHEN p.group_id IS NULL AND p.notes ILIKE '%refund%' THEN 'Refund'
        WHEN p.group_id IS NULL AND p.notes ILIKE '%debt%' THEN 'Debt Payment'
        WHEN p.group_id IS NULL THEN 'Balance Addition'
        ELSE 'Unknown'
    END as expected_type
FROM payments p
WHERE p.student_id = 'STUDENT_ID_HERE'  -- Replace with actual student ID
ORDER BY p.created_at DESC;

-- 5. Calculate what the balance should be manually
WITH student_payments AS (
    SELECT 
        student_id,
        group_id,
        SUM(CASE WHEN group_id IS NOT NULL THEN original_amount ELSE 0 END) as group_payments,
        SUM(CASE WHEN group_id IS NULL AND notes ILIKE '%registration fee%' THEN original_amount ELSE 0 END) as registration_payments,
        SUM(CASE WHEN group_id IS NULL AND notes NOT ILIKE '%registration fee%' AND notes NOT ILIKE '%refund%' AND notes NOT ILIKE '%debt%' THEN amount ELSE 0 END) as balance_additions
    FROM payments
    WHERE student_id = 'STUDENT_ID_HERE'  -- Replace with actual student ID
    GROUP BY student_id
),
student_groups AS (
    SELECT 
        sg.student_id,
        SUM(g.price) as total_group_fees
    FROM student_groups sg
    JOIN groups g ON sg.group_id = g.id
    WHERE sg.student_id = 'STUDENT_ID_HERE'  -- Replace with actual student ID
    GROUP BY sg.student_id
)
SELECT 
    '=== MANUAL BALANCE CALCULATION ===' as section,
    sp.student_id,
    sp.group_payments,
    sp.registration_payments,
    sp.balance_additions,
    sg.total_group_fees,
    -- Calculate what student owes
    (COALESCE(sg.total_group_fees, 0) + 500) as total_owed,  -- 500 is registration fee
    -- Calculate what student has paid
    (COALESCE(sp.group_payments, 0) + COALESCE(sp.registration_payments, 0)) as total_paid,
    -- Calculate remaining unpaid
    ((COALESCE(sg.total_group_fees, 0) + 500) - (COALESCE(sp.group_payments, 0) + COALESCE(sp.registration_payments, 0))) as remaining_unpaid,
    -- Calculate final balance
    (COALESCE(sp.balance_additions, 0) - ((COALESCE(sg.total_group_fees, 0) + 500) - (COALESCE(sp.group_payments, 0) + COALESCE(sp.registration_payments, 0)))) as final_balance
FROM student_payments sp
JOIN student_groups sg ON sp.student_id = sg.student_id;

-- 6. Check if there are any payments with incorrect payment_type values
SELECT 
    '=== PAYMENT TYPE VERIFICATION ===' as section,
    id,
    student_id,
    group_id,
    amount,
    payment_type,
    notes,
    CASE 
        WHEN group_id IS NOT NULL AND payment_type != 'group_payment' THEN '❌ Should be group_payment'
        WHEN group_id IS NULL AND notes ILIKE '%registration fee%' AND payment_type != 'registration_fee' THEN '❌ Should be registration_fee'
        WHEN group_id IS NULL AND notes NOT ILIKE '%registration fee%' AND notes NOT ILIKE '%refund%' AND notes NOT ILIKE '%debt%' AND payment_type != 'balance_addition' THEN '❌ Should be balance_addition'
        ELSE '✅ Correct'
    END as status
FROM payments
WHERE student_id = 'STUDENT_ID_HERE'  -- Replace with actual student ID
ORDER BY created_at DESC;

-- 7. Summary of what should happen
SELECT 
    '=== EXPECTED BEHAVIOR ===' as section,
    'When student joins group:' as action,
    '1. Registration fee ($500) should appear as unpaid' as step1,
    '2. Group fee should appear as unpaid' as step2,
    '3. Balance should show negative amount (what they owe)' as step3,
    '4. Unpaid groups list should show both fees' as step4
UNION ALL
SELECT 
    'When payment is made:' as action,
    '1. Payment should be allocated to oldest unpaid item first' as step1,
    '2. Receipt should show correct payment type' as step2,
    '3. Balance should update correctly' as step3,
    '4. Unpaid groups should update' as step4;
