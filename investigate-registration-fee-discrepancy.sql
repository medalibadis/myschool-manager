-- Investigation Script: Registration Fee Amount Discrepancy (500 vs 1000)
-- This script will help identify why some students show 1000 instead of 500 for registration fees

-- Step 1: Check all registration fee payments
SELECT 
    'Registration Fee Payments Analysis' as status,
    COUNT(*) as total_registration_payments,
    SUM(amount) as total_registration_amount,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount,
    AVG(amount) as avg_amount
FROM payments 
WHERE payment_type = 'registration_fee' 
   OR notes ILIKE '%registration fee%'
   OR notes ILIKE '%registration%';

-- Step 2: Show individual registration fee payments
SELECT 
    'Individual Registration Fee Payments' as status,
    p.id,
    p.student_id,
    s.name as student_name,
    p.amount,
    p.payment_type,
    p.notes,
    p.date,
    p.created_at
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
WHERE p.payment_type = 'registration_fee' 
   OR p.notes ILIKE '%registration fee%'
   OR p.notes ILIKE '%registration%'
ORDER BY p.amount DESC, p.created_at DESC;

-- Step 3: Check for students with multiple registration fee payments
SELECT 
    'Students with Multiple Registration Fee Payments' as status,
    p.student_id,
    s.name as student_name,
    COUNT(*) as payment_count,
    SUM(p.amount) as total_paid,
    MIN(p.amount) as min_payment,
    MAX(p.amount) as max_payment,
    STRING_AGG(p.notes, '; ') as all_notes
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
WHERE p.payment_type = 'registration_fee' 
   OR p.notes ILIKE '%registration fee%'
   OR p.notes ILIKE '%registration%'
GROUP BY p.student_id, s.name
HAVING COUNT(*) > 1
ORDER BY total_paid DESC;

-- Step 4: Check for negative registration fee payments (these cause the 1000 issue)
SELECT 
    'Negative Registration Fee Payments (CAUSE OF 1000 ISSUE)' as status,
    p.id,
    p.student_id,
    s.name as student_name,
    p.amount,
    p.payment_type,
    p.notes,
    p.date,
    p.created_at
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
WHERE (p.payment_type = 'registration_fee' 
   OR p.notes ILIKE '%registration fee%'
   OR p.notes ILIKE '%registration%')
   AND p.amount < 0
ORDER BY p.amount ASC;

-- Step 5: Show students with registration fee amounts that don't match expected 500
SELECT 
    'Students with Non-Standard Registration Fee Amounts' as status,
    p.student_id,
    s.name as student_name,
    SUM(p.amount) as total_registration_paid,
    COUNT(*) as payment_count,
    CASE 
        WHEN SUM(p.amount) = 500 THEN '✅ Correct (500)'
        WHEN SUM(p.amount) = 1000 THEN '❌ Double (1000) - Likely has negative payment'
        WHEN SUM(p.amount) > 1000 THEN '❌ Excessive (>1000)'
        WHEN SUM(p.amount) < 500 THEN '❌ Partial (<500)'
        ELSE '❓ Unknown'
    END as status
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
WHERE p.payment_type = 'registration_fee' 
   OR p.notes ILIKE '%registration fee%'
   OR p.notes ILIKE '%registration%'
GROUP BY p.student_id, s.name
HAVING SUM(p.amount) != 500
ORDER BY total_registration_paid DESC;

-- Step 6: Check waiting list students registration fee amounts
SELECT 
    'Waiting List Students Registration Fee Amounts' as status,
    id,
    name,
    registration_fee_amount,
    registration_fee_paid,
    CASE 
        WHEN registration_fee_amount = 500 THEN '✅ Correct'
        WHEN registration_fee_amount = 1000 THEN '❌ Double'
        ELSE '❓ Other'
    END as status
FROM waiting_list
WHERE registration_fee_amount IS NOT NULL
ORDER BY registration_fee_amount DESC;

SELECT '✅ Investigation completed! Look for negative registration fee payments as the cause of 1000 amounts.' as final_status;
