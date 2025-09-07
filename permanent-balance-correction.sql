-- PERMANENT BALANCE CORRECTION FOR UNPAID STUDENTS
-- This script will fix balances for students who haven't paid yet
-- by counting only obligatory sessions (absent, present, too_late)

-- Step 1: Find students who haven't paid their group fees yet
WITH unpaid_students AS (
    SELECT 
        sg.student_id,
        sg.group_id,
        g.name as group_name,
        g.price as group_price,
        g.total_sessions,
        COALESCE(SUM(p.amount), 0) as total_paid
    FROM student_groups sg
    JOIN groups g ON sg.group_id = g.id
    LEFT JOIN payments p ON sg.student_id = p.student_id 
        AND sg.group_id = p.group_id 
        AND p.payment_type NOT IN ('attendance_credit', 'balance_credit', 'refund')
    GROUP BY sg.student_id, sg.group_id, g.name, g.price, g.total_sessions
    HAVING COALESCE(SUM(p.amount), 0) < g.price  -- Students who haven't paid in full
),
student_attendance_counts AS (
    SELECT 
        us.student_id,
        us.group_id,
        us.group_name,
        us.group_price,
        us.total_sessions,
        us.total_paid,
        COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) as obligatory_sessions,
        COUNT(CASE WHEN a.status IN ('justified', 'new', 'change', 'stop') THEN 1 END) as free_sessions,
        COUNT(*) as total_attendance_records
    FROM unpaid_students us
    LEFT JOIN sessions s ON us.group_id = s.group_id
    LEFT JOIN attendance a ON s.id = a.session_id AND us.student_id = a.student_id
    GROUP BY us.student_id, us.group_id, us.group_name, us.group_price, us.total_sessions, us.total_paid
),
balance_corrections AS (
    SELECT 
        sac.student_id,
        sac.group_id,
        sac.group_name,
        sac.group_price,
        sac.total_sessions,
        sac.total_paid,
        sac.obligatory_sessions,
        sac.free_sessions,
        ROUND((sac.group_price::DECIMAL / sac.total_sessions::DECIMAL), 2) as price_per_session,
        ROUND(sac.obligatory_sessions * (sac.group_price::DECIMAL / sac.total_sessions::DECIMAL), 2) as correct_amount_owed,
        sac.group_price - ROUND(sac.obligatory_sessions * (sac.group_price::DECIMAL / sac.total_sessions::DECIMAL), 2) as amount_to_adjust
    FROM student_attendance_counts sac
    WHERE sac.obligatory_sessions > 0  -- Only process students with attendance records
)
SELECT 
    'UNPAID STUDENTS BALANCE CORRECTION' as action_type,
    COUNT(*) as students_to_correct,
    SUM(amount_to_adjust) as total_adjustment_amount,
    SUM(correct_amount_owed) as total_correct_amount_owed,
    SUM(group_price) as total_original_amount
FROM balance_corrections;

-- Step 2: Show detailed breakdown of what will be corrected
WITH unpaid_students AS (
    SELECT 
        sg.student_id,
        sg.group_id,
        g.name as group_name,
        g.price as group_price,
        g.total_sessions,
        COALESCE(SUM(p.amount), 0) as total_paid
    FROM student_groups sg
    JOIN groups g ON sg.group_id = g.id
    LEFT JOIN payments p ON sg.student_id = p.student_id 
        AND sg.group_id = p.group_id 
        AND p.payment_type NOT IN ('attendance_credit', 'balance_credit', 'refund')
    GROUP BY sg.student_id, sg.group_id, g.name, g.price, g.total_sessions
    HAVING COALESCE(SUM(p.amount), 0) < g.price
),
student_attendance_counts AS (
    SELECT 
        us.student_id,
        us.group_id,
        us.group_name,
        us.group_price,
        us.total_sessions,
        us.total_paid,
        COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) as obligatory_sessions,
        COUNT(CASE WHEN a.status IN ('justified', 'new', 'change', 'stop') THEN 1 END) as free_sessions,
        COUNT(*) as total_attendance_records
    FROM unpaid_students us
    LEFT JOIN sessions s ON us.group_id = s.group_id
    LEFT JOIN attendance a ON s.id = a.session_id AND us.student_id = a.student_id
    GROUP BY us.student_id, us.group_id, us.group_name, us.group_price, us.total_sessions, us.total_paid
),
balance_corrections AS (
    SELECT 
        sac.student_id,
        sac.group_id,
        sac.group_name,
        sac.group_price,
        sac.total_sessions,
        sac.total_paid,
        sac.obligatory_sessions,
        sac.free_sessions,
        ROUND((sac.group_price::DECIMAL / sac.total_sessions::DECIMAL), 2) as price_per_session,
        ROUND(sac.obligatory_sessions * (sac.group_price::DECIMAL / sac.total_sessions::DECIMAL), 2) as correct_amount_owed,
        sac.group_price - ROUND(sac.obligatory_sessions * (sac.group_price::DECIMAL / sac.total_sessions::DECIMAL), 2) as amount_to_adjust
    FROM student_attendance_counts sac
    WHERE sac.obligatory_sessions > 0
)
SELECT 
    bc.student_id,
    s.name as student_name,
    bc.group_name,
    bc.obligatory_sessions || '/' || bc.total_sessions as sessions_breakdown,
    bc.group_price as original_group_price,
    bc.correct_amount_owed as correct_amount_owed,
    bc.total_paid as amount_already_paid,
    bc.correct_amount_owed - bc.total_paid as remaining_to_pay,
    bc.amount_to_adjust as adjustment_needed
FROM balance_corrections bc
JOIN students s ON bc.student_id = s.id
ORDER BY bc.amount_to_adjust DESC, bc.student_id;

-- Step 3: Create the actual balance corrections
-- This will create payment adjustments to correct the balances
DO $$
DECLARE
    rec RECORD;
    adjustment_amount DECIMAL;
    payment_notes TEXT;
    processed_count INTEGER := 0;
BEGIN
    FOR rec IN 
        SELECT 
            sac.student_id,
            sac.group_id,
            sac.group_name,
            sac.group_price,
            sac.total_sessions,
            sac.total_paid,
            sac.obligatory_sessions,
            sac.free_sessions,
            ROUND((sac.group_price::DECIMAL / sac.total_sessions::DECIMAL), 2) as price_per_session,
            ROUND(sac.obligatory_sessions * (sac.group_price::DECIMAL / sac.total_sessions::DECIMAL), 2) as correct_amount_owed,
            sac.group_price - ROUND(sac.obligatory_sessions * (sac.group_price::DECIMAL / sac.total_sessions::DECIMAL), 2) as amount_to_adjust
        FROM (
            SELECT 
                us.student_id,
                us.group_id,
                us.group_name,
                us.group_price,
                us.total_sessions,
                us.total_paid,
                COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) as obligatory_sessions,
                COUNT(CASE WHEN a.status IN ('justified', 'new', 'change', 'stop') THEN 1 END) as free_sessions
            FROM (
                SELECT 
                    sg.student_id,
                    sg.group_id,
                    g.name as group_name,
                    g.price as group_price,
                    g.total_sessions,
                    COALESCE(SUM(p.amount), 0) as total_paid
                FROM student_groups sg
                JOIN groups g ON sg.group_id = g.id
                LEFT JOIN payments p ON sg.student_id = p.student_id 
                    AND sg.group_id = p.group_id 
                    AND p.payment_type NOT IN ('attendance_credit', 'balance_credit', 'refund')
                GROUP BY sg.student_id, sg.group_id, g.name, g.price, g.total_sessions
                HAVING COALESCE(SUM(p.amount), 0) < g.price
            ) us
            LEFT JOIN sessions s ON us.group_id = s.group_id
            LEFT JOIN attendance a ON s.id = a.session_id AND us.student_id = a.student_id
            GROUP BY us.student_id, us.group_id, us.group_name, us.group_price, us.total_sessions, us.total_paid
            HAVING COUNT(CASE WHEN a.status IN ('present', 'absent', 'too_late') THEN 1 END) > 0
        ) sac
        WHERE sac.group_price - ROUND(sac.obligatory_sessions * (sac.group_price::DECIMAL / sac.total_sessions::DECIMAL), 2) > 0
        ORDER BY sac.student_id, sac.group_id
    LOOP
        adjustment_amount := rec.amount_to_adjust;
        
        -- Only create adjustment if there's a meaningful amount to adjust
        IF adjustment_amount > 0.01 THEN
            payment_notes := 'Permanent balance correction: ' || rec.free_sessions || 
                           ' free sessions (justified/new/change/stop) not counted. ' ||
                           'Only ' || rec.obligatory_sessions || ' obligatory sessions charged.';
            
            -- Create the payment adjustment
            INSERT INTO payments (
                student_id,
                group_id,
                amount,
                payment_type,
                date,
                notes,
                admin_name
            ) VALUES (
                rec.student_id,
                rec.group_id,
                adjustment_amount,
                'attendance_credit',
                CURRENT_DATE,
                payment_notes,
                'System - Permanent Balance Correction'
            );
            
            processed_count := processed_count + 1;
            
            RAISE NOTICE 'Corrected: Student %, Group % (%), Obligatory: %, Free: %, Adjustment: %', 
                rec.student_id, rec.group_id, rec.group_name, rec.obligatory_sessions, rec.free_sessions, adjustment_amount;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total permanent balance corrections created: %', processed_count;
END $$;

-- Step 4: Verify the corrections
SELECT 
    'VERIFICATION RESULTS' as verification_type,
    COUNT(*) as total_corrections_created,
    SUM(amount) as total_correction_amount,
    COUNT(DISTINCT student_id) as students_corrected,
    COUNT(DISTINCT group_id) as groups_corrected
FROM payments 
WHERE payment_type = 'attendance_credit'
AND notes LIKE '%Permanent balance correction%';

-- Step 5: Show examples of corrections made
SELECT 
    p.student_id,
    s.name as student_name,
    p.group_id,
    g.name as group_name,
    p.amount as correction_amount,
    p.notes,
    p.date as correction_date
FROM payments p
JOIN students s ON p.student_id = s.id
JOIN groups g ON p.group_id = g.id
WHERE p.payment_type = 'attendance_credit'
AND p.notes LIKE '%Permanent balance correction%'
ORDER BY p.date DESC, p.student_id;
