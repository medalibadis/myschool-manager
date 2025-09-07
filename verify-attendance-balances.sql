-- VERIFICATION SCRIPT: Check if attendance-based balance calculation is working correctly
-- This script will verify that existing students with justified/new/change sessions
-- have their balances calculated correctly based on attendance

-- Step 1: Find students with justified/new/change sessions and check their balances
WITH student_attendance_summary AS (
    SELECT 
        a.student_id,
        s.group_id,
        g.name as group_name,
        g.price as group_price,
        g.total_sessions,
        COUNT(*) as total_sessions_count,
        COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) as obligatory_sessions,
        COUNT(CASE WHEN a.status IN ('justified', 'new', 'change', 'stop') THEN 1 END) as free_sessions,
        ROUND((g.price::DECIMAL / g.total_sessions::DECIMAL), 2) as price_per_session
    FROM attendance a
    JOIN sessions s ON a.session_id = s.id
    JOIN groups g ON s.group_id = g.id
    WHERE a.status IN ('present', 'absent', 'too_late', 'justified', 'new', 'change', 'stop')
    GROUP BY a.student_id, s.group_id, g.name, g.price, g.total_sessions
),
student_payments AS (
    SELECT 
        student_id,
        group_id,
        SUM(CASE WHEN payment_type NOT IN ('attendance_credit', 'balance_credit', 'refund') THEN amount ELSE 0 END) as regular_payments,
        SUM(CASE WHEN payment_type IN ('attendance_credit', 'balance_credit') AND notes LIKE '%Attendance adjustment%' THEN amount ELSE 0 END) as attendance_adjustments
    FROM payments
    GROUP BY student_id, group_id
),
balance_calculation AS (
    SELECT 
        sas.student_id,
        sas.group_id,
        sas.group_name,
        sas.group_price,
        sas.obligatory_sessions,
        sas.free_sessions,
        sas.price_per_session,
        ROUND(sas.obligatory_sessions * sas.price_per_session, 2) as actual_fee_owed,
        COALESCE(sp.regular_payments, 0) as regular_payments,
        COALESCE(sp.attendance_adjustments, 0) as attendance_adjustments,
        COALESCE(sp.regular_payments, 0) + COALESCE(sp.attendance_adjustments, 0) as total_payments,
        ROUND(sas.obligatory_sessions * sas.price_per_session, 2) - (COALESCE(sp.regular_payments, 0) + COALESCE(sp.attendance_adjustments, 0)) as remaining_balance
    FROM student_attendance_summary sas
    LEFT JOIN student_payments sp ON sas.student_id = sp.student_id AND sas.group_id = sp.group_id
)
SELECT 
    bc.student_id,
    st.name as student_name,
    bc.group_name,
    bc.obligatory_sessions || '/' || (bc.obligatory_sessions + bc.free_sessions) as sessions_breakdown,
    bc.group_price as original_group_price,
    bc.actual_fee_owed as calculated_fee_owed,
    bc.regular_payments,
    bc.attendance_adjustments,
    bc.total_payments,
    bc.remaining_balance,
    CASE 
        WHEN bc.remaining_balance > 0 THEN 'STILL OWES'
        WHEN bc.remaining_balance < 0 THEN 'OVERPAID'
        ELSE 'PAID IN FULL'
    END as payment_status
FROM balance_calculation bc
JOIN students st ON bc.student_id = st.id
WHERE bc.free_sessions > 0  -- Only show students with justified/new/change sessions
ORDER BY bc.student_id, bc.group_id;

-- Step 2: Show examples of attendance adjustments created
SELECT 
    'ATTENDANCE ADJUSTMENTS CREATED' as summary_type,
    COUNT(*) as total_adjustments,
    SUM(amount) as total_adjustment_amount,
    COUNT(DISTINCT student_id) as students_affected,
    COUNT(DISTINCT group_id) as groups_affected
FROM payments 
WHERE payment_type IN ('attendance_credit', 'balance_credit')
AND notes LIKE '%Retroactive attendance adjustment%';

-- Step 3: Show detailed examples of adjustments
SELECT 
    p.student_id,
    s.name as student_name,
    p.group_id,
    g.name as group_name,
    p.amount as adjustment_amount,
    p.payment_type,
    p.notes,
    p.date as created_date
FROM payments p
JOIN students s ON p.student_id = s.id
JOIN groups g ON p.group_id = g.id
WHERE p.payment_type IN ('attendance_credit', 'balance_credit')
AND p.notes LIKE '%Retroactive attendance adjustment%'
ORDER BY p.date DESC, p.student_id
LIMIT 10;

-- Step 4: Check if any students still have incorrect balances
-- (This would show students who should have lower balances due to free sessions)
WITH expected_balances AS (
    SELECT 
        a.student_id,
        s.group_id,
        g.price as group_price,
        g.total_sessions,
        COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) as obligatory_sessions,
        COUNT(CASE WHEN a.status IN ('justified', 'new', 'change', 'stop') THEN 1 END) as free_sessions,
        ROUND((g.price::DECIMAL / g.total_sessions::DECIMAL) * COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END), 2) as expected_fee
    FROM attendance a
    JOIN sessions s ON a.session_id = s.id
    JOIN groups g ON s.group_id = g.id
    WHERE a.status IN ('present', 'absent', 'too_late', 'justified', 'new', 'change', 'stop')
    GROUP BY a.student_id, s.group_id, g.price, g.total_sessions
    HAVING COUNT(CASE WHEN a.status IN ('justified', 'new', 'change', 'stop') THEN 1 END) > 0
)
SELECT 
    'POTENTIAL ISSUES' as check_type,
    COUNT(*) as students_with_free_sessions,
    SUM(CASE WHEN eb.free_sessions > 0 THEN 1 ELSE 0 END) as students_with_justified_sessions
FROM expected_balances eb;
