-- Clear All Call Logs
-- This script will delete all call logs from the database
-- WARNING: This is irreversible! Make sure you have a backup if needed.

-- Step 1: Show current call logs count before deletion
SELECT '=== BEFORE DELETION ===' as info;
SELECT 
    COUNT(*) as total_call_logs,
    COUNT(DISTINCT student_name) as unique_students,
    COUNT(DISTINCT call_type) as call_types,
    MIN(created_at) as oldest_log,
    MAX(created_at) as newest_log
FROM call_logs;

-- Step 2: Show sample of what will be deleted
SELECT '=== SAMPLE CALL LOGS TO BE DELETED ===' as info;
SELECT 
    id,
    student_name,
    student_phone,
    call_type,
    call_status,
    call_date,
    created_at
FROM call_logs
ORDER BY created_at DESC
LIMIT 10;

-- Step 3: Delete all call logs
SELECT '=== DELETING ALL CALL LOGS ===' as info;
DELETE FROM call_logs;

SELECT '✅ All call logs have been deleted' as status;

-- Step 4: Verify deletion
SELECT '=== AFTER DELETION ===' as info;
SELECT 
    COUNT(*) as remaining_call_logs
FROM call_logs;

-- Step 5: Final confirmation
SELECT '✅ SUCCESS: All call logs have been cleared!' as status;
SELECT '✅ The call_logs table is now empty' as status;

