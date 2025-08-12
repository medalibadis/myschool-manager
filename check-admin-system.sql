-- Quick check to verify admin system is working
-- Run this in your Supabase SQL Editor

-- Check if admins table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admins') 
        THEN '✅ Admins table exists' 
        ELSE '❌ Admins table does not exist - Run setup-admin-system.sql first' 
    END as status;

-- Check current admins
SELECT 
    username, 
    name, 
    role, 
    is_active,
    created_at
FROM admins 
ORDER BY role, username;

-- Check if we can insert a test admin (will be rolled back)
DO $$
BEGIN
    INSERT INTO admins (username, password_hash, name, email, role) 
    VALUES ('test_check', 'test_hash', 'Test Check', 'test@check.com', 'admin');
    
    RAISE NOTICE '✅ Insert test passed - admin system is working correctly';
    
    -- Rollback the test insert
    ROLLBACK;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Insert test failed: %', SQLERRM;
END $$; 