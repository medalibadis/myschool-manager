-- =====================================================
-- FIX GROUPS AND STUDENTS FETCHING - CLEAN VERSION
-- This script fixes the "Error fetching students: {}" issue in groups page
-- =====================================================

-- 1. Check current database structure
SELECT 'CHECKING CURRENT DATABASE STRUCTURE:' as info;

-- Check if student_groups table exists
SELECT 'STUDENT_GROUPS TABLE:' as table_name;
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'student_groups';

-- Check groups table structure
SELECT 'GROUPS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'groups'
ORDER BY ordinal_position;

-- Check students table structure
SELECT 'STUDENTS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'students'
ORDER BY ordinal_position;

-- 2. Create student_groups junction table if it doesn't exist
SELECT 'CREATING STUDENT_GROUPS TABLE:' as info;

CREATE TABLE IF NOT EXISTS student_groups (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, group_id)
);

-- 3. Add missing columns to groups table
SELECT 'ADDING MISSING COLUMNS TO GROUPS:' as info;

ALTER TABLE groups ADD COLUMN IF NOT EXISTS recurring_days INTEGER[] DEFAULT '{1}';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS language VARCHAR(100);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS level VARCHAR(100);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS custom_language VARCHAR(100);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS custom_level VARCHAR(100);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS custom_category VARCHAR(100);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 20;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS freeze_date DATE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS unfreeze_date DATE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Add missing columns to students table
SELECT 'ADDING MISSING COLUMNS TO STUDENTS:' as info;

ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS second_phone VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS default_discount DECIMAL(5,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_fee_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_fee_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_fee_group_id INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS price_per_session DECIMAL(10,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS custom_id VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Create indexes for better performance
SELECT 'CREATING INDEXES:' as info;

CREATE INDEX IF NOT EXISTS idx_student_groups_student_id ON student_groups(student_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_group_id ON student_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_students_custom_id ON students(custom_id);
CREATE INDEX IF NOT EXISTS idx_groups_teacher_id ON groups(teacher_id);

-- 6. Clean up existing triggers and create updated_at triggers
SELECT 'CLEANING UP TRIGGERS:' as info;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_student_groups_updated_at ON student_groups;
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;

-- Function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_student_groups_updated_at
    BEFORE UPDATE ON student_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Test the setup with sample data
SELECT 'TESTING SETUP:' as info;

-- Insert a test group if none exists
INSERT INTO groups (
    name,
    start_date,
    total_sessions,
    recurring_days,
    language,
    level,
    category,
    price
) VALUES (
    'Test Group for Students',
    CURRENT_DATE,
    16,
    '{1,3,5}',
    'English',
    'Beginner',
    'Adults',
    100.00
) ON CONFLICT DO NOTHING;

-- Get the test group ID
DO $$
DECLARE
    test_group_id INTEGER;
BEGIN
    SELECT id INTO test_group_id FROM groups WHERE name = 'Test Group for Students' LIMIT 1;
    
    IF test_group_id IS NOT NULL THEN
        -- Insert a test student
        INSERT INTO students (
            name,
            email,
            phone,
            custom_id,
            price_per_session,
            total_paid
        ) VALUES (
            'Test Student for Groups',
            'test@student.com',
            '+1234567890',
            'ST0001',
            10.00,
            0.00
        ) ON CONFLICT DO NOTHING;
        
        -- Link student to group
        INSERT INTO student_groups (
            student_id,
            group_id,
            status
        ) VALUES (
            (SELECT id FROM students WHERE name = 'Test Student for Groups' LIMIT 1),
            test_group_id,
            'active'
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Test data inserted successfully. Group ID: %, Student linked to group.', test_group_id;
    END IF;
END $$;

-- 8. Verify the setup
SELECT 'VERIFYING SETUP:' as info;

-- Check groups with students
SELECT 'GROUPS WITH STUDENTS:' as info;
SELECT 
    g.id,
    g.name,
    COUNT(sg.student_id) as student_count
FROM groups g
LEFT JOIN student_groups sg ON g.id = sg.group_id
GROUP BY g.id, g.name
ORDER BY g.id;

-- Check student_groups table
SELECT 'STUDENT_GROUPS DATA:' as info;
SELECT 
    sg.id,
    sg.student_id,
    sg.group_id,
    sg.status,
    s.name as student_name,
    g.name as group_name
FROM student_groups sg
JOIN students s ON sg.student_id = s.id
JOIN groups g ON sg.group_id = g.id
ORDER BY sg.id;

-- 9. Final status
SELECT '🎉 GROUPS AND STUDENTS FETCHING FIXED!' as message;
SELECT 'The groups page should now load students properly.' as details;
SELECT 'Try refreshing your groups page!' as next_step;
