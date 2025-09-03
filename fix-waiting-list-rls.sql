-- Fix RLS policies for waiting_list table
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to view waiting list" ON waiting_list;
DROP POLICY IF EXISTS "Allow authenticated users to insert waiting list" ON waiting_list;
DROP POLICY IF EXISTS "Allow authenticated users to update waiting list" ON waiting_list;
DROP POLICY IF EXISTS "Allow authenticated users to delete waiting list" ON waiting_list;

-- Create more permissive policies for development/testing
CREATE POLICY "Allow all users to view waiting list" ON waiting_list
    FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert waiting list" ON waiting_list
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update waiting list" ON waiting_list
    FOR UPDATE USING (true);

CREATE POLICY "Allow all users to delete waiting list" ON waiting_list
    FOR DELETE USING (true);

-- Verify the policies were created
SELECT 
    'Policies Updated' as status,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'waiting_list';

-- Test the access
SELECT 
    'Access Test' as status,
    COUNT(*) as total_rows
FROM waiting_list;

SELECT '✅ RLS policies updated! waiting_list should now be accessible.' as final_status;
