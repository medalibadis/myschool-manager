-- Fix Student Balance for 100% Discount Issue
-- Run this script in your SQL editor to fix the balance calculation

-- Step 1: Update the student_payment_summary table with correct balance
UPDATE student_payment_summary 
SET 
    total_groups = (
        SELECT COUNT(sg.group_id) 
        FROM student_groups sg 
        WHERE sg.student_id = student_payment_summary.student_id
    ),
    active_groups = (
        SELECT COUNT(sg.group_id) 
        FROM student_groups sg 
        WHERE sg.student_id = student_payment_summary.student_id
    ),
    stopped_groups = 0,
    registration_fee_paid = (
        SELECT COALESCE(SUM(p.amount), 0)
        FROM payments p
        WHERE p.student_id = student_payment_summary.student_id
        AND (p.payment_type = 'registration_fee' OR p.notes ILIKE '%registration fee%')
        AND p.amount > 0
    ),
    group_payments_paid = (
        SELECT COALESCE(SUM(p.amount), 0)
        FROM payments p
        WHERE p.student_id = student_payment_summary.student_id
        AND p.group_id IS NOT NULL
        AND p.amount > 0
    ),
    balance_additions = (
        SELECT COALESCE(SUM(p.amount), 0)
        FROM payments p
        WHERE p.student_id = student_payment_summary.student_id
        AND p.group_id IS NULL
        AND p.amount > 0
        AND p.payment_type != 'registration_fee'
        AND p.notes NOT ILIKE '%registration fee%'
    ),
    refunds_received = (
        SELECT COALESCE(SUM(p.amount), 0)
        FROM payments p
        WHERE p.student_id = student_payment_summary.student_id
        AND p.amount < 0
    )
WHERE student_id = 'bb002411-c634-4f6c-abaa-021152c3fd15';

-- Step 2: Verify the fix
SELECT 
    'After Fix - Student Balance' as status,
    sps.*,
    (
        SELECT SUM(CASE WHEN sg.group_discount = 100 THEN 0 ELSE ROUND(g.price * (1 - sg.group_discount / 100), 2) END)
        FROM student_groups sg
        LEFT JOIN groups g ON sg.group_id = g.id
        WHERE sg.student_id = sps.student_id
    ) as expected_total_fees,
    (
        SELECT SUM(CASE WHEN sg.group_discount = 100 THEN 0 ELSE ROUND(g.price * (1 - sg.group_discount / 100), 2) END) - sps.group_payments_paid
        FROM student_groups sg
        LEFT JOIN groups g ON sg.group_id = g.id
        WHERE sg.student_id = sps.student_id
    ) as expected_balance
FROM student_payment_summary sps
WHERE student_id = 'bb002411-c634-4f6c-abaa-021152c3fd15';

-- Step 3: Show the corrected group breakdown
SELECT 
    'Corrected Group Breakdown' as status,
    s.name,
    s.custom_id,
    sg.group_id,
    g.name as group_name,
    g.price as original_price,
    sg.group_discount,
    ROUND(g.price * (1 - sg.group_discount / 100), 2) as discounted_price,
    CASE 
        WHEN sg.group_discount = 100 THEN 'FREE (100% discount)'
        WHEN sg.group_discount > 0 THEN 'DISCOUNTED'
        ELSE 'NO DISCOUNT'
    END as discount_status,
    COALESCE(SUM(p.amount), 0) as payments_for_group
FROM students s
LEFT JOIN student_groups sg ON s.id = sg.student_id
LEFT JOIN groups g ON sg.group_id = g.id
LEFT JOIN payments p ON s.id = p.student_id AND sg.group_id = p.group_id AND p.amount > 0
WHERE s.id = 'bb002411-c634-4f6c-abaa-021152c3fd15'
GROUP BY s.id, s.name, s.custom_id, sg.group_id, g.name, g.price, sg.group_discount
ORDER BY sg.group_id;

SELECT '✅ Fix completed! The student balance should now show the correct amount.' as final_status;
