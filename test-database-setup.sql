-- Test script to verify database setup
-- Run this after executing complete-database-setup.sql

-- 1. Test inserting a teacher
INSERT INTO teachers (name, email, phone) 
VALUES ('Test Teacher', 'test@example.com', '+1234567890')
RETURNING id, name, email;

-- 2. Test inserting groups (should start from ID 1)
INSERT INTO groups (name, teacher_id, start_date, recurring_days, total_sessions) 
VALUES 
('English A1 - Kids', (SELECT id FROM teachers WHERE email = 'test@example.com'), '2024-01-15', ARRAY[1,3,5], 16),
('French B1 - Adults', (SELECT id FROM teachers WHERE email = 'test@example.com'), '2024-01-16', ARRAY[2,4], 12),
('Spanish A2 - Teens', (SELECT id FROM teachers WHERE email = 'test@example.com'), '2024-01-17', ARRAY[1,4], 20)
RETURNING id, name, teacher_id, start_date;

-- 3. Test inserting students
INSERT INTO students (name, email, phone, group_id) 
VALUES 
('Alice Johnson', 'alice@example.com', '+1111111111', 1),
('Bob Smith', 'bob@example.com', '+2222222222', 1),
('Carol Davis', 'carol@example.com', '+3333333333', 2)
RETURNING id, name, email, group_id;

-- 4. Test inserting sessions (using 'date' column)
INSERT INTO sessions (group_id, date) 
VALUES 
(1, '2024-01-15'),
(1, '2024-01-17'),
(1, '2024-01-19'),
(2, '2024-01-16'),
(2, '2024-01-18')
RETURNING id, group_id, date;

-- 5. Test inserting attendance records
INSERT INTO attendance (session_id, student_id, attended) 
VALUES 
((SELECT id FROM sessions WHERE group_id = 1 AND date = '2024-01-15'), (SELECT id FROM students WHERE name = 'Alice Johnson'), true),
((SELECT id FROM sessions WHERE group_id = 1 AND date = '2024-01-15'), (SELECT id FROM students WHERE name = 'Bob Smith'), false),
((SELECT id FROM sessions WHERE group_id = 1 AND date = '2024-01-17'), (SELECT id FROM students WHERE name = 'Alice Johnson'), true)
RETURNING id, session_id, student_id, attended;

-- 6. Verify the sequence is working correctly
SELECT 'Current groups:' as info;
SELECT id, name FROM groups ORDER BY id;

SELECT 'Group ID sequence verification:' as info;
SELECT 
    id,
    name,
    CASE 
        WHEN id = 1 THEN '✅ First group (ID 1)'
        WHEN id = 2 THEN '✅ Second group (ID 2)'
        WHEN id = 3 THEN '✅ Third group (ID 3)'
        ELSE '❌ Unexpected ID: ' || id
    END as verification
FROM groups 
ORDER BY id;

-- 7. Test the sequence counter (fixed column names)
SELECT 'Sequence counter:' as info;
SELECT 
    sequence_name,
    last_value,
    start_value,
    increment
FROM information_schema.sequences 
WHERE sequence_name = 'groups_id_seq';

-- 8. Clean up test data (optional)
-- DELETE FROM attendance WHERE session_id IN (SELECT id FROM sessions WHERE group_id IN (SELECT id FROM groups WHERE name LIKE 'Test%'));
-- DELETE FROM sessions WHERE group_id IN (SELECT id FROM groups WHERE name LIKE 'Test%');
-- DELETE FROM students WHERE group_id IN (SELECT id FROM groups WHERE name LIKE 'Test%');
-- DELETE FROM groups WHERE name LIKE 'Test%';
-- DELETE FROM teachers WHERE email = 'test@example.com'; 