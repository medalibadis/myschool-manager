-- Simple test script to verify database setup
-- Run this after executing complete-database-setup.sql

-- First, let's check what tables exist and their current state
SELECT 'Checking current database state...' as info;

-- Check if tables exist
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ Exists' ELSE '❌ Missing' END as status
FROM information_schema.tables 
WHERE table_name IN ('teachers', 'groups', 'students', 'sessions', 'attendance', 'payments')
AND table_schema = 'public'
ORDER BY table_name;

-- Check current data in tables
SELECT 'Current teachers:' as info;
SELECT id, name, email FROM teachers;

SELECT 'Current groups:' as info;
SELECT id, name, teacher_id FROM groups;

SELECT 'Current students:' as info;
SELECT id, name, group_id FROM students;

-- Now let's create test data step by step
SELECT 'Creating test data...' as info;

-- Step 1: Create a teacher
INSERT INTO teachers (name, email, phone) 
VALUES ('Test Teacher', 'test@example.com', '+1234567890')
ON CONFLICT (email) DO NOTHING
RETURNING id, name, email;

-- Step 2: Create groups (should start from ID 1)
INSERT INTO groups (name, teacher_id, start_date, recurring_days, total_sessions) 
VALUES 
('English A1 - Kids', (SELECT id FROM teachers WHERE email = 'test@example.com'), '2024-01-15', ARRAY[1,3,5], 16),
('French B1 - Adults', (SELECT id FROM teachers WHERE email = 'test@example.com'), '2024-01-16', ARRAY[2,4], 12),
('Spanish A2 - Teens', (SELECT id FROM teachers WHERE email = 'test@example.com'), '2024-01-17', ARRAY[1,4], 20)
ON CONFLICT DO NOTHING
RETURNING id, name, teacher_id, start_date;

-- Step 3: Create students (only if groups exist)
INSERT INTO students (name, email, phone, group_id) 
SELECT 'Alice Johnson', 'alice@example.com', '+1111111111', id
FROM groups 
WHERE name = 'English A1 - Kids'
ON CONFLICT (email) DO NOTHING;

INSERT INTO students (name, email, phone, group_id) 
SELECT 'Bob Smith', 'bob@example.com', '+2222222222', id
FROM groups 
WHERE name = 'English A1 - Kids'
ON CONFLICT (email) DO NOTHING;

INSERT INTO students (name, email, phone, group_id) 
SELECT 'Carol Davis', 'carol@example.com', '+3333333333', id
FROM groups 
WHERE name = 'French B1 - Adults'
ON CONFLICT (email) DO NOTHING;

-- Step 4: Create sessions
INSERT INTO sessions (group_id, date) 
SELECT id, '2024-01-15'
FROM groups 
WHERE name = 'English A1 - Kids'
ON CONFLICT DO NOTHING;

INSERT INTO sessions (group_id, date) 
SELECT id, '2024-01-17'
FROM groups 
WHERE name = 'English A1 - Kids'
ON CONFLICT DO NOTHING;

INSERT INTO sessions (group_id, date) 
SELECT id, '2024-01-16'
FROM groups 
WHERE name = 'French B1 - Adults'
ON CONFLICT DO NOTHING;

-- Step 5: Verify the results
SELECT 'Final verification:' as info;

SELECT 'Groups created:' as info;
SELECT id, name FROM groups ORDER BY id;

SELECT 'Students created:' as info;
SELECT id, name, group_id FROM students ORDER BY id;

SELECT 'Sessions created:' as info;
SELECT id, group_id, date FROM sessions ORDER BY id;

-- Check sequence (fixed column names)
SELECT 'Sequence status:' as info;
SELECT 
    sequence_name,
    start_value,
    minimum_value,
    maximum_value,
    increment
FROM information_schema.sequences 
WHERE sequence_name = 'groups_id_seq';

SELECT 'Test completed successfully!' as status; 