-- Diagnostic script to check database state
-- Run this to see what's currently in your database

-- Check if tables exist
SELECT 'Table existence check:' as info;
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ Exists' ELSE '❌ Missing' END as status
FROM information_schema.tables 
WHERE table_name IN ('teachers', 'groups', 'students', 'sessions', 'attendance', 'payments')
AND table_schema = 'public'
ORDER BY table_name;

-- Check table structures
SELECT 'Groups table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'groups' 
ORDER BY ordinal_position;

-- Check current data counts
SELECT 'Current data counts:' as info;
SELECT 
    'teachers' as table_name,
    COUNT(*) as record_count
FROM teachers
UNION ALL
SELECT 
    'groups' as table_name,
    COUNT(*) as record_count
FROM groups
UNION ALL
SELECT 
    'students' as table_name,
    COUNT(*) as record_count
FROM students
UNION ALL
SELECT 
    'sessions' as table_name,
    COUNT(*) as record_count
FROM sessions;

-- Check if groups table has SERIAL ID
SELECT 'Groups ID column type:' as info;
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'groups' 
AND column_name = 'id';

-- Check sequence (fixed column names)
SELECT 'Sequence check:' as info;
SELECT 
    sequence_name,
    start_value,
    minimum_value,
    maximum_value,
    increment
FROM information_schema.sequences 
WHERE sequence_name = 'groups_id_seq';

-- Check foreign key constraints
SELECT 'Foreign key constraints:' as info;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'students'
ORDER BY tc.table_name;

-- Check RLS policies
SELECT 'RLS policies:' as info;
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('teachers', 'groups', 'students', 'sessions')
ORDER BY tablename, policyname;

SELECT 'Diagnostic completed!' as status; 