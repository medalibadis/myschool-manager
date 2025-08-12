-- Test script to verify admin system setup
-- Run this after running supabase-auth-setup.sql

-- Check if admins table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admins') 
        THEN '✅ Admins table exists' 
        ELSE '❌ Admins table does not exist' 
    END as table_status;

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admins' 
ORDER BY ordinal_position;

-- Check if initial admins exist
SELECT 
    username, 
    name, 
    role, 
    is_active,
    CASE 
        WHEN username = 'raouf' THEN '✅ Raouf (superuser) found'
        WHEN username = 'dalila' THEN '✅ Dalila (admin) found'
        ELSE '❌ Unexpected admin: ' || username
    END as status
FROM admins 
ORDER BY role, username;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'admins';

-- Test insert capability (this should work if setup is correct)
-- Note: This will fail if the table doesn't exist or RLS is blocking it
DO $$
BEGIN
    -- Try to insert a test admin (will be rolled back)
    INSERT INTO admins (username, password_hash, name, email, role) 
    VALUES ('test_admin', 'test_hash', 'Test Admin', 'test@example.com', 'admin');
    
    -- If we get here, the insert worked
    RAISE NOTICE '✅ Insert test passed - admin system is working correctly';
    
    -- Rollback the test insert
    ROLLBACK;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Insert test failed: %', SQLERRM;
END $$; 