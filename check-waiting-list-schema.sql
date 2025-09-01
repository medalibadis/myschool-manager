-- Check waiting_list table structure
-- Run this in Supabase SQL Editor to see what columns exist

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'waiting_list' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show if table exists
SELECT 
    'Table Status' as status,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'waiting_list' 
    AND table_schema = 'public';

-- Show sample data if any exists
SELECT 
    'Sample Data' as info,
    COUNT(*) as row_count
FROM waiting_list;
