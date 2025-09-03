-- Test 100% Discount Scenario
-- This script will help verify the 100% discount calculation issue

-- Step 1: Find students with 100% discounts
SELECT 
    'Students with 100% Discounts' as status,
    sg.student_id,
    s.name as student_name,
    sg.group_id,
    g.name as group_name,
    sg.group_discount,
    g.price as original_price,
    ROUND(g.price * (1 - sg.group_discount / 100), 2) as discounted_price,
    CASE 
        WHEN sg.group_discount = 100 THEN 'FREE (100% discount)'
        WHEN sg.group_discount > 0 THEN 'DISCOUNTED'
        ELSE 'NO DISCOUNT'
    END as discount_status
FROM student_groups sg
LEFT JOIN students s ON sg.student_id = s.id
LEFT JOIN groups g ON sg.group_id = g.id
WHERE sg.group_discount = 100
ORDER BY s.name;

-- Step 2: Check payments for students with 100% discounts
SELECT 
    'Payments for Students with 100% Discounts' as status,
    p.student_id,
    s.name as student_name,
    p.amount,
    p.payment_type,
    p.notes,
    p.group_id,
    g.name as group_name,
    sg.group_discount,
    g.price as original_price,
    ROUND(g.price * (1 - sg.group_discount / 100), 2) as discounted_price
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
LEFT JOIN groups g ON p.group_id = g.id
LEFT JOIN student_groups sg ON p.student_id = sg.student_id AND p.group_id = sg.group_id
WHERE sg.group_discount = 100
    AND p.amount > 0
ORDER BY p.created_at DESC;

-- Step 3: Check total balance calculation for students with 100% discounts
SELECT 
    'Balance Calculation for Students with 100% Discounts' as status,
    s.id,
    s.name,
    COUNT(sg.group_id) as total_groups,
    COUNT(CASE WHEN sg.group_discount = 100 THEN 1 END) as free_groups,
    COUNT(CASE WHEN sg.group_discount < 100 THEN 1 END) as paid_groups,
    SUM(CASE WHEN sg.group_discount = 100 THEN 0 ELSE g.price END) as total_original_fees,
    SUM(CASE WHEN sg.group_discount = 100 THEN 0 ELSE ROUND(g.price * (1 - sg.group_discount / 100), 2) END) as total_discounted_fees,
    SUM(p.amount) as total_payments
FROM students s
LEFT JOIN student_groups sg ON s.id = sg.student_id
LEFT JOIN groups g ON sg.group_id = g.id
LEFT JOIN payments p ON s.id = p.student_id AND p.amount > 0
WHERE sg.group_discount = 100
GROUP BY s.id, s.name
ORDER BY s.name;

-- Step 4: Find the specific student with the 6000 + 4500 issue
SELECT 
    'Specific Student Balance Analysis' as status,
    s.id,
    s.name,
    sg.group_id,
    g.name as group_name,
    g.price as original_price,
    sg.group_discount,
    ROUND(g.price * (1 - sg.group_discount / 100), 2) as discounted_price,
    COALESCE(SUM(p.amount), 0) as total_paid_for_group
FROM students s
LEFT JOIN student_groups sg ON s.id = sg.student_id
LEFT JOIN groups g ON sg.group_id = g.id
LEFT JOIN payments p ON s.id = p.student_id AND sg.group_id = p.group_id AND p.amount > 0
WHERE s.name LIKE '%test%' OR s.name LIKE '%demo%' OR s.name LIKE '%example%'
GROUP BY s.id, s.name, sg.group_id, g.name, g.price, sg.group_discount
ORDER BY s.name, sg.group_id;

SELECT '✅ Test completed! Look for students with 100% discounts and their balance calculations.' as final_status;
