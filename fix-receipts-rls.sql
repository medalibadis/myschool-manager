-- Fix Receipts Table RLS Policies
-- This script updates the RLS policies to allow proper access

-- First, let's check if the receipts table exists
SELECT 
    'Receipts table status' as status,
    COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_name = 'receipts';

-- Check current RLS policies
SELECT 
    'Current RLS policies' as status,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'receipts';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view receipts" ON receipts;
DROP POLICY IF EXISTS "Allow authenticated users to insert receipts" ON receipts;
DROP POLICY IF EXISTS "Allow authenticated users to update receipts" ON receipts;
DROP POLICY IF EXISTS "Allow authenticated users to delete receipts" ON receipts;

-- Create more permissive RLS policies
CREATE POLICY "Allow authenticated users to view receipts" ON receipts
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert receipts" ON receipts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update receipts" ON receipts
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated users to delete receipts" ON receipts
    FOR DELETE USING (true);

-- Verify the new policies
SELECT 
    'Updated RLS policies' as status,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
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

SELECT 'RLS policies fixed successfully' as status;
