-- Process existing attendance records to create missing payment adjustments
-- This script will find all existing "justified", "new", "change" sessions
-- and create the appropriate payment adjustments for students

-- First, let's see what we're working with
SELECT 
    'ATTENDANCE ANALYSIS' as analysis_type,
    COUNT(*) as total_attendance_records,
    COUNT(CASE WHEN status = 'justified' THEN 1 END) as justified_sessions,
    COUNT(CASE WHEN status = 'new' THEN 1 END) as new_sessions,
    COUNT(CASE WHEN status = 'change' THEN 1 END) as change_sessions,
    COUNT(CASE WHEN status = 'stop' THEN 1 END) as stop_sessions,
    COUNT(CASE WHEN status IN ('present', 'absent', 'too_late') THEN 1 END) as obligatory_sessions
FROM attendance
WHERE status IN ('justified', 'new', 'change', 'stop', 'present', 'absent', 'too_late');

-- Show students who have justified/new/change sessions but no corresponding payment adjustments
WITH student_adjustments AS (
    SELECT 
        a.student_id,
        a.status,
        COUNT(*) as session_count,
        s.groups!inner(price, total_sessions, name) as group_info
    FROM attendance a
    JOIN sessions s ON a.session_id = s.id
    WHERE a.status IN ('justified', 'new', 'change')
    GROUP BY a.student_id, a.status, s.groups
),
existing_payments AS (
    SELECT 
        student_id,
        group_id,
        COUNT(*) as adjustment_count
    FROM payments 
    WHERE payment_type IN ('attendance_credit', 'balance_credit')
    AND notes LIKE '%Attendance adjustment%'
    GROUP BY student_id, group_id
)
SELECT 
    sa.student_id,
    sa.status,
    sa.session_count,
    sa.group_info->>'name' as group_name,
    sa.group_info->>'price' as group_price,
    sa.group_info->>'total_sessions' as total_sessions,
    COALESCE(ep.adjustment_count, 0) as existing_adjustments
FROM student_adjustments sa
LEFT JOIN existing_payments ep ON sa.student_id = ep.student_id 
    AND (sa.group_info->>'id')::int = ep.group_id
WHERE COALESCE(ep.adjustment_count, 0) = 0  -- No existing adjustments
ORDER BY sa.student_id, sa.status;

-- Create a function to process attendance adjustments for existing records
CREATE OR REPLACE FUNCTION process_existing_attendance_adjustments()
RETURNS TABLE(
    student_id UUID,
    group_id INTEGER,
    status TEXT,
    sessions_processed INTEGER,
    total_adjustment_amount DECIMAL,
    payment_records_created INTEGER
) AS $$
DECLARE
    attendance_record RECORD;
    group_info RECORD;
    session_amount DECIMAL;
    total_adjustment DECIMAL := 0;
    payment_count INTEGER := 0;
    current_student_id UUID;
    current_group_id INTEGER;
    current_status TEXT;
    sessions_count INTEGER := 0;
BEGIN
    -- Process each student-group-status combination
    FOR attendance_record IN 
        SELECT 
            a.student_id,
            s.group_id,
            a.status,
            COUNT(*) as session_count,
            g.price,
            g.total_sessions,
            g.name as group_name
        FROM attendance a
        JOIN sessions s ON a.session_id = s.id
        JOIN groups g ON s.group_id = g.id
        WHERE a.status IN ('justified', 'new', 'change')
        GROUP BY a.student_id, s.group_id, a.status, g.price, g.total_sessions, g.name
        ORDER BY a.student_id, s.group_id, a.status
    LOOP
        -- Check if adjustment already exists
        IF NOT EXISTS (
            SELECT 1 FROM payments 
            WHERE student_id = attendance_record.student_id 
            AND group_id = attendance_record.group_id
            AND payment_type IN ('attendance_credit', 'balance_credit')
            AND notes LIKE '%Attendance adjustment%'
            AND notes LIKE '%' || attendance_record.status || '%'
        ) THEN
            -- Calculate session amount
            session_amount := (attendance_record.price::DECIMAL / attendance_record.total_sessions::DECIMAL);
            total_adjustment := session_amount * attendance_record.session_count;
            
            -- Check if group is fully paid
            DECLARE
                total_paid DECIMAL;
                is_group_paid BOOLEAN;
                payment_type TEXT;
                payment_notes TEXT;
            BEGIN
                SELECT COALESCE(SUM(amount), 0) INTO total_paid
                FROM payments 
                WHERE student_id = attendance_record.student_id 
                AND group_id = attendance_record.group_id
                AND payment_type NOT IN ('attendance_credit', 'balance_credit', 'refund');
                
                is_group_paid := total_paid >= attendance_record.price;
                
                IF is_group_paid THEN
                    payment_type := 'balance_credit';
                    payment_notes := 'Retroactive attendance adjustment: ' || attendance_record.status || 
                                   ' status for ' || attendance_record.session_count || ' sessions - added to positive balance';
                ELSE
                    payment_type := 'attendance_credit';
                    payment_notes := 'Retroactive attendance adjustment: ' || attendance_record.status || 
                                   ' status for ' || attendance_record.session_count || ' sessions - reduces unpaid group fee';
                END IF;
                
                -- Create the payment record
                INSERT INTO payments (
                    student_id,
                    group_id,
                    amount,
                    payment_type,
                    date,
                    notes,
                    admin_name
                ) VALUES (
                    attendance_record.student_id,
                    attendance_record.group_id,
                    total_adjustment,
                    payment_type,
                    CURRENT_DATE,
                    payment_notes,
                    'System - Retroactive Processing'
                );
                
                payment_count := payment_count + 1;
            END;
        END IF;
        
        -- Return the result for this combination
        student_id := attendance_record.student_id;
        group_id := attendance_record.group_id;
        status := attendance_record.status;
        sessions_processed := attendance_record.session_count;
        total_adjustment_amount := total_adjustment;
        payment_records_created := payment_count;
        
        RETURN NEXT;
        
        -- Reset counters for next iteration
        total_adjustment := 0;
        payment_count := 0;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to process all existing attendance adjustments
SELECT * FROM process_existing_attendance_adjustments();

-- Show summary of what was processed
SELECT 
    'PROCESSING SUMMARY' as summary_type,
    COUNT(*) as total_combinations_processed,
    SUM(sessions_processed) as total_sessions_processed,
    SUM(total_adjustment_amount) as total_adjustment_amount,
    SUM(payment_records_created) as total_payment_records_created
FROM process_existing_attendance_adjustments();

-- Clean up the function
DROP FUNCTION process_existing_attendance_adjustments();

-- Verify the results
SELECT 
    'VERIFICATION' as verification_type,
    COUNT(*) as total_attendance_adjustments,
    SUM(amount) as total_adjustment_amount,
    COUNT(DISTINCT student_id) as students_affected,
    COUNT(DISTINCT group_id) as groups_affected
FROM payments 
WHERE payment_type IN ('attendance_credit', 'balance_credit')
AND notes LIKE '%Retroactive attendance adjustment%';
