-- Fix All Schema Conflicts Script
-- Run this to resolve all potential conflicts before running the main schema

-- 1. Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS attendance_change_trigger ON attendance;

-- 2. Drop existing functions (will also drop dependent triggers)
DROP FUNCTION IF EXISTS attendance_change_trigger() CASCADE;
DROP FUNCTION IF EXISTS handle_attendance_payment_adjustment(UUID, UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS calculate_student_balance(UUID) CASCADE;

-- 3. Drop existing views
DROP VIEW IF EXISTS student_payment_summary;

-- 4. Remove existing migration record if it exists
DELETE FROM schema_migrations WHERE version = '2024-01-01-enhanced-payment-system';

-- 5. Verify cleanup
SELECT 'Schema conflicts resolved. You can now run the main enhanced-payment-system-schema.sql script.' as status;

-- 6. Show current state
SELECT 
    'Current triggers:' as info,
    COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_name LIKE '%attendance%' OR trigger_name LIKE '%payment%';

SELECT 
    'Current functions:' as info,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_name LIKE '%attendance%' OR routine_name LIKE '%payment%' OR routine_name LIKE '%balance%';
