-- Fix Student Balance Issue (Working with View)
-- Since student_payment_summary is a view, we need to fix the underlying data

-- Step 1: Check the current state of the student
SELECT 
    'Current Student State' as status,
    s.id,
    s.name,
    s.custom_id,
    s.default_discount,
    COUNT(sg.group_id) as total_groups,
    COUNT(CASE WHEN sg.group_discount = 100 THEN 1 END) as free_groups,
    COUNT(CASE WHEN sg.group_discount < 100 THEN 1 END) as paid_groups
FROM students s
LEFT JOIN student_groups sg ON s.id = sg.student_id
WHERE s.id = 'bb002411-c634-4f6c-abaa-021152c3fd15'
GROUP BY s.id, s.name, s.custom_id, s.default_discount;

-- Step 2: Check the student_groups data
SELECT 
    'Student Groups Data' as status,
    sg.student_id,
    sg.group_id,
    g.name as group_name,
    g.price as original_price,
    sg.group_discount,
    ROUND(g.price * (1 - sg.group_discount / 100), 2) as discounted_price,
    CASE 
        WHEN sg.group_discount = 100 THEN 'FREE (100% discount)'
        WHEN sg.group_discount > 0 THEN 'DISCOUNTED'
        ELSE 'NO DISCOUNT'
    END as discount_status
FROM student_groups sg
LEFT JOIN groups g ON sg.group_id = g.id
WHERE sg.student_id = 'bb002411-c634-4f6c-abaa-021152c3fd15'
ORDER BY sg.group_id;

-- Step 3: Check payments data
SELECT 
    'Payments Data' as status,
    p.id,
    p.student_id,
    p.group_id,
    g.name as group_name,
    p.amount,
    p.payment_type,
    p.notes,
    p.date
FROM payments p
LEFT JOIN groups g ON p.group_id = g.id
WHERE p.student_id = 'bb002411-c634-4f6c-abaa-021152c3fd15'
ORDER BY p.date DESC;

-- Step 4: Calculate what the balance should be (correct calculation)
SELECT 
    'Correct Balance Calculation' as status,
    s.id,
    s.name,
    s.custom_id,
    -- Total fees (excluding 100% discounted groups)
    SUM(CASE WHEN sg.group_discount = 100 THEN 0 ELSE ROUND(g.price * (1 - sg.group_discount / 100), 2) END) as total_discounted_fees,
    -- Total payments
    COALESCE(SUM(p.amount), 0) as total_payments,
    -- Expected balance
    SUM(CASE WHEN sg.group_discount = 100 THEN 0 ELSE ROUND(g.price * (1 - sg.group_discount / 100), 2) END) - COALESCE(SUM(p.amount), 0) as expected_balance,
    -- Group breakdown
    STRING_AGG(
        CASE 
            WHEN sg.group_discount = 100 THEN g.name || ' (FREE)'
            ELSE g.name || ' (' || ROUND(g.price * (1 - sg.group_discount / 100), 2) || ')'
        END, 
        ', '
    ) as group_breakdown
FROM students s
LEFT JOIN student_groups sg ON s.id = sg.student_id
LEFT JOIN groups g ON sg.group_id = g.id
LEFT JOIN payments p ON s.id = p.student_id AND p.amount > 0
WHERE s.id = 'bb002411-c634-4f6c-abaa-021152c3fd15'
GROUP BY s.id, s.name, s.custom_id;

-- Step 5: Check if there are any incorrect payments that need to be fixed
SELECT 
    'Payment Issues Check' as status,
    p.id,
    p.student_id,
    p.group_id,
    g.name as group_name,
    sg.group_discount,
    p.amount,
    p.payment_type,
    p.notes,
    CASE 
        WHEN sg.group_discount = 100 AND p.amount > 0 THEN '⚠️ Payment for FREE group'
        WHEN sg.group_discount = 100 AND p.amount = 0 THEN '✅ Correct (no payment for FREE group)'
        ELSE '✅ Normal payment'
    END as payment_status
FROM payments p
LEFT JOIN groups g ON p.group_id = g.id
LEFT JOIN student_groups sg ON p.student_id = sg.student_id AND p.group_id = sg.group_id
WHERE p.student_id = 'bb002411-c634-4f6c-abaa-021152c3fd15'
ORDER BY p.date DESC;
