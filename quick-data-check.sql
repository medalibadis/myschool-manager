-- Quick check: Let's see what the actual data looks like
-- Run this in Supabase SQL Editor

-- Show all students with their exact values
SELECT 
    name,
    language,
    level,
    category,
    registration_fee_paid,
    LENGTH(language) as lang_length,
    LENGTH(level) as level_length,
    LENGTH(category) as cat_length
FROM waiting_list 
ORDER BY created_at DESC;

-- Check for any hidden characters or spaces
SELECT 
    name,
    language,
    level,
    category,
    '|' || language || '|' as lang_with_pipes,
    '|' || level || '|' as level_with_pipes,
    '|' || category || '|' as cat_with_pipes
FROM waiting_list 
WHERE name LIKE '%TEST%' OR name LIKE '%قطر%'
ORDER BY created_at DESC;
