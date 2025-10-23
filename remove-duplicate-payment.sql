-- Remove duplicate payment for student جود موساوي
-- IMPORTANT: Run the find script first to identify the correct payment to delete

-- Step 1: First, let's see all payments for this student to identify the duplicate
-- Replace 'STUDENT_ID_HERE' with the actual student ID from the find script
/*
SELECT 
    p.id,
    p.student_id,
    p.group_id,
    p.amount,
    p.payment_type,
    p.notes,
    p.created_at,
    g.name as group_name,
    s.name as student_name,
    ROW_NUMBER() OVER (ORDER BY p.created_at DESC) as payment_order
FROM payments p
LEFT JOIN groups g ON p.group_id = g.id
LEFT JOIN students s ON p.student_id = s.id
WHERE p.student_id = 'STUDENT_ID_HERE'
ORDER BY p.created_at DESC;
*/

-- Step 2: Delete the duplicate payment (usually the most recent one)
-- Replace 'PAYMENT_ID_TO_DELETE' with the ID of the duplicate payment
-- Replace 'STUDENT_ID_HERE' with the student ID
/*
-- First, let's backup the payment data (optional but recommended)
CREATE TEMP TABLE payment_backup AS 
SELECT * FROM payments WHERE id = 'PAYMENT_ID_TO_DELETE';

-- Show what we're about to delete
SELECT 
    'ABOUT TO DELETE:' as action,
    p.id,
    p.amount,
    p.notes,
    p.created_at,
    s.name as student_name
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
WHERE p.id = 'PAYMENT_ID_TO_DELETE';

-- Delete the duplicate payment
DELETE FROM payments 
WHERE id = 'PAYMENT_ID_TO_DELETE' 
AND student_id = 'STUDENT_ID_HERE';

-- Verify the deletion
SELECT 
    'AFTER DELETION:' as action,
    s.id,
    s.name,
    s.custom_id,
    COALESCE(SUM(p.amount), 0) as total_paid,
    COUNT(p.id) as remaining_payments
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
WHERE s.id = 'STUDENT_ID_HERE'
GROUP BY s.id, s.name, s.custom_id;
*/

-- Step 3: Alternative approach - Delete the most recent payment if it's a duplicate
-- This is safer as it targets the most recent payment which is likely the duplicate
/*
-- Find the most recent payment for this student
WITH recent_payment AS (
    SELECT 
        p.id,
        p.amount,
        p.notes,
        p.created_at,
        ROW_NUMBER() OVER (ORDER BY p.created_at DESC) as rn
    FROM payments p
    WHERE p.student_id = 'STUDENT_ID_HERE'
    ORDER BY p.created_at DESC
)
DELETE FROM payments 
WHERE id IN (
    SELECT id FROM recent_payment WHERE rn = 1
);
*/

-- Step 4: Verify the final balance
-- Replace 'STUDENT_ID_HERE' with the actual student ID
/*
SELECT 
    s.id,
    s.name,
    s.custom_id,
    COALESCE(SUM(p.amount), 0) as total_paid,
    COUNT(p.id) as payment_count,
    CASE 
        WHEN COALESCE(SUM(p.amount), 0) = 0 THEN 'Balance is now 0 ✅'
        ELSE 'Balance: ' || COALESCE(SUM(p.amount), 0) || ' DZD'
    END as balance_status
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
WHERE s.id = 'STUDENT_ID_HERE'
GROUP BY s.id, s.name, s.custom_id;
*/

