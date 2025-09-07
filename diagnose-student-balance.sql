-- DIAGNOSTIC SCRIPT: Check specific student balance calculation
-- Replace 'STUDENT_ID_HERE' with the actual student ID

-- Step 1: Find the student with the issue
SELECT 
    s.id as student_id,
    s.name as student_name,
    sg.group_id,
    g.name as group_name,
    g.price as group_price,
    g.total_sessions
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
JOIN groups g ON sg.group_id = g.id
WHERE s.name LIKE '%STUDENT_NAME_HERE%'  -- Replace with actual student name
OR s.id = 'STUDENT_ID_HERE';  -- Replace with actual student ID

-- Step 2: Check attendance for this student
WITH student_info AS (
    SELECT 
        s.id as student_id,
        s.name as student_name,
        sg.group_id,
        g.name as group_name,
        g.price as group_price,
        g.total_sessions
    FROM students s
    JOIN student_groups sg ON s.id = sg.student_id
    JOIN groups g ON sg.group_id = g.id
    WHERE s.name LIKE '%STUDENT_NAME_HERE%'  -- Replace with actual student name
    OR s.id = 'STUDENT_ID_HERE'  -- Replace with actual student ID
)
SELECT 
    si.student_name,
    si.group_name,
    si.group_price,
    si.total_sessions,
    COUNT(*) as total_attendance_records,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_sessions,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_sessions,
    COUNT(CASE WHEN a.status = 'justified' THEN 1 END) as justified_sessions,
    COUNT(CASE WHEN a.status = 'default' THEN 1 END) as default_sessions,
    COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) as obligatory_sessions,
    COUNT(CASE WHEN a.status IN ('justified', 'new', 'change', 'stop') THEN 1 END) as free_sessions,
    ROUND((si.group_price::DECIMAL / si.total_sessions::DECIMAL), 2) as price_per_session,
    ROUND(COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) * (si.group_price::DECIMAL / si.total_sessions::DECIMAL), 2) as correct_amount_owed
FROM student_info si
LEFT JOIN sessions sess ON si.group_id = sess.group_id
LEFT JOIN attendance a ON sess.id = a.session_id AND si.student_id = a.student_id
GROUP BY si.student_id, si.student_name, si.group_id, si.group_name, si.group_price, si.total_sessions;

-- Step 3: Check payments for this student
WITH student_info AS (
    SELECT 
        s.id as student_id,
        s.name as student_name,
        sg.group_id,
        g.name as group_name,
        g.price as group_price,
        g.total_sessions
    FROM students s
    JOIN student_groups sg ON s.id = sg.student_id
    JOIN groups g ON sg.group_id = g.id
    WHERE s.name LIKE '%STUDENT_NAME_HERE%'  -- Replace with actual student name
    OR s.id = 'STUDENT_ID_HERE'  -- Replace with actual student ID
)
SELECT 
    si.student_name,
    si.group_name,
    p.amount,
    p.payment_type,
    p.notes,
    p.date,
    p.admin_name
FROM student_info si
LEFT JOIN payments p ON si.student_id = p.student_id AND si.group_id = p.group_id
ORDER BY p.date DESC;

-- Step 4: Calculate what the balance should be
WITH student_info AS (
    SELECT 
        s.id as student_id,
        s.name as student_name,
        sg.group_id,
        g.name as group_name,
        g.price as group_price,
        g.total_sessions
    FROM students s
    JOIN student_groups sg ON s.id = sg.student_id
    JOIN groups g ON sg.group_id = g.id
    WHERE s.name LIKE '%STUDENT_NAME_HERE%'  -- Replace with actual student name
    OR s.id = 'STUDENT_ID_HERE'  -- Replace with actual student ID
),
attendance_summary AS (
    SELECT 
        si.student_id,
        si.group_id,
        COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) as obligatory_sessions,
        ROUND(COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) * (si.group_price::DECIMAL / si.total_sessions::DECIMAL), 2) as correct_amount_owed
    FROM student_info si
    LEFT JOIN sessions sess ON si.group_id = sess.group_id
    LEFT JOIN attendance a ON sess.id = a.session_id AND si.student_id = a.student_id
    GROUP BY si.student_id, si.group_id, si.group_price, si.total_sessions
),
payment_summary AS (
    SELECT 
        si.student_id,
        si.group_id,
        COALESCE(SUM(p.amount), 0) as total_paid
    FROM student_info si
    LEFT JOIN payments p ON si.student_id = p.student_id AND si.group_id = p.group_id
    GROUP BY si.student_id, si.group_id
)
SELECT 
    si.student_name,
    si.group_name,
    si.group_price as original_group_price,
    as_summary.obligatory_sessions,
    as_summary.correct_amount_owed,
    ps.total_paid,
    as_summary.correct_amount_owed - ps.total_paid as correct_remaining_balance,
    CASE 
        WHEN as_summary.correct_amount_owed - ps.total_paid > 0 THEN 'OWES MONEY'
        WHEN as_summary.correct_amount_owed - ps.total_paid < 0 THEN 'OVERPAID'
        ELSE 'PAID IN FULL'
    END as payment_status
FROM student_info si
JOIN attendance_summary as_summary ON si.student_id = as_summary.student_id AND si.group_id = as_summary.group_id
JOIN payment_summary ps ON si.student_id = ps.student_id AND si.group_id = ps.group_id;
