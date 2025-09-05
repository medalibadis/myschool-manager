-- Diagnose the specific student's discount issue
-- Replace 'bb002411-c634-4f6c-abaa-021152c3fd15' with the actual student ID

-- Step 1: Check the student's groups and discounts
SELECT 
    'Student Groups and Discounts' as status,
    s.id,
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
    END as discount_status
FROM students s
LEFT JOIN student_groups sg ON s.id = sg.student_id
LEFT JOIN groups g ON sg.group_id = g.id
WHERE s.id = 'bb002411-c634-4f6c-abaa-021152c3fd15'
ORDER BY sg.group_id;

-- Step 2: Check payments for this student
SELECT 
    'Student Payments' as status,
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

-- Step 3: Check current payment summary
SELECT 
    'Current Payment Summary' as status,
    *
FROM student_payment_summary
WHERE student_id = 'bb002411-c634-4f6c-abaa-021152c3fd15';

-- Step 4: Calculate what the balance should be
SELECT 
    'Expected Balance Calculation' as status,
    s.id,
    s.name,
    s.custom_id,
    COUNT(sg.group_id) as total_groups,
    COUNT(CASE WHEN sg.group_discount = 100 THEN 1 END) as free_groups,
    COUNT(CASE WHEN sg.group_discount < 100 THEN 1 END) as paid_groups,
    SUM(CASE WHEN sg.group_discount = 100 THEN 0 ELSE g.price END) as total_original_fees,
    SUM(CASE WHEN sg.group_discount = 100 THEN 0 ELSE ROUND(g.price * (1 - sg.group_discount / 100), 2) END) as total_discounted_fees,
    COALESCE(SUM(p.amount), 0) as total_payments,
    SUM(CASE WHEN sg.group_discount = 100 THEN 0 ELSE ROUND(g.price * (1 - sg.group_discount / 100), 2) END) - COALESCE(SUM(p.amount), 0) as expected_balance
FROM students s
LEFT JOIN student_groups sg ON s.id = sg.student_id
LEFT JOIN groups g ON sg.group_id = g.id
LEFT JOIN payments p ON s.id = p.student_id AND p.amount > 0
WHERE s.id = 'bb002411-c634-4f6c-abaa-021152c3fd15'
GROUP BY s.id, s.name, s.custom_id;
