-- MINIMAL SQL SCRIPT FOR PROCESSING EXISTING ATTENDANCE ADJUSTMENTS
-- Copy and paste ONLY this content into Supabase SQL Editor

-- Step 1: Check what needs processing
SELECT 
    COUNT(DISTINCT a.student_id) as students_affected,
    COUNT(*) as total_sessions_to_process
FROM attendance a
JOIN sessions s ON a.session_id = s.id
WHERE a.status IN ('justified', 'new', 'change');

-- Step 2: Process the adjustments
DO $$
DECLARE
    rec RECORD;
    session_amount DECIMAL;
    total_adjustment DECIMAL;
    total_paid DECIMAL;
    is_group_paid BOOLEAN;
    payment_type_var TEXT;
    payment_notes TEXT;
    processed_count INTEGER := 0;
BEGIN
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
        IF NOT EXISTS (
            SELECT 1 FROM payments 
            WHERE student_id = rec.student_id 
            AND group_id = rec.group_id
            AND payments.payment_type IN ('attendance_credit', 'balance_credit')
            AND notes LIKE '%Attendance adjustment%'
            AND notes LIKE '%' || rec.status || '%'
        ) THEN
            session_amount := (rec.price::DECIMAL / rec.total_sessions::DECIMAL);
            total_adjustment := session_amount * rec.session_count;
            
            SELECT COALESCE(SUM(amount), 0) INTO total_paid
            FROM payments 
            WHERE student_id = rec.student_id 
            AND group_id = rec.group_id
            AND payments.payment_type NOT IN ('attendance_credit', 'balance_credit', 'refund');
            
            is_group_paid := total_paid >= rec.price;
            
            IF is_group_paid THEN
                payment_type_var := 'balance_credit';
                payment_notes := 'Retroactive attendance adjustment: ' || rec.status || 
                               ' status for ' || rec.session_count || ' sessions - added to positive balance';
            ELSE
                payment_type_var := 'attendance_credit';
                payment_notes := 'Retroactive attendance adjustment: ' || rec.status || 
                               ' status for ' || rec.session_count || ' sessions - reduces unpaid group fee';
            END IF;
            
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
                payment_type_var,
                CURRENT_DATE,
                payment_notes,
                'System - Retroactive Processing'
            );
            
            processed_count := processed_count + 1;
            RAISE NOTICE 'Processed: Student %, Group %, Status %, Sessions %, Amount %', 
                rec.student_id, rec.group_id, rec.status, rec.session_count, total_adjustment;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total payment records created: %', processed_count;
END $$;

-- Step 3: Verify results
SELECT 
    COUNT(*) as total_adjustments_created,
    SUM(amount) as total_adjustment_amount,
    COUNT(DISTINCT student_id) as students_affected
FROM payments 
WHERE payment_type IN ('attendance_credit', 'balance_credit')
AND notes LIKE '%Retroactive attendance adjustment%';
