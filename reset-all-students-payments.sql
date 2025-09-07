-- RESET ALL STUDENTS TO DEFAULT STATE
-- This script will reset all students to only have registration fee paid
-- Then the attendance-based system will calculate correct fees

-- Step 1: Show current payment summary before reset
SELECT 
    'BEFORE RESET - CURRENT PAYMENT SUMMARY' as summary_type,
    COUNT(DISTINCT student_id) as total_students,
    COUNT(*) as total_payments,
    SUM(amount) as total_payment_amount,
    COUNT(CASE WHEN payment_type = 'registration_fee' THEN 1 END) as registration_payments,
    COUNT(CASE WHEN payment_type NOT IN ('registration_fee', 'attendance_credit', 'balance_credit', 'refund') THEN 1 END) as group_payments,
    COUNT(CASE WHEN payment_type IN ('attendance_credit', 'balance_credit') THEN 1 END) as adjustment_payments
FROM payments;

-- Step 2: Show students who will be affected
SELECT 
    'STUDENTS TO BE RESET' as action_type,
    COUNT(DISTINCT sg.student_id) as total_students,
    COUNT(DISTINCT sg.group_id) as total_groups,
    SUM(g.price) as total_group_fees
FROM student_groups sg
JOIN groups g ON sg.group_id = g.id;

-- Step 3: Backup current payments (optional - for safety)
CREATE TABLE IF NOT EXISTS payments_backup AS 
SELECT *, CURRENT_TIMESTAMP as backup_date FROM payments;

-- Step 4: Delete all group payments and adjustments
-- Keep only registration fee payments
DELETE FROM payments 
WHERE payment_type NOT IN ('registration_fee')
OR (payment_type IS NULL AND notes NOT LIKE '%registration fee%');

-- Step 5: Verify what remains after deletion
SELECT 
    'AFTER RESET - REMAINING PAYMENTS' as summary_type,
    COUNT(DISTINCT student_id) as students_with_payments,
    COUNT(*) as total_payments,
    SUM(amount) as total_payment_amount,
    COUNT(CASE WHEN payment_type = 'registration_fee' THEN 1 END) as registration_payments
FROM payments;

-- Step 6: Show students who now need to pay group fees
WITH student_group_fees AS (
    SELECT 
        sg.student_id,
        s.name as student_name,
        sg.group_id,
        g.name as group_name,
        g.price as group_price,
        g.total_sessions,
        COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) as obligatory_sessions,
        COUNT(CASE WHEN a.status IN ('justified', 'new', 'change', 'stop') THEN 1 END) as free_sessions,
        ROUND(COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) * (g.price::DECIMAL / g.total_sessions::DECIMAL), 2) as correct_amount_owed
    FROM student_groups sg
    JOIN students s ON sg.student_id = s.id
    JOIN groups g ON sg.group_id = g.id
    LEFT JOIN sessions sess ON sg.group_id = sess.group_id
    LEFT JOIN attendance a ON sess.id = a.session_id AND sg.student_id = a.student_id
    GROUP BY sg.student_id, s.name, sg.group_id, g.name, g.price, g.total_sessions
)
SELECT 
    sgf.student_name,
    sgf.group_name,
    sgf.obligatory_sessions || '/' || sgf.total_sessions as sessions_breakdown,
    sgf.group_price as original_group_price,
    sgf.correct_amount_owed as amount_to_pay,
    sgf.free_sessions as free_sessions_count,
    ROUND(sgf.free_sessions * (sgf.group_price::DECIMAL / sgf.total_sessions::DECIMAL), 2) as free_amount
FROM student_group_fees sgf
WHERE sgf.correct_amount_owed > 0
ORDER BY sgf.student_name, sgf.group_name;

-- Step 7: Summary of what needs to be paid
WITH student_group_fees AS (
    SELECT 
        sg.student_id,
        sg.group_id,
        g.price as group_price,
        g.total_sessions,
        COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) as obligatory_sessions,
        ROUND(COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) * (g.price::DECIMAL / g.total_sessions::DECIMAL), 2) as correct_amount_owed
    FROM student_groups sg
    JOIN groups g ON sg.group_id = g.id
    LEFT JOIN sessions sess ON sg.group_id = sess.group_id
    LEFT JOIN attendance a ON sess.id = a.session_id AND sg.student_id = a.student_id
    GROUP BY sg.student_id, sg.group_id, g.price, g.total_sessions
)
SELECT 
    'PAYMENT SUMMARY AFTER RESET' as summary_type,
    COUNT(*) as total_group_enrollments,
    SUM(correct_amount_owed) as total_amount_to_pay,
    COUNT(DISTINCT student_id) as students_needing_payment,
    COUNT(DISTINCT group_id) as groups_with_payments_needed,
    ROUND(AVG(correct_amount_owed), 2) as avg_amount_per_group
FROM student_group_fees
WHERE correct_amount_owed > 0;

-- Step 8: Show students with justified/new/change sessions (who will pay less)
WITH student_group_fees AS (
    SELECT 
        sg.student_id,
        s.name as student_name,
        sg.group_id,
        g.name as group_name,
        g.price as group_price,
        g.total_sessions,
        COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) as obligatory_sessions,
        COUNT(CASE WHEN a.status IN ('justified', 'new', 'change', 'stop') THEN 1 END) as free_sessions,
        ROUND(COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) * (g.price::DECIMAL / g.total_sessions::DECIMAL), 2) as correct_amount_owed
    FROM student_groups sg
    JOIN students s ON sg.student_id = s.id
    JOIN groups g ON sg.group_id = g.id
    LEFT JOIN sessions sess ON sg.group_id = sess.group_id
    LEFT JOIN attendance a ON sess.id = a.session_id AND sg.student_id = a.student_id
    GROUP BY sg.student_id, s.name, sg.group_id, g.name, g.price, g.total_sessions
)
SELECT 
    'STUDENTS WITH FREE SESSIONS (PAY LESS)' as category,
    COUNT(*) as students_count,
    SUM(correct_amount_owed) as total_amount_to_pay,
    SUM(group_price - correct_amount_owed) as total_savings,
    ROUND(AVG(group_price - correct_amount_owed), 2) as avg_savings_per_student
FROM student_group_fees
WHERE free_sessions > 0 AND correct_amount_owed > 0;
