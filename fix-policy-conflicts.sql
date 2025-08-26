-- Fix Policy Conflicts Script
-- Run this to resolve the "policy already exists" error

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public access" ON student_groups;
DROP POLICY IF EXISTS "Allow public access" ON attendance;
DROP POLICY IF EXISTS "Allow public access" ON stop_reasons;
DROP POLICY IF EXISTS "Allow public access" ON refund_requests;
DROP POLICY IF EXISTS "Allow public access" ON call_logs;
DROP POLICY IF EXISTS "Allow public access" ON unpaid_balances;

-- Verify policies were dropped
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
WHERE policyname = 'Allow public access' 
AND tablename IN ('student_groups', 'attendance', 'stop_reasons', 'refund_requests', 'call_logs', 'unpaid_balances');

SELECT 'Policy conflicts resolved successfully!' as status;
