-- Fix Registration Fees for Existing Students
-- This script marks 'registration_fee_paid' as TRUE for all students
-- who are already enrolled in at least one group (active or stopped).
-- This prevents the system from retrospectively charging them the 500 DZD registration fee,
-- fixing the "Unpaid Group" balance discrepancy.

DO $$ 
DECLARE 
    updated_count INTEGER;
BEGIN
    -- Update students who have active/stopped groups but registration_fee_paid is false/null
    WITH students_with_groups AS (
        SELECT DISTINCT student_id 
        FROM student_groups 
        WHERE status IN ('active', 'stopped')
    )
    UPDATE students
    SET registration_fee_paid = TRUE
    WHERE id IN (SELECT student_id FROM students_with_groups)
    AND (registration_fee_paid IS NULL OR registration_fee_paid = FALSE);

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % students: marked registration_fee_paid = TRUE because they have existing group enrollments.', updated_count;
END $$;
