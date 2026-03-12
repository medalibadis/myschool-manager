-- FIX IDENTIFIED DOUBLE DISCOUNT ISSUES
-- This script fixes the 4 students identified with incorrect balance credits

-- ========================================
-- STEP 1: DELETE INCORRECT BALANCE CREDITS
-- ========================================
SELECT '=== DELETING INCORRECT BALANCE CREDITS ===' as info;

-- Delete receipts for balance credits
DELETE FROM receipts WHERE payment_id IN (
    '3b79e7fe-70b3-4a74-a21f-c87cc6cdfa04',  -- اميمة شتحونة
    '10d99baa-a4ab-4f90-9415-cf9de55bd88f',  -- مارية  تجاني
    '49a939ef-a89b-40be-a205-2a3eac85d4a1',  -- محمد جود سعيد
    'f2bbdc8c-94e3-4304-acfe-47cb7be5bd54'   -- مروان  بحري
);

-- Delete the balance credit payments
DELETE FROM payments WHERE id IN (
    '3b79e7fe-70b3-4a74-a21f-c87cc6cdfa04',  -- اميمة شتحونة
    '10d99baa-a4ab-4f90-9415-cf9de55bd88f',  -- مارية  تجاني
    '49a939ef-a89b-40be-a205-2a3eac85d4a1',  -- محمد جود سعيد
    'f2bbdc8c-94e3-4304-acfe-47cb7be5bd54'   -- مروان  بحري
);

SELECT '✅ Deleted 4 incorrect balance credits' as result;

-- ========================================
-- STEP 2: CHECK FOR INCORRECT GROUP PAYMENTS FOR THESE STUDENTS
-- ========================================
SELECT '=== CHECKING FOR INCORRECT GROUP PAYMENTS ===' as info;

-- Find the student IDs for these students
WITH affected_students AS (
    SELECT DISTINCT p.student_id
    FROM payments p
    WHERE p.id IN (
        '3b79e7fe-70b3-4a74-a21f-c87cc6cdfa04',
        '10d99baa-a4ab-4f90-9415-cf9de55bd88f',
        '49a939ef-a89b-40be-a205-2a3eac85d4a1',
        'f2bbdc8c-94e3-4304-acfe-47cb7be5bd54'
    )
)
SELECT 
    s.name as student_name,
    p.student_id,
    p.group_id,
    g.name as group_name,
    g.price as group_price,
    COALESCE(sg.group_discount, 0) as group_discount,
    p.id as payment_id,
    p.amount as current_payment_amount,
    p.original_amount,
    p.discount as payment_discount,
    ROUND((g.price * (1 - COALESCE(sg.group_discount, 0) / 100))::numeric, 2) as expected_payment_amount,
    ABS(p.amount - ROUND((g.price * (1 - COALESCE(sg.group_discount, 0) / 100))::numeric, 2)) as difference,
    CASE 
        WHEN ABS(p.amount - ROUND((g.price * (1 - COALESCE(sg.group_discount, 0) / 100))::numeric, 2)) > 10 THEN '❌ NEEDS FIX'
        ELSE '✅ CORRECT'
    END as status
FROM payments p
JOIN affected_students a ON a.student_id = p.student_id
JOIN students s ON s.id = p.student_id
JOIN groups g ON g.id = p.group_id
LEFT JOIN student_groups sg ON sg.student_id = p.student_id AND sg.group_id = p.group_id
WHERE p.payment_type = 'group_payment'
  AND p.group_id IS NOT NULL
ORDER BY s.name, p.group_id;

-- ========================================
-- STEP 3: FIX INCORRECT GROUP PAYMENTS (if any found)
-- ========================================
SELECT '=== FIXING INCORRECT GROUP PAYMENTS ===' as info;

DO $$
DECLARE
    payment_record RECORD;
    correct_amount NUMERIC;
    fixed_count INTEGER := 0;
BEGIN
    -- Fix group payments for the affected students
    FOR payment_record IN
        WITH affected_students AS (
            SELECT DISTINCT p.student_id
            FROM payments p
            WHERE p.id IN (
                '3b79e7fe-70b3-4a74-a21f-c87cc6cdfa04',
                '10d99baa-a4ab-4f90-9415-cf9de55bd88f',
                '49a939ef-a89b-40be-a205-2a3eac85d4a1',
                'f2bbdc8c-94e3-4304-acfe-47cb7be5bd54'
            )
        )
        SELECT 
            p.id,
            p.student_id,
            p.group_id,
            p.amount as current_amount,
            g.price as group_price,
            COALESCE(sg.group_discount, 0) as group_discount
        FROM payments p
        JOIN affected_students a ON a.student_id = p.student_id
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
    
    IF fixed_count > 0 THEN
        RAISE NOTICE 'Fixed % group payments', fixed_count;
    ELSE
        RAISE NOTICE 'No group payments needed fixing';
    END IF;
END $$;

-- ========================================
-- STEP 4: VERIFICATION
-- ========================================
SELECT '=== VERIFICATION: CHECKING FIXED STUDENTS ===' as info;

WITH affected_students AS (
    SELECT DISTINCT p.student_id
    FROM payments p
    WHERE p.id IN (
        '3b79e7fe-70b3-4a74-a21f-c87cc6cdfa04',
        '10d99baa-a4ab-4f90-9415-cf9de55bd88f',
        '49a939ef-a89b-40be-a205-2a3eac85d4a1',
        'f2bbdc8c-94e3-4304-acfe-47cb7be5bd54'
    )
)
SELECT 
    s.name as student_name,
    g.name as group_name,
    g.price as group_price,
    COALESCE(sg.group_discount, 0) as discount,
    p.amount as payment_amount,
    ROUND((g.price * (1 - COALESCE(sg.group_discount, 0) / 100))::numeric, 2) as expected_amount,
    CASE 
        WHEN ABS(p.amount - ROUND((g.price * (1 - COALESCE(sg.group_discount, 0) / 100))::numeric, 2)) < 1 THEN '✅ CORRECT'
        ELSE '❌ STILL INCORRECT'
    END as status
FROM payments p
JOIN affected_students a ON a.student_id = p.student_id
JOIN students s ON s.id = p.student_id
JOIN groups g ON g.id = p.group_id
LEFT JOIN student_groups sg ON sg.student_id = p.student_id AND sg.group_id = p.group_id
WHERE p.payment_type = 'group_payment'
  AND p.group_id IS NOT NULL
ORDER BY s.name, g.name;

-- Check if balance credits still exist
SELECT 
    '=== CHECKING FOR REMAINING BALANCE CREDITS ===' as info;

WITH affected_students AS (
    SELECT DISTINCT p.student_id
    FROM payments p
    WHERE p.id IN (
        '3b79e7fe-70b3-4a74-a21f-c87cc6cdfa04',
        '10d99baa-a4ab-4f90-9415-cf9de55bd88f',
        '49a939ef-a89b-40be-a205-2a3eac85d4a1',
        'f2bbdc8c-94e3-4304-acfe-47cb7be5bd54'
    )
)
SELECT 
    s.name as student_name,
    COUNT(*) as remaining_balance_credits,
    SUM(p.amount) as total_balance_credits
FROM payments p
JOIN affected_students a ON a.student_id = p.student_id
JOIN students s ON s.id = p.student_id
WHERE p.payment_type = 'balance_addition'
GROUP BY s.name
HAVING COUNT(*) > 0
ORDER BY s.name;

