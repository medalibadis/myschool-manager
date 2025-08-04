-- Clear all tables data to start fresh testing
-- This script will delete all data from all tables while preserving table structure

-- First, let's check what sequences exist
SELECT sequence_name FROM information_schema.sequences 
WHERE sequence_schema = 'public' 
ORDER BY sequence_name;

-- Disable foreign key checks temporarily to avoid constraint issues
SET session_replication_role = replica;

-- Clear all tables in the correct order (child tables first, then parent tables)
DELETE FROM attendance;
DELETE FROM payments;
DELETE FROM students;
DELETE FROM sessions;
DELETE FROM groups;
DELETE FROM teachers;
DELETE FROM waiting_list;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset sequences to start from 1 (only if they exist)
DO $$
DECLARE
    seq_name text;
BEGIN
    -- Reset sequences that exist
    FOR seq_name IN 
        SELECT sequence_name FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq_name);
    END LOOP;
END $$;

-- Verify tables are empty
SELECT 
    'groups' as table_name, COUNT(*) as row_count FROM groups
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'teachers', COUNT(*) FROM teachers
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL
SELECT 'waiting_list', COUNT(*) FROM waiting_list
ORDER BY table_name; 