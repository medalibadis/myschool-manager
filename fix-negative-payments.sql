-- Fix existing negative payment records that are causing double registration fees
-- This script removes incorrect negative payment records

-- Remove negative registration fee payments (these create the 1000 instead of 500 issue)
DELETE FROM payments 
WHERE payment_type = 'registration_fee' 
AND amount < 0;

-- Remove negative group fee payments (these might cause similar issues with group fees)
DELETE FROM payments 
WHERE payment_type = 'group_fee' 
AND amount < 0;

-- Show remaining payments for verification
SELECT 
    payment_type, 
    COUNT(*) as count, 
    SUM(amount) as total_amount,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount
FROM payments 
GROUP BY payment_type
ORDER BY payment_type;
