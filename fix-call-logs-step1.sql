-- =====================================================
-- STEP 1: FIX CALL LOGS TABLE STRUCTURE
-- This will ensure the table has all required columns for saving confirmations
-- =====================================================

-- 1. Check current call_logs structure
SELECT 'CURRENT CALL_LOGS STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'call_logs' 
ORDER BY ordinal_position;

-- 2. Add missing columns if they don't exist
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS call_type VARCHAR(50) DEFAULT 'incoming';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS call_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS admin_name VARCHAR(255) DEFAULT 'Dalila';

-- 3. Test the exact insert that the code is trying to do
SELECT 'TESTING CALL LOG INSERT:' as info;

-- Try to insert with the same structure the code uses
INSERT INTO call_logs (
    student_name, 
    student_phone, 
    call_date, 
    call_time, 
    notes, 
    call_type, 
    call_status, 
    admin_name
) VALUES (
    'Test Student Confirmation', 
    '+1234567890', 
    CURRENT_DATE, 
    CURRENT_TIME, 
    'Registration confirmation: coming. Test notes', 
    'registration', 
    'coming', 
    'Test Admin'
) ON CONFLICT DO NOTHING;

-- 4. Verify the test data was inserted
SELECT 'VERIFYING TEST INSERT:' as info;
SELECT * FROM call_logs WHERE student_name = 'Test Student Confirmation';

-- 5. Show final structure
SELECT 'FINAL CALL_LOGS STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'call_logs' 
ORDER BY ordinal_position;

-- 6. Final status
SELECT '🎉 STEP 1 COMPLETE: Call logs structure fixed!' as message;
SELECT 'Now try saving confirmations again.' as next_step;
