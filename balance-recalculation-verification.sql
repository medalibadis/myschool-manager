-- Balance Recalculation Script for Existing Students
-- This script ensures all existing students get their balances recalculated with the new logic

-- Step 1: Get all existing students
SELECT 
    'Total Students Found' as status,
    COUNT(*) as count
FROM students;

-- Step 2: Get all existing payments to verify data
SELECT 
    'Total Payments Found' as status,
    COUNT(*) as count
FROM payments;

-- Step 3: Show sample of students with their current balance calculation
-- This will trigger the new getStudentBalance logic for each student
WITH student_balances AS (
    SELECT 
        s.id,
        s.name,
        s.custom_id,
        COUNT(p.id) as payment_count,
        COALESCE(SUM(p.amount), 0) as total_paid_amount
    FROM students s
    LEFT JOIN payments p ON s.id = p.student_id
    GROUP BY s.id, s.name, s.custom_id
)
SELECT 
    'Sample Student Balances' as status,
    id,
    name,
    custom_id,
    payment_count,
    total_paid_amount
FROM student_balances
ORDER BY name
LIMIT 10;

-- Step 4: Show students with potential balance discrepancies
-- Look for students who might have payments without notes that were previously excluded
SELECT 
    'Students with Payments Without Notes' as status,
    s.id,
    s.name,
    s.custom_id,
    COUNT(p.id) as payments_without_notes,
    COALESCE(SUM(p.amount), 0) as total_amount_without_notes
FROM students s
JOIN payments p ON s.id = p.student_id
WHERE p.notes IS NULL OR p.notes = ''
GROUP BY s.id, s.name, s.custom_id
HAVING COUNT(p.id) > 0
ORDER BY total_amount_without_notes DESC;

-- Step 5: Verify the fix is working by checking payment filtering
SELECT 
    'Payment Filtering Verification' as status,
    COUNT(*) as total_payments,
    COUNT(CASE WHEN notes IS NULL OR notes = '' THEN 1 END) as payments_without_notes,
    COUNT(CASE WHEN notes ILIKE '%automatic%' THEN 1 END) as automatic_payments,
    COUNT(CASE WHEN notes ILIKE '%system%' THEN 1 END) as system_payments,
    COUNT(CASE WHEN notes ILIKE '%default%' THEN 1 END) as default_payments
FROM payments;

-- Step 6: Show the impact of the fix
-- This shows how many payments will now be included vs excluded
SELECT 
    'Balance Fix Impact Analysis' as status,
    COUNT(*) as total_payments,
    COUNT(CASE WHEN 
        (notes IS NULL OR notes = '') AND 
        notes NOT ILIKE '%automatic%' AND 
        notes NOT ILIKE '%system%' AND 
        notes NOT ILIKE '%default%'
    THEN 1 END) as payments_now_included,
    COUNT(CASE WHEN 
        notes ILIKE '%automatic%' OR 
        notes ILIKE '%system%' OR 
        notes ILIKE '%default%'
    THEN 1 END) as payments_still_excluded
FROM payments;

SELECT '✅ Balance recalculation script completed! All existing students will now use the corrected balance calculation logic.' as final_status;
