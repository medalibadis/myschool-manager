-- =====================================================
-- FIX CALL LOGS INSERTION FOR REGISTRATION CONFIRMATIONS
-- This script fixes the call logs table to work with registration confirmations
-- =====================================================

-- 1. First, let's see what columns call_logs table currently has
SELECT 'CURRENT CALL_LOGS STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'call_logs' 
ORDER BY ordinal_position;

-- 2. Fix the call_logs table structure to match what the code expects
-- The code is trying to insert: student_id, call_type, status, notes, admin_name, call_date

-- Add missing columns if they don't exist
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS call_type VARCHAR(50) DEFAULT 'incoming';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS admin_name VARCHAR(255) DEFAULT 'Dalila';

-- 3. Update the existing call logs to have proper values
UPDATE call_logs 
SET call_type = COALESCE(call_type, 'incoming'),
    status = COALESCE(status, 'pending'),
    admin_name = COALESCE(admin_name, 'Dalila')
WHERE call_type IS NULL OR status IS NULL OR admin_name IS NULL;

-- 4. Test the insertion that the code is trying to do
SELECT 'TESTING CALL LOG INSERTION:' as info;

-- Try to insert a test call log with the same structure the code uses
INSERT INTO call_logs (
    student_name, 
    student_phone, 
    call_date, 
    call_time, 
    notes, 
    call_type, 
    status, 
    admin_name
) VALUES (
    'Test Registration Student', 
    '+1234567890', 
    CURRENT_DATE, 
    CURRENT_TIME, 
    'Test registration confirmation', 
    'registration', 
    'coming', 
    'Test Admin'
) ON CONFLICT DO NOTHING;

-- 5. Verify the test data was inserted
SELECT 'VERIFYING TEST DATA:' as info;
SELECT * FROM call_logs WHERE student_name = 'Test Registration Student';

-- 6. Show the final structure
SELECT 'FINAL CALL_LOGS STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'call_logs' 
ORDER BY ordinal_position;

-- 7. Final status
SELECT '🎉 CALL LOGS INSERTION FIXED!' as message;
SELECT 'Registration confirmations should now save to call logs properly.' as details;
SELECT 'The table now has all required columns: call_type, status, admin_name' as note;
