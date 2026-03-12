-- Check all payments for student "bidou" (ID: 4ad9ca36-433c-4fd0-8c5d-d1ffc2306259)
-- This will help diagnose why the group payment isn't being recognized

SELECT 
    id,
    student_id,
    group_id,
    amount,
    original_amount,
    discount,
    payment_type,
    notes,
    admin_name,
    date,
    created_at
FROM payments
WHERE student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259'
ORDER BY created_at DESC;

-- Also check the student_groups record to see the discount
SELECT 
    student_id,
    group_id,
    group_discount,
    status
FROM student_groups
WHERE student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259';

