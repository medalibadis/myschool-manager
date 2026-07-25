-- =====================================================
-- MARK COURSE FEES AS PAID FOR STUDENTS IN SPECIFIED GROUPS
-- Groups: 2897, 2898, 2899, 2900, 2901, 2902, 2903, 2905,
--         2906, 2907, 2909, 2913, 2914, 2915, 2916, 2917,
--         2918, 2919, 2920
-- 
-- This script:
-- 1. Finds all students enrolled in these groups via student_groups
-- 2. Gets each group's price (course fee)
-- 3. Applies student's group_discount if any
-- 4. Inserts a 'group_payment' record for the full discounted amount
-- 5. Skips students who already have a group_payment for that group
-- =====================================================

-- =====================================================
-- STEP 1: PREVIEW - See what will be inserted (RUN THIS FIRST)
-- =====================================================
SELECT 
    g.id as group_id,
    g.name as group_name,
    g.price as group_fee,
    s.name as student_name,
    s.custom_id,
    sg.status as enrollment_status,
    COALESCE(sg.group_discount, s.default_discount, 0) as discount_pct,
    CASE 
        WHEN COALESCE(sg.group_discount, s.default_discount, 0) > 0 
        THEN g.price * (1 - COALESCE(sg.group_discount, s.default_discount, 0) / 100.0)
        ELSE g.price
    END as amount_to_pay,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM payments p 
            WHERE p.student_id = s.id 
              AND p.group_id = g.id 
              AND p.payment_type = 'group_payment'
        ) THEN '⚠️ ALREADY PAID - WILL SKIP'
        ELSE '✅ WILL CREATE PAYMENT'
    END as action
FROM student_groups sg
JOIN students s ON s.id = sg.student_id
JOIN groups g ON g.id = sg.group_id
WHERE sg.group_id IN (
    2897, 2898, 2899, 2900, 2901, 2902, 2903, 2905,
    2906, 2907, 2909, 2913, 2914, 2915, 2916, 2917,
    2918, 2919, 2920
)
ORDER BY g.id, s.name;

-- =====================================================
-- STEP 2: INSERT COURSE PAYMENTS
-- (Uncomment and run after verifying the preview above)
-- =====================================================

-- INSERT INTO payments (student_id, group_id, amount, original_amount, discount, date, notes, payment_type, admin_name)
-- SELECT 
--     sg.student_id,
--     sg.group_id,
--     -- Amount after discount
--     CASE 
--         WHEN COALESCE(sg.group_discount, s.default_discount, 0) > 0 
--         THEN g.price * (1 - COALESCE(sg.group_discount, s.default_discount, 0) / 100.0)
--         ELSE g.price
--     END as amount,
--     -- Original amount (full group price before discount)
--     g.price as original_amount,
--     -- Discount percentage
--     COALESCE(sg.group_discount, s.default_discount, 0) as discount,
--     -- Payment date = today
--     CURRENT_DATE as date,
--     -- Notes
--     CONCAT('Group fully paid - ', g.name, 
--            CASE 
--                WHEN COALESCE(sg.group_discount, s.default_discount, 0) > 0 
--                THEN CONCAT(' - ', COALESCE(sg.group_discount, s.default_discount, 0), '% discount applied')
--                ELSE ''
--            END
--     ) as notes,
--     'group_payment' as payment_type,
--     'Dalila' as admin_name
-- FROM student_groups sg
-- JOIN students s ON s.id = sg.student_id
-- JOIN groups g ON g.id = sg.group_id
-- WHERE sg.group_id IN (
--     2897, 2898, 2899, 2900, 2901, 2902, 2903, 2905,
--     2906, 2907, 2909, 2913, 2914, 2915, 2916, 2917,
--     2918, 2919, 2920
-- )
-- -- Skip students who already have a group_payment for this group
-- AND NOT EXISTS (
--     SELECT 1 FROM payments p 
--     WHERE p.student_id = sg.student_id 
--       AND p.group_id = sg.group_id 
--       AND p.payment_type = 'group_payment'
-- );

-- =====================================================
-- STEP 3: VERIFICATION (run after Step 2)
-- =====================================================

-- -- Summary per group
-- SELECT 
--     g.id as group_id,
--     g.name as group_name,
--     g.price as group_fee,
--     COUNT(p.id) as students_paid,
--     SUM(p.amount) as total_collected,
--     (SELECT COUNT(*) FROM student_groups sg2 WHERE sg2.group_id = g.id) as total_enrolled
-- FROM groups g
-- LEFT JOIN payments p ON p.group_id = g.id AND p.payment_type = 'group_payment'
-- WHERE g.id IN (
--     2897, 2898, 2899, 2900, 2901, 2902, 2903, 2905,
--     2906, 2907, 2909, 2913, 2914, 2915, 2916, 2917,
--     2918, 2919, 2920
-- )
-- GROUP BY g.id, g.name, g.price
-- ORDER BY g.id;

-- -- Grand total
-- SELECT 
--     '💰 GRAND TOTAL' as label,
--     COUNT(DISTINCT p.student_id) as unique_students_paid,
--     COUNT(p.id) as total_payments_created,
--     SUM(p.amount) as total_amount_collected
-- FROM payments p
-- WHERE p.group_id IN (
--     2897, 2898, 2899, 2900, 2901, 2902, 2903, 2905,
--     2906, 2907, 2909, 2913, 2914, 2915, 2916, 2917,
--     2918, 2919, 2920
-- )
-- AND p.payment_type = 'group_payment';
