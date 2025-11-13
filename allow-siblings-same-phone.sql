-- ALLOW SIBLINGS TO SHARE THE SAME PHONE NUMBER
-- This script removes the UNIQUE constraint on waiting_list.phone
-- so that siblings (brothers/sisters) can share their parent's phone number.
-- The application will still prevent duplicate entries by checking name + phone combination.

-- ========================================
-- STEP 1: CHECK CURRENT CONSTRAINT
-- ========================================
SELECT '=== CHECKING CURRENT CONSTRAINTS ON waiting_list.phone ===' as info;

SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'waiting_list'::regclass
AND conname LIKE '%phone%';

-- ========================================
-- STEP 2: REMOVE UNIQUE CONSTRAINT
-- ========================================
SELECT '=== REMOVING UNIQUE CONSTRAINT ON waiting_list.phone ===' as info;

-- Drop the unique constraint if it exists
ALTER TABLE waiting_list
DROP CONSTRAINT IF EXISTS unique_waiting_list_phone;

-- Also check for any unique index on phone
DROP INDEX IF EXISTS unique_waiting_list_phone;
DROP INDEX IF EXISTS idx_waiting_list_phone_unique;

SELECT '✅ UNIQUE constraint removed from waiting_list.phone' as status;

-- ========================================
-- STEP 3: VERIFY CONSTRAINTS REMOVED
-- ========================================
SELECT '=== VERIFYING CONSTRAINTS REMOVED ===' as info;

SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'waiting_list'::regclass
AND conname LIKE '%phone%';

SELECT '✅ Verification complete - phone number can now be shared by multiple students' as status;

-- ========================================
-- STEP 4: SUMMARY
-- ========================================
SELECT '=== SUMMARY ===' as info;
SELECT '✅ Siblings can now share the same phone number' as status;
SELECT '✅ The application will still prevent duplicate entries by checking name + phone combination' as status;
SELECT '✅ This allows brothers/sisters to be added with their parent''s phone number' as status;

