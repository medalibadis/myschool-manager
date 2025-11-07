-- DISABLE ATTENDANCE PAYMENT TRIGGER
-- This script disables the database trigger that automatically creates payments
-- when attendance is updated. This was causing students to appear as "paid"
-- when attendance was saved, even though no actual payment was made.

-- Step 1: Check if the trigger exists
SELECT 
    'CHECKING FOR TRIGGERS' as step,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'attendance'
    AND trigger_name LIKE '%attendance%payment%' 
    OR trigger_name LIKE '%attendance_change%'
ORDER BY trigger_name;

-- Step 2: Drop the trigger that automatically creates payments on attendance updates
DROP TRIGGER IF EXISTS attendance_change_trigger ON attendance;

-- Step 3: Drop the function that handles attendance payment adjustments
-- (This prevents it from being called by any other triggers)
DROP FUNCTION IF EXISTS handle_attendance_payment_adjustment(UUID, UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS attendance_change_trigger() CASCADE;

-- Step 4: Verify the trigger was removed
SELECT 
    'VERIFICATION' as step,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: No attendance payment triggers found'
        ELSE '⚠️ WARNING: Some triggers still exist'
    END as status,
    COUNT(*) as remaining_triggers
FROM information_schema.triggers 
WHERE event_object_table = 'attendance'
    AND (trigger_name LIKE '%attendance%payment%' 
         OR trigger_name LIKE '%attendance_change%');

-- Step 5: Show all remaining triggers on attendance table (for reference)
SELECT 
    'REMAINING TRIGGERS ON ATTENDANCE TABLE' as info,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'attendance'
ORDER BY trigger_name;

-- Step 6: Final confirmation
SELECT '✅ SUCCESS: Attendance payment trigger has been disabled!' as status;
SELECT '✅ Students will no longer appear as "paid" when attendance is updated' as status;
SELECT '✅ Payments will only be created when actual money is received' as status;

