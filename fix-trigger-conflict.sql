-- Fix Trigger Conflict Script
-- Run this to resolve the "trigger already exists" error

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS attendance_change_trigger ON attendance;

-- Drop the function if it exists (will also drop dependent triggers)
DROP FUNCTION IF EXISTS attendance_change_trigger() CASCADE;

-- Recreate the function
CREATE OR REPLACE FUNCTION attendance_change_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the payment adjustment function
    PERFORM handle_attendance_payment_adjustment(NEW.session_id, NEW.student_id, NEW.status);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER attendance_change_trigger
    AFTER INSERT OR UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION attendance_change_trigger();

-- Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'attendance_change_trigger';

SELECT 'Trigger conflict resolved successfully!' as status;
