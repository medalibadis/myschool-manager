-- FIND AND FIX ALL STUDENTS AFFECTED BY DOUBLE DISCOUNT BUG
-- This script identifies students with incorrect payments due to the double discount bug
-- and provides options to fix them

-- ========================================
-- STEP 1: IDENTIFY POTENTIALLY AFFECTED STUDENTS
-- ========================================
SELECT '=== STEP 1: FINDING POTENTIALLY AFFECTED STUDENTS ===' as info;

-- Find students with group payments that have discounts AND balance credits
-- This pattern suggests double discounting occurred
WITH student_payment_summary AS (
    SELECT 
        p.student_id,
        s.name as student_name,
        p.group_id,
        g.name as group_name,
        g.price as group_price,
        sg.group_discount,
        COUNT(CASE WHEN p.payment_type = 'group_payment' AND p.group_id IS NOT NULL THEN 1 END) as group_payment_count,
        SUM(CASE WHEN p.payment_type = 'group_payment' AND p.group_id IS NOT NULL THEN p.amount ELSE 0 END) as total_group_paid,
        SUM(CASE WHEN p.payment_type = 'balance_addition' THEN p.amount ELSE 0 END) as total_balance_credits,
        MAX(CASE WHEN p.payment_type = 'group_payment' AND p.group_id IS NOT NULL THEN p.discount ELSE 0 END) as payment_discount
    FROM payments p
    JOIN students s ON s.id = p.student_id
    LEFT JOIN groups g ON g.id = p.group_id
    LEFT JOIN student_groups sg ON sg.student_id = p.student_id AND sg.group_id = p.group_id
    WHERE p.payment_type IN ('group_payment', 'balance_addition')
      AND p.group_id IS NOT NULL
    GROUP BY p.student_id, s.name, p.group_id, g.name, g.price, sg.group_discount
    HAVING COUNT(CASE WHEN p.payment_type = 'group_payment' AND p.group_id IS NOT NULL THEN 1 END) > 0
)
SELECT 
    student_id,
    student_name,
    group_id,
    group_name,
    group_price,
    group_discount,
    group_payment_count,
    total_group_paid,
    total_balance_credits,
    payment_discount,
    -- Calculate expected payment amount
    CASE 
        WHEN group_discount > 0 AND group_discount < 100 THEN
            ROUND((group_price * (1 - group_discount / 100))::numeric, 2)
        ELSE group_price
    END as expected_discounted_fee,
    -- Flag if there's a mismatch
    CASE 
        WHEN group_discount > 0 AND group_discount < 100 THEN
            ABS(total_group_paid - ROUND((group_price * (1 - group_discount / 100))::numeric, 2)) > 10
        ELSE
            ABS(total_group_paid - group_price) > 10
    END as needs_fix
FROM student_payment_summary
WHERE total_balance_credits > 0  -- Has balance credits (suspicious)
   OR (group_discount > 0 AND ABS(total_group_paid - ROUND((group_price * (1 - group_discount / 100))::numeric, 2)) > 10)  -- Payment doesn't match expected
ORDER BY student_name, group_id;

-- ========================================
-- STEP 2: DETAILED PAYMENT ANALYSIS FOR EACH AFFECTED STUDENT
-- ========================================
SELECT '=== STEP 2: DETAILED PAYMENT BREAKDOWN ===' as info;

-- Show detailed payment records for students with potential issues
SELECT 
    p.id as payment_id,
    s.name as student_name,
    p.student_id,
    p.group_id,
    g.name as group_name,
    g.price as group_price,
    sg.group_discount,
    p.amount as payment_amount,
    p.original_amount,
    p.discount as payment_discount,
    p.payment_type,
    p.notes,
    p.date as payment_date,
    -- Calculate what the payment SHOULD be
    CASE 
        WHEN sg.group_discount > 0 AND sg.group_discount < 100 THEN
            ROUND((g.price * (1 - sg.group_discount / 100))::numeric, 2)
        ELSE g.price
    END as expected_payment_amount,
    -- Flag if payment is incorrect
    CASE 
        WHEN p.payment_type = 'group_payment' AND sg.group_discount > 0 AND sg.group_discount < 100 THEN
            ABS(p.amount - ROUND((g.price * (1 - sg.group_discount / 100))::numeric, 2)) > 10
        WHEN p.payment_type = 'group_payment' THEN
            ABS(p.amount - g.price) > 10
        ELSE false
    END as is_incorrect
FROM payments p
JOIN students s ON s.id = p.student_id
LEFT JOIN groups g ON g.id = p.group_id
LEFT JOIN student_groups sg ON sg.student_id = p.student_id AND sg.group_id = p.group_id
WHERE p.payment_type IN ('group_payment', 'balance_addition')
  AND p.group_id IS NOT NULL
  AND EXISTS (
      -- Only show students who have balance credits or suspicious payments
      SELECT 1 
      FROM payments p2 
      WHERE p2.student_id = p.student_id 
        AND (
            (p2.payment_type = 'balance_addition' AND p2.amount > 0)
            OR (p2.payment_type = 'group_payment' AND p2.group_id = p.group_id AND p2.discount > 0)
        )
  )
ORDER BY s.name, p.group_id, p.date DESC;

-- ========================================
-- STEP 3: GENERATE FIX SCRIPT FOR EACH AFFECTED STUDENT
-- ========================================
SELECT '=== STEP 3: GENERATE FIX COMMANDS ===' as info;

-- This query generates DELETE and INSERT statements for fixing each student
SELECT 
    '-- Fix for student: ' || s.name || ' (ID: ' || p.student_id || '), Group: ' || g.name || ' (ID: ' || p.group_id || ')' as fix_script,
    'DELETE FROM receipts WHERE payment_id = ''' || p.id || ''';' as delete_receipt,
    'DELETE FROM payments WHERE id = ''' || p.id || ''';' as delete_payment,
    'INSERT INTO payments (student_id, group_id, amount, original_amount, discount, payment_type, notes, admin_name, date) VALUES (' ||
        '''' || p.student_id || ''', ' ||
        p.group_id || ', ' ||
        CASE 
            WHEN sg.group_discount > 0 AND sg.group_discount < 100 THEN
                ROUND((g.price * (1 - sg.group_discount / 100))::numeric, 2)
            ELSE g.price
        END || ', ' ||
        g.price || ', ' ||
        COALESCE(sg.group_discount, 0) || ', ' ||
        '''group_payment'', ' ||
        '''Group fully paid - ' || COALESCE(sg.group_discount, 0) || '% discount already applied'', ' ||
        '''Dalila'', ' ||
        'CURRENT_DATE);' as insert_correct_payment
FROM payments p
JOIN students s ON s.id = p.student_id
LEFT JOIN groups g ON g.id = p.group_id
LEFT JOIN student_groups sg ON sg.student_id = p.student_id AND sg.group_id = p.group_id
WHERE p.payment_type = 'group_payment'
  AND p.group_id IS NOT NULL
  AND sg.group_discount > 0
  AND sg.group_discount < 100
  AND ABS(p.amount - ROUND((g.price * (1 - sg.group_discount / 100))::numeric, 2)) > 10  -- Payment is significantly off
ORDER BY s.name, p.group_id;

-- ========================================
-- STEP 4: DELETE ALL BALANCE CREDITS THAT WERE CREATED DUE TO DOUBLE DISCOUNT
-- ========================================
SELECT '=== STEP 4: DELETE INCORRECT BALANCE CREDITS ===' as info;

-- Find balance credits that were likely created due to double discount bug
-- These are balance_addition payments that exist alongside group payments with discounts
SELECT 
    'DELETE FROM receipts WHERE payment_id = ''' || p.id || ''';' as delete_receipt,
    'DELETE FROM payments WHERE id = ''' || p.id || ''';' as delete_payment,
    s.name as student_name,
    p.amount as credit_amount,
    p.date as credit_date
FROM payments p
JOIN students s ON s.id = p.student_id
WHERE p.payment_type = 'balance_addition'
  AND EXISTS (
      -- Only delete credits that exist alongside group payments with discounts
      SELECT 1 
      FROM payments p2
      JOIN student_groups sg ON sg.student_id = p2.student_id AND sg.group_id = p2.group_id
      WHERE p2.student_id = p.student_id
        AND p2.payment_type = 'group_payment'
        AND p2.group_id IS NOT NULL
        AND sg.group_discount > 0
        AND sg.group_discount < 100
        AND ABS(EXTRACT(EPOCH FROM (p2.date::timestamp - p.date::timestamp))) < 86400  -- Created within 24 hours
  )
ORDER BY s.name, p.date DESC;

