-- Find student جود موساوي and their payments
-- This script will help identify the duplicate payment

-- Step 1: Find the student
SELECT 
    id,
    name,
    email,
    phone,
    custom_id,
    created_at
FROM students 
WHERE name ILIKE '%جود%' OR name ILIKE '%joud%' OR name ILIKE '%mousawi%'
ORDER BY created_at DESC;

-- Step 2: Once you have the student ID, find all their payments
-- Replace 'STUDENT_ID_HERE' with the actual student ID from step 1
/*
SELECT 
    p.id,
    p.student_id,
    p.group_id,
    p.amount,
    p.payment_type,
    p.notes,
    p.created_at,
    p.updated_at,
    g.name as group_name,
    s.name as student_name
FROM payments p
LEFT JOIN groups g ON p.group_id = g.id
LEFT JOIN students s ON p.student_id = s.id
WHERE p.student_id = 'STUDENT_ID_HERE'
ORDER BY p.created_at DESC;
*/

-- Step 3: Check the student's current balance
-- Replace 'STUDENT_ID_HERE' with the actual student ID
/*
SELECT 
    s.id,
    s.name,
    s.custom_id,
    COALESCE(SUM(p.amount), 0) as total_paid,
    COUNT(p.id) as payment_count,
    -- Show recent payments
    ARRAY_AGG(
        JSON_BUILD_OBJECT(
            'id', p.id,
            'amount', p.amount,
            'notes', p.notes,
            'created_at', p.created_at,
            'group_name', g.name
        ) ORDER BY p.created_at DESC
    ) as recent_payments
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
LEFT JOIN groups g ON p.group_id = g.id
WHERE s.id = 'STUDENT_ID_HERE'
GROUP BY s.id, s.name, s.custom_id;
*/

