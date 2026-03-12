-- Fix payment for student "bidou" (ID: 4ad9ca36-433c-4fd0-8c5d-d1ffc2306259)
-- The payment was created with wrong amount due to double discount bug
-- This script will:
-- 1. Check existing payments
-- 2. Delete incorrect payment and balance credit
-- 3. Create correct payment record

-- STEP 1: Check what payments exist
SELECT 
    '=== CURRENT PAYMENTS ===' as info;

SELECT 
    id,
    student_id,
    group_id,
    amount,
    original_amount,
    discount,
    payment_type,
    notes,
    date
FROM payments
WHERE student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259'
ORDER BY created_at DESC;

-- STEP 2: Delete incorrect payment and balance credit
-- (The payment was created with amount 4166.33 instead of 4999.8)
-- (And a balance credit of 833.47 was incorrectly created)
SELECT '=== DELETING INCORRECT PAYMENTS ===' as info;

DELETE FROM receipts
WHERE student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259'
  AND payment_id IN (
    SELECT id FROM payments
    WHERE student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259'
      AND (
        (group_id = 44 AND payment_type = 'group_payment' AND amount BETWEEN 4100 AND 4200)
        OR
        (payment_type = 'balance_addition' AND amount BETWEEN 830 AND 840)
      )
  );

DELETE FROM payments
WHERE student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259'
  AND (
    (group_id = 44 AND payment_type = 'group_payment' AND amount BETWEEN 4100 AND 4200)
    OR
    (payment_type = 'balance_addition' AND amount BETWEEN 830 AND 840)
  );

-- STEP 3: Create correct payment record
-- Group fee: 6000 DA
-- Discount: 16.67% → Discounted fee: 4999.8 DA
-- Student deposited: 4999.8 DA → Should pay full discounted amount
SELECT '=== CREATING CORRECT PAYMENT ===' as info;

INSERT INTO payments (
    student_id,
    group_id,
    amount,
    original_amount,
    discount,
    payment_type,
    notes,
    admin_name,
    date
)
VALUES (
    '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259',
    44,
    4999.8,  -- Correct discounted amount (already discounted, no double discount)
    6000,    -- Original group fee before discount
    16.67,   -- Discount percentage
    'group_payment',
    'Group fully paid - 16.67% discount already applied',
    'Dalila',
    CURRENT_DATE
)
RETURNING id, student_id, group_id, amount, original_amount, discount, payment_type, notes;

-- STEP 4: Create receipt for the payment
SELECT '=== CREATING RECEIPT ===' as info;

INSERT INTO receipts (
    student_id,
    student_name,
    payment_id,
    amount,
    payment_type,
    group_name,
    notes,
    created_at
)
SELECT 
    p.student_id,
    s.name,
    p.id,
    p.amount,
    p.payment_type,
    g.name,
    p.notes,
    CURRENT_TIMESTAMP
FROM payments p
JOIN students s ON s.id = p.student_id
JOIN groups g ON g.id = p.group_id
WHERE p.student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259'
  AND p.group_id = 44
  AND p.payment_type = 'group_payment'
  AND p.amount = 4999.8
ORDER BY p.created_at DESC
LIMIT 1
RETURNING id, student_id, payment_id, amount, payment_type, group_name, notes;

-- STEP 5: Verify the fix
SELECT 
    '=== VERIFICATION ===' as info;

SELECT 
    id,
    student_id,
    group_id,
    amount,
    original_amount,
    discount,
    payment_type,
    notes,
    date
FROM payments
WHERE student_id = '4ad9ca36-433c-4fd0-8c5d-d1ffc2306259'
ORDER BY created_at DESC;

