-- Reset payment data for existing students
-- This script will:
-- 1. Keep only registration fee payments (500 DA)
-- 2. Remove all group fee payments
-- 3. Ensure students start with clean group payment records

-- Step 1: First, let's see what payment data we currently have
SELECT 
    'Current Payment Summary' as info,
    COUNT(*) as total_payments,
    SUM(CASE WHEN payment_type = 'registration_fee' THEN 1 ELSE 0 END) as registration_payments,
    SUM(CASE WHEN payment_type = 'group_payment' THEN 1 ELSE 0 END) as group_payments,
    SUM(CASE WHEN payment_type = 'balance_addition' THEN 1 ELSE 0 END) as balance_additions
FROM payments;

-- Step 2: Delete all group payment records
-- This removes payments that were applied to specific groups
DELETE FROM payments 
WHERE payment_type = 'group_payment' 
   OR (payment_type IS NULL AND group_id IS NOT NULL);

-- Step 3: Delete balance additions that were used for group payments
-- These are typically deposits that were allocated to groups
DELETE FROM payments 
WHERE payment_type = 'balance_addition' 
   OR payment_type = 'attendance_credit'
   OR payment_type = 'balance_credit';

-- Step 4: Ensure all students have a registration fee payment of 500 DA
-- First, get all students who don't have a registration fee payment
WITH students_without_reg_fee AS (
    SELECT DISTINCT s.id as student_id, s.name as student_name
    FROM students s
    LEFT JOIN payments p ON s.id = p.student_id AND p.payment_type = 'registration_fee'
    WHERE p.id IS NULL
)
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT 
    student_id,
    NULL as group_id, -- Registration fee is not tied to a specific group
    500 as amount,
    NOW() as date,
    'Registration fee - Auto-generated' as notes,
    'registration_fee' as payment_type,
    'System Admin' as admin_name
FROM students_without_reg_fee;

-- Step 5: Update any existing registration fee payments to exactly 500 DA
-- In case some students have different amounts
UPDATE payments 
SET amount = 500,
    notes = COALESCE(notes, 'Registration fee - Corrected to 500 DA'),
    updated_at = NOW()
WHERE payment_type = 'registration_fee' AND amount != 500;

-- Step 6: Reset student balances to reflect only registration fee payments
-- This ensures the balance calculation starts fresh
UPDATE students 
SET total_paid = (
    SELECT COALESCE(SUM(amount), 0)
    FROM payments 
    WHERE student_id = students.id AND payment_type = 'registration_fee'
),
balance = (
    -- Calculate balance: Registration fee (500) + Group fees - Total paid
    -- Since group fees are not paid yet, balance = 500 - registration_fee_paid
    500 - (
        SELECT COALESCE(SUM(amount), 0)
        FROM payments 
        WHERE student_id = students.id AND payment_type = 'registration_fee'
    )
);

-- Step 7: Verify the results
SELECT 
    'After Reset - Payment Summary' as info,
    COUNT(*) as total_payments,
    SUM(CASE WHEN payment_type = 'registration_fee' THEN 1 ELSE 0 END) as registration_payments,
    SUM(CASE WHEN payment_type = 'group_payment' THEN 1 ELSE 0 END) as group_payments,
    SUM(CASE WHEN payment_type = 'balance_addition' THEN 1 ELSE 0 END) as balance_additions,
    SUM(amount) as total_amount
FROM payments;

-- Step 8: Show student balance summary
SELECT 
    'Student Balance Summary' as info,
    COUNT(*) as total_students,
    SUM(CASE WHEN total_paid = 500 THEN 1 ELSE 0 END) as students_with_reg_fee_only,
    SUM(CASE WHEN total_paid > 500 THEN 1 ELSE 0 END) as students_with_extra_payments,
    SUM(CASE WHEN total_paid < 500 THEN 1 ELSE 0 END) as students_with_partial_reg_fee,
    AVG(total_paid) as avg_total_paid,
    AVG(balance) as avg_balance
FROM students;

-- Step 9: Show sample of student data
SELECT 
    s.name,
    s.custom_id,
    s.total_paid,
    s.balance,
    COUNT(p.id) as payment_count,
    STRING_AGG(p.payment_type, ', ') as payment_types
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
GROUP BY s.id, s.name, s.custom_id, s.total_paid, s.balance
ORDER BY s.name
LIMIT 10;
