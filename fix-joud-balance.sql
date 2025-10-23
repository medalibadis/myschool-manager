-- Quick fix for جود موساوي duplicate payment
-- Run these queries one by one in your SQL editor

-- Step 1: Find the student
SELECT 
    id,
    name,
    email,
    custom_id
FROM students 
WHERE name ILIKE '%جود%' OR name ILIKE '%joud%' OR name ILIKE '%mousawi%';

-- Step 2: Find payments using custom_id (ST0243)
-- This will work with the custom_id instead of UUID
SELECT 
    p.id as payment_id,
    p.amount,
    p.notes,
    p.created_at,
    g.name as group_name,
    s.name as student_name,
    s.custom_id,
    ROW_NUMBER() OVER (ORDER BY p.created_at DESC) as payment_order
FROM payments p
LEFT JOIN groups g ON p.group_id = g.id
LEFT JOIN students s ON p.student_id = s.id
WHERE s.custom_id = 'ST0243'
ORDER BY p.created_at DESC;

-- Step 3: Delete the most recent payment (usually the duplicate)
-- Replace 'PAYMENT_ID_TO_DELETE' with the payment ID you want to remove
DELETE FROM payments 
WHERE id = 'PAYMENT_ID_TO_DELETE';

-- Step 4: Verify the balance is now 0
SELECT 
    s.name,
    s.custom_id,
    COALESCE(SUM(p.amount), 0) as total_paid,
    CASE 
        WHEN COALESCE(SUM(p.amount), 0) = 0 THEN '✅ Balance is now 0'
        ELSE '❌ Balance: ' || COALESCE(SUM(p.amount), 0) || ' DZD'
    END as result
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
WHERE s.custom_id = 'ST0243'
GROUP BY s.id, s.name, s.custom_id;
