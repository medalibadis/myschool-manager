-- =====================================================
-- FIX STUDENTS TABLE FOR STUDENT CREATION - SIMPLIFIED
-- This fixes the students table without using ON CONFLICT
-- =====================================================

-- 1. Check current students table structure
SELECT 'CURRENT STUDENTS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- 2. Add missing columns that the code expects
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
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Check if student_groups junction table exists
SELECT 'CHECKING STUDENT_GROUPS TABLE:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'student_groups';

-- 4. Create student_groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS student_groups (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, group_id)
);

-- 5. Test inserting a student with the new structure (no ON CONFLICT)
SELECT 'TESTING STUDENT INSERT:' as info;

-- Try to insert a test student (simple insert without conflict handling)
INSERT INTO students (
    name, 
    email, 
    phone, 
    address, 
    birth_date, 
    parent_name, 
    second_phone, 
    total_paid, 
    default_discount
) VALUES (
    'Test Student for Groups', 
    'test@student.com', 
    '+1234567890', 
    'Test Address', 
    '2000-01-01', 
    'Test Parent', 
    '+0987654321', 
    0.00, 
    0.00
);

-- 6. Verify the test student was inserted
SELECT 'VERIFYING TEST STUDENT:' as info;
SELECT * FROM students WHERE name = 'Test Student for Groups';

-- 7. Show final students table structure
SELECT 'FINAL STUDENTS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- 8. Final status
SELECT '🎉 STUDENTS TABLE FIXED!' as message;
SELECT 'Now you can create students and add them to groups.' as details;
SELECT 'Try launching your group again!' as next_step;
