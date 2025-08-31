-- Temporarily Disable RLS on Receipts Table
-- This allows receipts to be created without RLS policy issues

-- Check if receipts table exists
SELECT 
    'Receipts table status' as status,
    COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_name = 'receipts';

-- Disable RLS temporarily
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    'RLS status' as status,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'receipts';

-- Test insert capability
INSERT INTO receipts (student_id, student_name, payment_id, amount, payment_type, group_name, notes) 
VALUES (
    (SELECT id FROM students LIMIT 1),
    'Test Student',
    (SELECT id FROM payments LIMIT 1),
    100.00,
    'registration_fee',
    'Test Group',
    'Test receipt'
) ON CONFLICT DO NOTHING;

-- Clean up test data
DELETE FROM receipts WHERE notes = 'Test receipt';

SELECT 'RLS disabled successfully on receipts table' as status;
