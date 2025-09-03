-- Fix Registration Fee Amount Discrepancy (500 vs 1000)
-- This script will fix students who have 1000 instead of 500 for registration fees

-- Step 1: Show the problem before fixing
SELECT 
    'BEFORE FIX: Students with Registration Fee Issues' as status,
    p.student_id,
    s.name as student_name,
    SUM(p.amount) as total_registration_paid,
    COUNT(*) as payment_count,
    STRING_AGG(CONCAT(p.amount, ' (', p.notes, ')'), '; ') as payment_details
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
WHERE p.payment_type = 'registration_fee' 
   OR p.notes ILIKE '%registration fee%'
   OR p.notes ILIKE '%registration%'
GROUP BY p.student_id, s.name
HAVING SUM(p.amount) != 500
ORDER BY total_registration_paid DESC;

-- Step 2: Remove negative registration fee payments (these cause the 1000 issue)
DELETE FROM payments 
WHERE (payment_type = 'registration_fee' 
   OR notes ILIKE '%registration fee%'
   OR notes ILIKE '%registration%')
   AND amount < 0;

-- Step 3: For students with more than 500 total registration payments, keep only the first 500
-- This handles cases where multiple positive payments were made
WITH registration_totals AS (
    SELECT 
        p.student_id,
        s.name as student_name,
        SUM(p.amount) as total_paid,
        COUNT(*) as payment_count
    FROM payments p
    LEFT JOIN students s ON p.student_id = s.id
    WHERE p.payment_type = 'registration_fee' 
       OR p.notes ILIKE '%registration fee%'
       OR p.notes ILIKE '%registration%'
    GROUP BY p.student_id, s.name
    HAVING SUM(p.amount) > 500
),
excess_payments AS (
    SELECT 
        p.id,
        p.student_id,
        p.amount,
        p.notes,
        p.created_at,
        ROW_NUMBER() OVER (
            PARTITION BY p.student_id 
            ORDER BY p.created_at ASC
        ) as payment_order
    FROM payments p
    INNER JOIN registration_totals rt ON p.student_id = rt.student_id
    WHERE (p.payment_type = 'registration_fee' 
       OR p.notes ILIKE '%registration fee%'
       OR p.notes ILIKE '%registration%')
       AND p.amount > 0
)
DELETE FROM payments 
WHERE id IN (
    SELECT ep.id 
    FROM excess_payments ep
    WHERE ep.payment_order > 1  -- Keep only the first payment
);

-- Step 4: Show the result after fixing
SELECT 
    'AFTER FIX: Registration Fee Payments Summary' as status,
    COUNT(*) as total_registration_payments,
    SUM(amount) as total_registration_amount,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount,
    AVG(amount) as avg_amount
FROM payments 
WHERE payment_type = 'registration_fee' 
   OR notes ILIKE '%registration fee%'
   OR notes ILIKE '%registration%';

-- Step 5: Verify all students now have correct registration fee amounts
SELECT 
    'VERIFICATION: Students with Registration Fee Amounts' as status,
    p.student_id,
    s.name as student_name,
    SUM(p.amount) as total_registration_paid,
    COUNT(*) as payment_count,
    CASE 
        WHEN SUM(p.amount) = 500 THEN '✅ Correct (500)'
        WHEN SUM(p.amount) = 0 THEN '✅ No Registration Fee Paid'
        WHEN SUM(p.amount) < 500 THEN '⚠️ Partial Payment'
        ELSE '❌ Still Incorrect'
    END as status
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
WHERE p.payment_type = 'registration_fee' 
   OR p.notes ILIKE '%registration fee%'
   OR p.notes ILIKE '%registration%'
GROUP BY p.student_id, s.name
ORDER BY total_registration_paid DESC;

-- Step 6: Update waiting list students with incorrect registration fee amounts
UPDATE waiting_list 
SET registration_fee_amount = 500.00
WHERE registration_fee_amount != 500.00 
   AND registration_fee_amount IS NOT NULL;

-- Step 7: Show waiting list verification
SELECT 
    'Waiting List Registration Fee Verification' as status,
    COUNT(*) as total_students,
    COUNT(CASE WHEN registration_fee_amount = 500 THEN 1 END) as correct_amount,
    COUNT(CASE WHEN registration_fee_amount != 500 THEN 1 END) as incorrect_amount
FROM waiting_list
WHERE registration_fee_amount IS NOT NULL;

SELECT '✅ Registration fee discrepancy fix completed! All students should now show 500 instead of 1000.' as final_status;
