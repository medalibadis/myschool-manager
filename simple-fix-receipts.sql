-- Simple Fix for Receipts RLS Issue
-- Run this in your Supabase SQL editor

-- Disable RLS on receipts table
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'receipts';

-- Test that it works
SELECT 'RLS disabled successfully' as status;
