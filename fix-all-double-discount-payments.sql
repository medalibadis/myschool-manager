-- AUTOMATED FIX FOR ALL DOUBLE DISCOUNT PAYMENT ISSUES
-- This script automatically fixes all students affected by the double discount bug
-- Run the diagnostic script first to see what will be fixed

-- ========================================
-- STEP 1: DELETE INCORRECT BALANCE CREDITS
-- ========================================
DO $$
DECLARE
    credit_record RECORD;
    deleted_count INTEGER := 0;
BEGIN
    -- Delete receipts for balance credits
    FOR credit_record IN 
        SELECT p.id, p.student_id
        FROM payments p
        WHERE p.payment_type = 'balance_addition'
          AND EXISTS (
              SELECT 1 
              FROM payments p2
              JOIN student_groups sg ON sg.student_id = p2.student_id AND sg.group_id = p2.group_id
              WHERE p2.student_id = p.student_id
                AND p2.payment_type = 'group_payment'
                AND p2.group_id IS NOT NULL
                AND sg.group_discount > 0
                AND sg.group_discount < 100
                AND ABS(EXTRACT(EPOCH FROM (p2.date::timestamp - p.date::timestamp))) < 86400
          )
    LOOP
        DELETE FROM receipts WHERE payment_id = credit_record.id;
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Deleted receipts for % balance credits', deleted_count;
    
    -- Delete the balance credit payments
    deleted_count := 0;
    FOR credit_record IN 
        SELECT p.id, p.student_id
        FROM payments p
        WHERE p.payment_type = 'balance_addition'
          AND EXISTS (
              SELECT 1 
              FROM payments p2
              JOIN student_groups sg ON sg.student_id = p2.student_id AND sg.group_id = p2.group_id
              WHERE p2.student_id = p.student_id
                AND p2.payment_type = 'group_payment'
                AND p2.group_id IS NOT NULL
                AND sg.group_discount > 0
                AND sg.group_discount < 100
                AND ABS(EXTRACT(EPOCH FROM (p2.date::timestamp - p.date::timestamp))) < 86400
          )
    LOOP
        DELETE FROM payments WHERE id = credit_record.id;
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Deleted % balance credit payments', deleted_count;
END $$;

-- ========================================
-- STEP 2: FIX INCORRECT GROUP PAYMENTS
-- ========================================
DO $$
DECLARE
    payment_record RECORD;
    correct_amount NUMERIC;
    fixed_count INTEGER := 0;
BEGIN
    -- Fix group payments that have incorrect amounts due to double discounting
    FOR payment_record IN
        SELECT 
            p.id,
            p.student_id,
            p.group_id,
            p.amount as current_amount,
            g.price as group_price,
            COALESCE(sg.group_discount, 0) as group_discount,
            p.date as payment_date
        FROM payments p
        JOIN groups g ON g.id = p.group_id
        LEFT JOIN student_groups sg ON sg.student_id = p.student_id AND sg.group_id = p.group_id
        WHERE p.payment_type = 'group_payment'
          AND p.group_id IS NOT NULL
          AND COALESCE(sg.group_discount, 0) > 0
          AND COALESCE(sg.group_discount, 0) < 100
          AND ABS(p.amount - ROUND((g.price * (1 - COALESCE(sg.group_discount, 0) / 100))::numeric, 2)) > 10
    LOOP
        -- Calculate correct amount (already discounted)
        correct_amount := ROUND((payment_record.group_price * (1 - payment_record.group_discount / 100))::numeric, 2);
        
        -- Delete old receipt
        DELETE FROM receipts WHERE payment_id = payment_record.id;
        
        -- Update payment with correct amount
        UPDATE payments
        SET 
            amount = correct_amount,
            original_amount = payment_record.group_price,
            discount = payment_record.group_discount,
            notes = 'Group fully paid - ' || payment_record.group_discount || '% discount already applied (fixed)'
        WHERE id = payment_record.id;
        
        -- Create new receipt
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
        WHERE p.id = payment_record.id;
        
        fixed_count := fixed_count + 1;
        
        RAISE NOTICE 'Fixed payment % for student %, group %: % -> %', 
            payment_record.id, 
            payment_record.student_id, 
            payment_record.group_id,
            payment_record.current_amount,
            correct_amount;
    END LOOP;
    
    RAISE NOTICE 'Fixed % group payments', fixed_count;
END $$;

-- ========================================
-- STEP 3: VERIFICATION REPORT
-- ========================================
SELECT '=== VERIFICATION: CHECKING FIXED PAYMENTS ===' as info;

SELECT 
    s.name as student_name,
    g.name as group_name,
    g.price as group_price,
    sg.group_discount,
    p.amount as payment_amount,
    ROUND((g.price * (1 - COALESCE(sg.group_discount, 0) / 100))::numeric, 2) as expected_amount,
    CASE 
        WHEN ABS(p.amount - ROUND((g.price * (1 - COALESCE(sg.group_discount, 0) / 100))::numeric, 2)) < 1 THEN '✅ CORRECT'
        ELSE '❌ STILL INCORRECT'
    END as status
FROM payments p
JOIN students s ON s.id = p.student_id
JOIN groups g ON g.id = p.group_id
LEFT JOIN student_groups sg ON sg.student_id = p.student_id AND sg.group_id = p.group_id
WHERE p.payment_type = 'group_payment'
  AND p.group_id IS NOT NULL
  AND COALESCE(sg.group_discount, 0) > 0
ORDER BY s.name, g.name;

-- ========================================
-- STEP 4: SUMMARY OF REMAINING BALANCE CREDITS
-- ========================================
SELECT '=== SUMMARY: REMAINING BALANCE CREDITS ===' as info;

SELECT 
    s.name as student_name,
    COUNT(*) as balance_credit_count,
    SUM(p.amount) as total_balance_credits
FROM payments p
JOIN students s ON s.id = p.student_id
WHERE p.payment_type = 'balance_addition'
GROUP BY s.name
HAVING COUNT(*) > 0
ORDER BY s.name;

