-- ENFORCE UNIQUE PHONE NUMBERS IN WAITING LIST
-- This script removes duplicate waiting list entries (keeping the most recent)
-- and adds a UNIQUE constraint on the phone column to prevent future duplicates.
-- WARNING: Make sure you have a backup before running this script.

-- ========================================
-- STEP 1: SHOW DUPLICATE PHONE NUMBERS
-- ========================================
SELECT '=== DUPLICATE WAITING LIST ENTRIES ===' as info;
SELECT 
    phone,
    COUNT(*) as duplicate_count,
    STRING_AGG(name, ', ') as student_names
FROM waiting_list
WHERE phone IS NOT NULL AND phone != ''
GROUP BY phone
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- ========================================
-- STEP 2: DELETE DUPLICATES (KEEP MOST RECENT)
-- ========================================
SELECT '=== DELETING DUPLICATE ENTRIES (KEEPING MOST RECENT) ===' as info;

WITH ranked_waiting_list AS (
    SELECT 
        id,
        phone,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at DESC) as rn
    FROM waiting_list
    WHERE phone IS NOT NULL AND phone != ''
)
DELETE FROM waiting_list
WHERE id IN (
    SELECT id
    FROM ranked_waiting_list
    WHERE rn > 1
);

SELECT '✅ Duplicate waiting list entries removed (keeping the most recent entry for each phone)' as status;

-- ========================================
-- STEP 3: ADD UNIQUE CONSTRAINT
-- ========================================
SELECT '=== ADDING UNIQUE CONSTRAINT ON waiting_list.phone ===' as info;

ALTER TABLE waiting_list
ADD CONSTRAINT unique_waiting_list_phone UNIQUE (phone);

SELECT '✅ UNIQUE constraint added on waiting_list.phone' as status;

-- ========================================
-- STEP 4: VERIFY RESULT
-- ========================================
SELECT '=== VERIFYING NO MORE DUPLICATES EXIST ===' as info;
SELECT 
    COUNT(*) as duplicate_count
FROM (
    SELECT phone
    FROM waiting_list
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY phone
    HAVING COUNT(*) > 1
) dup;

SELECT '✅ Duplicate check complete - should be 0 duplicates above' as status;

-- ========================================
-- STEP 5: SUMMARY
-- ========================================
SELECT '=== SUMMARY ===' as info;
SELECT '✅ All duplicate waiting list entries (same phone) have been removed' as status;
SELECT '✅ A UNIQUE constraint now prevents future duplicates by phone' as status;
SELECT '✅ Re-run this script only if you remove the constraint manually' as status;
