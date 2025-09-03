-- Test RLS policies and table access for waiting_list
-- Run this in Supabase SQL Editor

-- 1. Check if the table exists and has data
SELECT 
    'Table exists check' as check_type,
    COUNT(*) as total_rows
FROM waiting_list;

-- 2. Check RLS policies on waiting_list table
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
WHERE tablename = 'waiting_list';

-- 3. Check if RLS is enabled on the table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'waiting_list';

-- 4. Test a simple query with explicit schema
SELECT 
    'Simple query test' as check_type,
    COUNT(*) as total_rows
FROM public.waiting_list;

-- 5. Check current user and permissions
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_database() as current_database;

-- 6. Test query with different user context
-- This simulates what the client might see
SELECT 
    'Client context test' as check_type,
    COUNT(*) as total_rows
FROM waiting_list 
WHERE true; -- This should trigger RLS policies
