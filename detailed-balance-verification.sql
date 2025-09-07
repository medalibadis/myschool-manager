-- DETAILED VERIFICATION: Show specific examples of students with attendance-based balances
-- This will show how the attendance adjustments are working for existing students

-- Show detailed balance analysis for students with justified/new/change sessions
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
ORDER BY bc.remaining_balance DESC, bc.student_id
LIMIT 20;  -- Show first 20 examples

-- Show summary statistics
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
    'SUMMARY STATISTICS' as summary_type,
    COUNT(*) as total_students_with_free_sessions,
    SUM(bc.free_sessions) as total_free_sessions,
    SUM(bc.obligatory_sessions) as total_obligatory_sessions,
    ROUND(AVG(bc.group_price - bc.actual_fee_owed), 2) as avg_savings_per_student,
    SUM(bc.group_price - bc.actual_fee_owed) as total_savings_all_students,
    COUNT(CASE WHEN bc.remaining_balance <= 0 THEN 1 END) as students_fully_paid,
    COUNT(CASE WHEN bc.remaining_balance > 0 THEN 1 END) as students_still_owing
FROM balance_calculation bc
WHERE bc.free_sessions > 0;
