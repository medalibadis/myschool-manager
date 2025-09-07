-- SIMPLE APPROACH: Process existing attendance adjustments step by step
-- Run these queries one by one to process existing justified/new/change sessions

-- STEP 1: See what needs to be processed
SELECT 
    'STUDENTS WITH MISSING ADJUSTMENTS' as step,
    COUNT(DISTINCT a.student_id) as students_affected,
    COUNT(*) as total_sessions_to_process
FROM attendance a
JOIN sessions s ON a.session_id = s.id
WHERE a.status IN ('justified', 'new', 'change')
AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.student_id = a.student_id 
    AND p.group_id = s.group_id
    AND p.payment_type IN ('attendance_credit', 'balance_credit')
    AND p.notes LIKE '%Attendance adjustment%'
);

-- STEP 2: Show detailed breakdown by student and group
SELECT 
    a.student_id,
    s.group_id,
    g.name as group_name,
    a.status,
    COUNT(*) as session_count,
    g.price,
    g.total_sessions,
    ROUND((g.price::DECIMAL / g.total_sessions::DECIMAL) * COUNT(*), 2) as adjustment_amount
FROM attendance a
JOIN sessions s ON a.session_id = s.id
JOIN groups g ON s.group_id = g.id
WHERE a.status IN ('justified', 'new', 'change')
GROUP BY a.student_id, s.group_id, g.name, a.status, g.price, g.total_sessions
ORDER BY a.student_id, s.group_id, a.status;

-- STEP 3: Process adjustments for each student-group-status combination
-- This will create the missing payment adjustments

DO $$
DECLARE
    rec RECORD;
    session_amount DECIMAL;
    total_adjustment DECIMAL;
    total_paid DECIMAL;
    is_group_paid BOOLEAN;
    payment_type TEXT;
    payment_notes TEXT;
    processed_count INTEGER := 0;
BEGIN
    -- Process each student-group-status combination
    FOR rec IN 
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
            WHERE student_id = rec.student_id 
            AND group_id = rec.group_id
            AND payment_type IN ('attendance_credit', 'balance_credit')
            AND notes LIKE '%Attendance adjustment%'
            AND notes LIKE '%' || rec.status || '%'
        ) THEN
            -- Calculate session amount and total adjustment
            session_amount := (rec.price::DECIMAL / rec.total_sessions::DECIMAL);
            total_adjustment := session_amount * rec.session_count;
            
            -- Check if group is fully paid
            SELECT COALESCE(SUM(amount), 0) INTO total_paid
            FROM payments 
            WHERE student_id = rec.student_id 
            AND group_id = rec.group_id
            AND payment_type NOT IN ('attendance_credit', 'balance_credit', 'refund');
            
            is_group_paid := total_paid >= rec.price;
            
            -- Determine payment type and notes
            IF is_group_paid THEN
                payment_type := 'balance_credit';
                payment_notes := 'Retroactive attendance adjustment: ' || rec.status || 
                               ' status for ' || rec.session_count || ' sessions - added to positive balance';
            ELSE
                payment_type := 'attendance_credit';
                payment_notes := 'Retroactive attendance adjustment: ' || rec.status || 
                               ' status for ' || rec.session_count || ' sessions - reduces unpaid group fee';
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
                rec.student_id,
                rec.group_id,
                total_adjustment,
                payment_type,
                CURRENT_DATE,
                payment_notes,
                'System - Retroactive Processing'
            );
            
            processed_count := processed_count + 1;
            
            -- Log the processing
            RAISE NOTICE 'Processed: Student %, Group % (%), Status %, Sessions %, Amount %', 
                rec.student_id, rec.group_id, rec.group_name, rec.status, rec.session_count, total_adjustment;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total payment records created: %', processed_count;
END $$;

-- STEP 4: Verify the results
SELECT 
    'VERIFICATION RESULTS' as step,
    COUNT(*) as total_adjustments_created,
    SUM(amount) as total_adjustment_amount,
    COUNT(DISTINCT student_id) as students_affected,
    COUNT(DISTINCT group_id) as groups_affected
FROM payments 
WHERE payment_type IN ('attendance_credit', 'balance_credit')
AND notes LIKE '%Retroactive attendance adjustment%';

-- STEP 5: Show some examples of what was created
SELECT 
    p.student_id,
    s.name as student_name,
    p.group_id,
    g.name as group_name,
    p.amount,
    p.payment_type,
    p.notes,
    p.date
FROM payments p
JOIN students s ON p.student_id = s.id
JOIN groups g ON p.group_id = g.id
WHERE p.payment_type IN ('attendance_credit', 'balance_credit')
AND p.notes LIKE '%Retroactive attendance adjustment%'
ORDER BY p.date DESC, p.student_id
LIMIT 10;
