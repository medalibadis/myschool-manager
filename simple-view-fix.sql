-- Simple Fix for Student Balance Issue
-- The issue is likely in the view calculation, not the underlying data

-- Step 1: Check if the student_groups data is correct
SELECT 
    'Verifying student_groups data' as status,
    sg.student_id,
    sg.group_id,
    g.name as group_name,
    g.price as original_price,
    sg.group_discount,
    CASE 
        WHEN sg.group_discount = 100 THEN 'FREE (100% discount)'
        WHEN sg.group_discount > 0 THEN 'DISCOUNTED'
        ELSE 'NO DISCOUNT'
    END as discount_status
FROM student_groups sg
LEFT JOIN groups g ON sg.group_id = g.id
WHERE sg.student_id = 'bb002411-c634-4f6c-abaa-021152c3fd15'
ORDER BY sg.group_id;

-- Step 2: Check if there are any payments for the 100% discounted group (should be 0)
SELECT 
    'Checking payments for 100% discounted groups' as status,
    p.id,
    p.student_id,
    p.group_id,
    g.name as group_name,
    sg.group_discount,
    p.amount,
    p.payment_type,
    p.notes,
    CASE 
        WHEN sg.group_discount = 100 AND p.amount > 0 THEN '❌ Should be 0 (FREE group)'
        WHEN sg.group_discount = 100 AND p.amount = 0 THEN '✅ Correct'
        ELSE '✅ Normal payment'
    END as payment_status
FROM payments p
LEFT JOIN groups g ON p.group_id = g.id
LEFT JOIN student_groups sg ON p.student_id = sg.student_id AND p.group_id = sg.group_id
WHERE p.student_id = 'bb002411-c634-4f6c-abaa-021152c3fd15'
AND sg.group_discount = 100;

-- Step 3: If there are payments for 100% discounted groups, remove them
-- (Uncomment and run this if Step 2 shows incorrect payments)
/*
DELETE FROM payments 
WHERE id IN (
    SELECT p.id
    FROM payments p
    LEFT JOIN student_groups sg ON p.student_id = sg.student_id AND p.group_id = sg.group_id
    WHERE p.student_id = 'bb002411-c634-4f6c-abaa-021152c3fd15'
    AND sg.group_discount = 100
    AND p.amount > 0
);
*/

-- Step 4: Calculate the correct balance manually
SELECT 
    'Manual Balance Calculation' as status,
    s.name,
    s.custom_id,
    -- Group 1: 6000 (no discount)
    (SELECT COALESCE(g.price, 0) 
     FROM student_groups sg1 
     LEFT JOIN groups g ON sg1.group_id = g.id 
     WHERE sg1.student_id = s.id AND sg1.group_discount < 100 
     ORDER BY sg1.group_id LIMIT 1) as group1_fee,
    -- Group 2: 4500 (100% discount = FREE)
    (SELECT CASE 
        WHEN sg2.group_discount = 100 THEN 0 
        ELSE COALESCE(g.price, 0) 
     END
     FROM student_groups sg2 
     LEFT JOIN groups g ON sg2.group_id = g.id 
     WHERE sg2.student_id = s.id 
     ORDER BY sg2.group_id OFFSET 1 LIMIT 1) as group2_fee,
    -- Total fees (should be 6000 + 0 = 6000)
    (SELECT SUM(CASE WHEN sg.group_discount = 100 THEN 0 ELSE g.price END)
     FROM student_groups sg 
     LEFT JOIN groups g ON sg.group_id = g.id 
     WHERE sg.student_id = s.id) as total_fees,
    -- Total payments
    COALESCE(SUM(p.amount), 0) as total_payments,
    -- Expected balance (should be 6000 - payments)
    (SELECT SUM(CASE WHEN sg.group_discount = 100 THEN 0 ELSE g.price END)
     FROM student_groups sg 
     LEFT JOIN groups g ON sg.group_id = g.id 
     WHERE sg.student_id = s.id) - COALESCE(SUM(p.amount), 0) as expected_balance
FROM students s
LEFT JOIN payments p ON s.id = p.student_id AND p.amount > 0
WHERE s.id = 'bb002411-c634-4f6c-abaa-021152c3fd15'
GROUP BY s.id, s.name, s.custom_id;

-- Step 5: Show the current view data for comparison
SELECT 
    'Current View Data' as status,
    *
FROM student_payment_summary
WHERE student_id = 'bb002411-c634-4f6c-abaa-021152c3fd15';

SELECT '✅ If the manual calculation shows 6000 but the view shows 4500, the view needs to be fixed.' as final_note;
