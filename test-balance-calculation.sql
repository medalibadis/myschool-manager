-- Test Balance Calculation Logic
-- This script helps debug the balance calculation issue

-- 1. Check current payment types distribution
SELECT 
    payment_type,
    COUNT(*) as count
FROM payments 
GROUP BY payment_type
ORDER BY count DESC;

-- 2. Check a specific student's payments and balance
-- Replace 'STUDENT_ID_HERE' with an actual student ID from your database
SELECT 
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

-- 3. Check student's group enrollments
SELECT 
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

-- 4. Calculate what the balance should be manually
-- This helps verify if the calculation logic is correct
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
    sp.student_id,
    sp.group_payments,
    sp.registration_payments,
    sp.balance_additions,
    sg.total_group_fees,
    -- Calculate what student owes
    (sg.total_group_fees + 500) as total_owed,  -- 500 is registration fee
    -- Calculate what student has paid
    (sp.group_payments + sp.registration_payments) as total_paid,
    -- Calculate remaining unpaid
    ((sg.total_group_fees + 500) - (sp.group_payments + sp.registration_payments)) as remaining_unpaid,
    -- Calculate final balance
    (sp.balance_additions - ((sg.total_group_fees + 500) - (sp.group_payments + sp.registration_payments))) as final_balance
FROM student_payments sp
JOIN student_groups sg ON sp.student_id = sg.student_id;

-- 5. Check if there are any payments with incorrect group_id values
SELECT 
    id,
    student_id,
    group_id,
    amount,
    payment_type,
    notes
FROM payments
WHERE group_id IS NOT NULL 
AND payment_type != 'group_payment'
LIMIT 10;

-- 6. Check if there are any payments that should be group payments but aren't
SELECT 
    id,
    student_id,
    group_id,
    amount,
    payment_type,
    notes
FROM payments
WHERE group_id IS NOT NULL 
AND notes NOT ILIKE '%registration fee%'
AND notes NOT ILIKE '%refund%'
AND notes NOT ILIKE '%debt%'
AND payment_type != 'group_payment'
LIMIT 10;
