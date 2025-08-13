-- =====================================================
-- DIAGNOSE SUPABASE CONNECTION ISSUES
-- This script will help identify why data is not being saved
-- =====================================================

-- 1. Check if we can connect and see tables
SELECT 'CONNECTION TEST:' as info;
SELECT 'If you see this, basic connection works' as status;

-- 2. Check what tables exist
SELECT 'EXISTING TABLES:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 3. Check if we can read from tables
SELECT 'READ PERMISSIONS TEST:' as info;
SELECT 'Testing if we can read from existing tables...' as status;

-- Try to read from each table
DO $$
DECLARE
    table_name text;
    record_count integer;
BEGIN
    FOR table_name IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO record_count;
            RAISE NOTICE 'Table %: % records', table_name, record_count;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error reading from table %: %', table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 4. Check if we can write to tables
SELECT 'WRITE PERMISSIONS TEST:' as info;
SELECT 'Testing if we can write to tables...' as status;

-- Test insert into call_logs
DO $$
BEGIN
    BEGIN
        INSERT INTO call_logs (student_name, student_phone, call_date, call_time, notes, call_status)
        VALUES ('Connection Test', '+1234567890', CURRENT_DATE, CURRENT_TIME, 'Testing database connection')
        ON CONFLICT DO NOTHING;
        RAISE NOTICE 'SUCCESS: Can insert into call_logs';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR inserting into call_logs: %', SQLERRM;
    END;
    
    BEGIN
        INSERT INTO teachers (name, email, phone)
        VALUES ('Connection Test Teacher', 'test@connection.com', '+1234567890')
        ON CONFLICT (email) DO NOTHING;
        RAISE NOTICE 'SUCCESS: Can insert into teachers';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR inserting into teachers: %', SQLERRM;
    END;
END $$;

-- 5. Check Row Level Security (RLS) policies
SELECT 'RLS POLICIES:' as info;
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Check current user and permissions
SELECT 'CURRENT USER INFO:' as info;
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_database() as current_database,
    current_schema as current_schema;

-- 7. Check if RLS is enabled on tables
SELECT 'RLS STATUS:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 8. Test a simple operation that should work
SELECT 'FINAL CONNECTION TEST:' as info;
SELECT 'Testing basic operations...' as status;

-- Try to create a simple test table
DO $$
BEGIN
    BEGIN
        CREATE TEMP TABLE connection_test (
            id SERIAL PRIMARY KEY,
            test_value TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        INSERT INTO connection_test (test_value) VALUES ('Connection successful');
        
        SELECT test_value, created_at FROM connection_test;
        
        DROP TABLE connection_test;
        
        RAISE NOTICE 'SUCCESS: Basic database operations work';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR in basic operations: %', SQLERRM;
    END;
END $$;

-- 9. Final status
SELECT '🎯 DIAGNOSIS COMPLETE!' as message;
SELECT 'Check the results above to identify the connection issue.' as details;
