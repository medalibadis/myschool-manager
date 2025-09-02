-- Debug script to check what getSuggestedGroups sees
-- Run this in Supabase SQL Editor

-- 1. Check all waiting_list students with their key fields
SELECT 
    'All waiting_list students' as check_type,
    COUNT(*) as total_count
FROM waiting_list;

-- 2. Show all students with their language, level, category
SELECT 
    name,
    language,
    level,
    category,
    registration_fee_paid,
    created_at
FROM waiting_list 
ORDER BY created_at DESC;

-- 3. Check for students that should match the filter criteria
SELECT 
    'Students matching English A1+ Adults' as check_type,
    COUNT(*) as total_count
FROM waiting_list 
WHERE language = 'English' 
    AND level = 'A1+' 
    AND category = 'Adults';

-- 4. Show the matching students
SELECT 
    name,
    phone,
    address,
    language,
    level,
    category,
    registration_fee_paid,
    created_at
FROM waiting_list 
WHERE language = 'English' 
    AND level = 'A1+' 
    AND category = 'Adults'
ORDER BY name;

-- 5. Check for any students with 'other' values (which get filtered out)
SELECT 
    'Students with "other" values' as check_type,
    COUNT(*) as total_count
FROM waiting_list 
WHERE language = 'other' 
    OR level = 'other' 
    OR category = 'other';

-- 6. Check for students with empty strings
SELECT 
    'Students with empty strings' as check_type,
    COUNT(*) as total_count
FROM waiting_list 
WHERE language = '' 
    OR level = '' 
    OR category = '';

-- 7. Check for students with NULL values
SELECT 
    'Students with NULL values' as check_type,
    COUNT(*) as total_count
FROM waiting_list 
WHERE language IS NULL 
    OR level IS NULL 
    OR category IS NULL;

-- 8. Show students with NULL values
SELECT 
    name,
    language,
    level,
    category
FROM waiting_list 
WHERE language IS NULL 
    OR level IS NULL 
    OR category IS NULL;

-- 9. Check for case sensitivity issues
SELECT 
    'Students with lowercase "english"' as check_type,
    COUNT(*) as total_count
FROM waiting_list 
WHERE LOWER(language) = 'english';

-- 10. Show students with lowercase "english"
SELECT 
    name,
    language,
    level,
    category
FROM waiting_list 
WHERE LOWER(language) = 'english';
