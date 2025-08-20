-- Fix Payment Types Script
-- This script ensures that all payments have the correct payment_type

-- 0. Quick diagnostic - check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name IN ('group_id', 'payment_type', 'notes')
ORDER BY column_name;

-- 1. Check current payment types
SELECT 
    payment_type,
    COUNT(*) as count
FROM payments 
GROUP BY payment_type
ORDER BY count DESC;

-- 1b. Check what payment types should be (without GROUP BY)
SELECT 
    payment_type,
    group_id,
    notes,
    CASE 
        WHEN group_id IS NOT NULL THEN 'Group Payment'
        WHEN group_id IS NULL AND notes ILIKE '%registration fee%' THEN 'Registration Fee'
        WHEN group_id IS NULL AND notes ILIKE '%refund%' THEN 'Refund'
        WHEN group_id IS NULL AND notes ILIKE '%debt%' THEN 'Debt Payment'
        WHEN group_id IS NULL THEN 'Balance Addition'
        ELSE 'Unknown'
    END as expected_type
FROM payments 
LIMIT 20;

-- 2. Fix group payments (payments with group_id should be 'group_payment')
-- First, check how many will be affected
SELECT COUNT(*) as payments_to_fix
FROM payments 
WHERE group_id IS NOT NULL 
AND payment_type != 'group_payment';

-- Then update them
UPDATE payments 
SET payment_type = 'group_payment' 
WHERE group_id IS NOT NULL 
AND payment_type != 'group_payment';

-- 3. Fix registration fee payments
-- First, check how many will be affected
SELECT COUNT(*) as registration_fees_to_fix
FROM payments 
WHERE group_id IS NULL 
AND notes ILIKE '%registration fee%'
AND payment_type != 'registration_fee';

-- Then update them
UPDATE payments 
SET payment_type = 'registration_fee' 
WHERE group_id IS NULL 
AND notes ILIKE '%registration fee%'
AND payment_type != 'registration_fee';

-- 4. Fix refund payments
UPDATE payments 
SET payment_type = 'balance_addition' 
WHERE group_id IS NULL 
AND notes ILIKE '%refund%'
AND payment_type != 'balance_addition';

-- 5. Fix debt payments
UPDATE payments 
SET payment_type = 'balance_addition' 
WHERE group_id IS NULL 
AND notes ILIKE '%debt%'
AND payment_type != 'balance_addition';

-- 6. Fix balance additions (remaining payments without group_id)
UPDATE payments 
SET payment_type = 'balance_addition' 
WHERE group_id IS NULL 
AND notes NOT ILIKE '%registration fee%'
AND notes NOT ILIKE '%refund%'
AND notes NOT ILIKE '%debt%'
AND payment_type != 'balance_addition';

-- 7. Verify the fixes
SELECT 
    payment_type,
    COUNT(*) as count
FROM payments 
GROUP BY payment_type
ORDER BY count DESC;

-- 7b. Summary of what was fixed
SELECT 
    'Total Payments' as description,
    COUNT(*) as count
FROM payments
UNION ALL
SELECT 
    'Group Payments (with group_id)' as description,
    COUNT(*) as count
FROM payments 
WHERE group_id IS NOT NULL
UNION ALL
SELECT 
    'Registration Fees' as description,
    COUNT(*) as count
FROM payments 
WHERE payment_type = 'registration_fee'
UNION ALL
SELECT 
    'Balance Additions' as description,
    COUNT(*) as count
FROM payments 
WHERE payment_type = 'balance_addition';

-- 8. Show sample of each payment type
SELECT 
    id,
    student_id,
    group_id,
    amount,
    payment_type,
    notes,
    created_at
FROM payments 
WHERE payment_type = 'group_payment'
LIMIT 5;

SELECT 
    id,
    student_id,
    group_id,
    amount,
    payment_type,
    notes,
    created_at
FROM payments 
WHERE payment_type = 'registration_fee'
LIMIT 5;

SELECT 
    id,
    student_id,
    group_id,
    amount,
    payment_type,
    notes,
    created_at
FROM payments 
WHERE payment_type = 'balance_addition'
LIMIT 5;
