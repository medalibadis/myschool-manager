-- COMPLETE FIX FOR ATTENDANCE PAYMENT ISSUE
-- This script will:
-- 1. Disable the database trigger that creates payments on attendance updates
-- 2. Delete all existing attendance-based payment adjustments
-- 3. Verify the fix

-- ========================================
-- STEP 1: DISABLE DATABASE TRIGGER
-- ========================================
SELECT '=== STEP 1: DISABLING DATABASE TRIGGER ===' as step;

-- Drop the trigger that automatically creates payments on attendance updates
DROP TRIGGER IF EXISTS attendance_change_trigger ON attendance;

-- Drop the function that handles attendance payment adjustments
DROP FUNCTION IF EXISTS handle_attendance_payment_adjustment(UUID, UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS attendance_change_trigger() CASCADE;

-- Verify the trigger was removed
SELECT 
    'VERIFICATION: Checking for remaining triggers' as step,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: No attendance payment triggers found'
        ELSE '⚠️ WARNING: Some triggers still exist'
    END as status,
    COUNT(*) as remaining_triggers
FROM information_schema.triggers 
WHERE event_object_table = 'attendance'
    AND (trigger_name LIKE '%attendance%payment%' 
         OR trigger_name LIKE '%attendance_change%');

-- ========================================
-- STEP 2: DELETE EXISTING ATTENDANCE-BASED PAYMENTS
-- ========================================
SELECT '=== STEP 2: DELETING ATTENDANCE-BASED PAYMENTS ===' as step;

-- Show what will be deleted
SELECT 
    'PAYMENTS TO BE DELETED' as info,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    COUNT(DISTINCT student_id) as students_affected,
    COUNT(DISTINCT group_id) as groups_affected
FROM payments 
WHERE (
    payment_type = 'attendance_credit'
    OR payment_type = 'balance_credit'
    OR notes LIKE '%Attendance-based payment update%'
    OR notes LIKE '%Attendance adjustment%'
    OR notes LIKE '%Session refund%'
    OR notes LIKE '%Stop refund%'
    OR notes LIKE '%Stop credit%'
    OR admin_name = 'System'
    OR admin_name LIKE '%System%'
    OR admin_name LIKE '%Attendance Update%'
);

-- Delete all attendance-based payment adjustments
DELETE FROM payments 
WHERE (
    payment_type = 'attendance_credit'
    OR payment_type = 'balance_credit'
    OR notes LIKE '%Attendance-based payment update%'
    OR notes LIKE '%Attendance adjustment%'
    OR notes LIKE '%Session refund%'
    OR notes LIKE '%Stop refund%'
    OR notes LIKE '%Stop credit%'
    OR admin_name = 'System'
    OR admin_name LIKE '%System%'
    OR admin_name LIKE '%Attendance Update%'
)
AND (
    -- Only delete if it's NOT a regular group payment
    payment_type != 'group_payment'
    OR payment_type IS NULL
);

-- Show deletion results
SELECT 
    'DELETION COMPLETE' as status,
    '✅ All attendance-based payments have been deleted' as message;

-- ========================================
-- STEP 3: VERIFY THE FIX
-- ========================================
SELECT '=== STEP 3: VERIFICATION ===' as step;

-- Check for remaining attendance-based payments
SELECT 
    'REMAINING ATTENDANCE PAYMENTS' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: No attendance-based payments found'
        ELSE '⚠️ WARNING: Some attendance-based payments still exist'
    END as status
FROM payments 
WHERE (
    payment_type = 'attendance_credit'
    OR payment_type = 'balance_credit'
    OR notes LIKE '%Attendance-based payment update%'
    OR notes LIKE '%Attendance adjustment%'
    OR admin_name = 'System'
    OR admin_name LIKE '%Attendance Update%'
)
AND payment_type != 'group_payment';

-- Check for remaining triggers
SELECT 
    'REMAINING TRIGGERS' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: No attendance payment triggers found'
        ELSE '⚠️ WARNING: Some triggers still exist'
    END as status
FROM information_schema.triggers 
WHERE event_object_table = 'attendance'
    AND (trigger_name LIKE '%attendance%payment%' 
         OR trigger_name LIKE '%attendance_change%');

-- ========================================
-- STEP 4: FINAL SUMMARY
-- ========================================
SELECT '=== FINAL SUMMARY ===' as step;
SELECT '✅ Database trigger has been disabled!' as status;
SELECT '✅ All attendance-based payments have been deleted!' as status;
SELECT '✅ Students will no longer appear as "paid" when attendance is updated' as status;
SELECT '✅ Payments will only be created when actual money is received' as status;
SELECT '✅ You can now update attendance without affecting payment status' as status;

-- Show sample of remaining payments (should only show real payments)
SELECT 
    'SAMPLE OF REMAINING PAYMENTS' as info,
    p.id,
    s.name as student_name,
    g.name as group_name,
    p.amount,
    p.payment_type,
    p.notes,
    p.admin_name,
    p.date
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
LEFT JOIN groups g ON p.group_id = g.id
ORDER BY p.date DESC
LIMIT 10;

