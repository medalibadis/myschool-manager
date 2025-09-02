-- Test script: Add a single student manually and check if it appears in suggested groups
-- Run this in Supabase SQL Editor

-- 1. Insert a test student with exact values
INSERT INTO waiting_list (
    name,
    email,
    phone,
    address,
    birth_date,
    parent_name,
    second_phone,
    default_discount,
    language,
    level,
    category,
    notes,
    registration_fee_paid,
    registration_fee_amount
) VALUES (
    'TEST STUDENT - English A1+ Adults',
    'test@example.com',
    '123456789',
    'Test Address',
    NULL,
    'Test Parent',
    NULL,
    0.00,
    'English',
    'A1+',
    'Adults',
    'Test student for debugging',
    true,
    500.00
);

-- 2. Verify the insertion
SELECT 
    'Test student inserted' as status,
    COUNT(*) as total_count
FROM waiting_list 
WHERE name = 'TEST STUDENT - English A1+ Adults';

-- 3. Show the test student
SELECT 
    name,
    language,
    level,
    category,
    registration_fee_paid,
    created_at
FROM waiting_list 
WHERE name = 'TEST STUDENT - English A1+ Adults';

-- 4. Check if it matches the filter criteria
SELECT 
    'Test student matches filter' as status,
    COUNT(*) as total_count
FROM waiting_list 
WHERE name = 'TEST STUDENT - English A1+ Adults'
    AND language = 'English' 
    AND level = 'A1+' 
    AND category = 'Adults';

-- 5. Show all English A1+ Adults students including the test student
SELECT 
    name,
    language,
    level,
    category,
    registration_fee_paid
FROM waiting_list 
WHERE language = 'English' 
    AND level = 'A1+' 
    AND category = 'Adults'
ORDER BY created_at DESC;

SELECT '✅ Test student added! Check the waiting list page now.' as final_status;
