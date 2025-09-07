-- TRIGGER ATTENDANCE-PAYMENT LINK FOR EXISTING STUDENTS
-- This script will update attendance records to trigger the new payment calculation

-- Step 1: Find students who need attendance-payment updates
WITH students_with_attendance AS (
    SELECT DISTINCT
        a.student_id,
        s.group_id,
        g.name as group_name,
        COUNT(*) as total_attendance_records,
        COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) as obligatory_sessions,
        COUNT(CASE WHEN a.status IN ('justified', 'new', 'change', 'stop') THEN 1 END) as free_sessions
    FROM attendance a
    JOIN sessions s ON a.session_id = s.id
    JOIN groups g ON s.group_id = g.id
    WHERE a.status IN ('present', 'absent', 'too_late', 'justified', 'new', 'change', 'stop')
    GROUP BY a.student_id, s.group_id, g.name
    HAVING COUNT(CASE WHEN a.status IN ('justified', 'new', 'change', 'stop') THEN 1 END) > 0
)
SELECT 
    'STUDENTS NEEDING ATTENDANCE-PAYMENT UPDATE' as action_type,
    COUNT(*) as students_to_update,
    SUM(total_attendance_records) as total_attendance_records,
    SUM(obligatory_sessions) as total_obligatory_sessions,
    SUM(free_sessions) as total_free_sessions
FROM students_with_attendance;

-- Step 2: Show detailed breakdown
WITH students_with_attendance AS (
    SELECT DISTINCT
        a.student_id,
        s.group_id,
        g.name as group_name,
        g.price as group_price,
        g.total_sessions,
        COUNT(*) as total_attendance_records,
        COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) as obligatory_sessions,
        COUNT(CASE WHEN a.status IN ('justified', 'new', 'change', 'stop') THEN 1 END) as free_sessions
    FROM attendance a
    JOIN sessions s ON a.session_id = s.id
    JOIN groups g ON s.group_id = g.id
    WHERE a.status IN ('present', 'absent', 'too_late', 'justified', 'new', 'change', 'stop')
    GROUP BY a.student_id, s.group_id, g.name, g.price, g.total_sessions
    HAVING COUNT(CASE WHEN a.status IN ('justified', 'new', 'change', 'stop') THEN 1 END) > 0
)
SELECT 
    swa.student_id,
    st.name as student_name,
    swa.group_name,
    swa.obligatory_sessions || '/' || swa.total_sessions as sessions_breakdown,
    swa.group_price as original_group_price,
    ROUND(swa.obligatory_sessions * (swa.group_price::DECIMAL / swa.total_sessions::DECIMAL), 2) as correct_amount_owed,
    swa.free_sessions as free_sessions_count,
    ROUND(swa.free_sessions * (swa.group_price::DECIMAL / swa.total_sessions::DECIMAL), 2) as free_amount
FROM students_with_attendance swa
JOIN students st ON swa.student_id = st.id
ORDER BY swa.student_id, swa.group_id;

-- Step 3: Trigger attendance updates for existing students
-- This will cause the attendance-payment link to recalculate payments
DO $$
DECLARE
    rec RECORD;
    updated_count INTEGER := 0;
BEGIN
    -- Update attendance records to trigger the new payment calculation
    FOR rec IN 
        SELECT DISTINCT
            a.student_id,
            a.session_id,
            a.status,
            s.group_id,
            g.name as group_name
        FROM attendance a
        JOIN sessions s ON a.session_id = s.id
        JOIN groups g ON s.group_id = g.id
        WHERE a.status IN ('justified', 'new', 'change', 'stop')
        ORDER BY a.student_id, a.session_id
        LIMIT 100  -- Process in batches to avoid overwhelming the system
    LOOP
        -- Update the attendance record with the same status to trigger the payment calculation
        UPDATE attendance 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE student_id = rec.student_id 
        AND session_id = rec.session_id;
        
        updated_count := updated_count + 1;
        
        RAISE NOTICE 'Triggered payment update for student %, group % (%), session %', 
            rec.student_id, rec.group_id, rec.group_name, rec.session_id;
    END LOOP;
    
    RAISE NOTICE 'Total attendance records updated to trigger payment calculations: %', updated_count;
END $$;

-- Step 4: Verify that payment adjustments were created
SELECT 
    'PAYMENT ADJUSTMENTS CREATED' as verification_type,
    COUNT(*) as total_adjustments,
    SUM(amount) as total_adjustment_amount,
    COUNT(DISTINCT student_id) as students_affected,
    COUNT(DISTINCT group_id) as groups_affected
FROM payments 
WHERE payment_type IN ('attendance_credit', 'balance_credit')
AND notes LIKE '%Attendance-based payment update%';

-- Step 5: Show examples of adjustments created
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
AND p.notes LIKE '%Attendance-based payment update%'
ORDER BY p.date DESC, p.student_id
LIMIT 20;
