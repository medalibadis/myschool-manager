-- Test Discount Payment Scenario
-- This script will help verify if the discount payment issue is resolved

-- Step 1: Find students with discounts applied
SELECT 
    'Students with Group-Specific Discounts' as status,
    sg.student_id,
    s.name as student_name,
    sg.group_id,
    g.name as group_name,
    sg.group_discount,
    g.price as original_price,
    ROUND(g.price * (1 - sg.group_discount / 100), 2) as discounted_price
FROM student_groups sg
LEFT JOIN students s ON sg.student_id = s.id
LEFT JOIN groups g ON sg.group_id = g.id
WHERE sg.group_discount > 0
ORDER BY sg.group_discount DESC;

-- Step 2: Find students with default discounts
SELECT 
    'Students with Default Discounts' as status,
    s.id,
    s.name,
    s.default_discount,
    sg.group_id,
    g.name as group_name,
    g.price as original_price,
    ROUND(g.price * (1 - s.default_discount / 100), 2) as discounted_price
FROM students s
LEFT JOIN student_groups sg ON s.id = sg.student_id
LEFT JOIN groups g ON sg.group_id = g.id
WHERE s.default_discount > 0
ORDER BY s.default_discount DESC;

-- Step 3: Check payments for students with discounts
SELECT 
    'Payments for Students with Discounts' as status,
    p.student_id,
    s.name as student_name,
    p.amount,
    p.payment_type,
    p.notes,
    p.group_id,
    g.name as group_name,
    sg.group_discount,
    s.default_discount,
    g.price as original_price,
    CASE 
        WHEN sg.group_discount > 0 THEN ROUND(g.price * (1 - sg.group_discount / 100), 2)
        WHEN s.default_discount > 0 THEN ROUND(g.price * (1 - s.default_discount / 100), 2)
        ELSE g.price
    END as discounted_price
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
LEFT JOIN groups g ON p.group_id = g.id
LEFT JOIN student_groups sg ON p.student_id = sg.student_id AND p.group_id = sg.group_id
WHERE (sg.group_discount > 0 OR s.default_discount > 0)
    AND p.amount > 0
ORDER BY p.created_at DESC;

-- Step 4: Find cases where full discounted amount was paid
SELECT 
    'Full Discounted Amount Paid Cases' as status,
    p.student_id,
    s.name as student_name,
    p.group_id,
    g.name as group_name,
    p.amount as payment_amount,
    sg.group_discount,
    s.default_discount,
    g.price as original_price,
    CASE 
        WHEN sg.group_discount > 0 THEN ROUND(g.price * (1 - sg.group_discount / 100), 2)
        WHEN s.default_discount > 0 THEN ROUND(g.price * (1 - s.default_discount / 100), 2)
        ELSE g.price
    END as discounted_price,
    CASE 
        WHEN sg.group_discount > 0 THEN ROUND(g.price * (1 - sg.group_discount / 100), 2)
        WHEN s.default_discount > 0 THEN ROUND(g.price * (1 - s.default_discount / 100), 2)
        ELSE g.price
    END - p.amount as remaining_after_payment
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
LEFT JOIN groups g ON p.group_id = g.id
LEFT JOIN student_groups sg ON p.student_id = sg.student_id AND p.group_id = sg.group_id
WHERE (sg.group_discount > 0 OR s.default_discount > 0)
    AND p.amount > 0
    AND p.amount >= CASE 
        WHEN sg.group_discount > 0 THEN ROUND(g.price * (1 - sg.group_discount / 100), 2)
        WHEN s.default_discount > 0 THEN ROUND(g.price * (1 - s.default_discount / 100), 2)
        ELSE g.price
    END
ORDER BY p.created_at DESC;

SELECT '✅ Test completed! Look for students with discounts and their payment status.' as final_status;
