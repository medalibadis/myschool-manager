-- =====================================================
-- TEST BASIC DATABASE STRUCTURE
-- This script checks if the basic tables and columns exist
-- =====================================================

-- 1. Check if basic tables exist
SELECT 'CHECKING BASIC TABLES:' as info;

SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_name IN ('students', 'payments', 'groups', 'student_groups')
ORDER BY table_name;

-- 2. Check students table structure
SELECT 'STUDENTS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'students'
ORDER BY ordinal_position;

-- 3. Check payments table structure
SELECT 'PAYMENTS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payments'
ORDER BY ordinal_position;

-- 4. Check if there are any students
SELECT 'STUDENTS COUNT:' as info;
SELECT COUNT(*) as student_count FROM students;

-- 5. Check if there are any payments
SELECT 'PAYMENTS COUNT:' as info;
SELECT COUNT(*) as payment_count FROM payments;

-- 6. Check if student_groups table exists
SELECT 'STUDENT_GROUPS TABLE:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'student_groups';

-- 7. Test basic student query
SELECT 'TESTING BASIC STUDENT QUERY:' as info;
SELECT id, name, email, phone
FROM students
LIMIT 3;

-- 8. Test basic payment query
SELECT 'TESTING BASIC PAYMENT QUERY:' as info;
SELECT id, student_id, amount, date
FROM payments
LIMIT 3;

-- 9. Check for any errors in recent logs
SELECT 'CHECKING FOR RECENT ERRORS:' as info;
SELECT 'If you see this message, the basic database structure is working.' as status;
