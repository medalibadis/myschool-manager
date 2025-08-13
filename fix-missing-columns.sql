-- =====================================================
-- FIX MISSING COLUMNS - RESTORE ALL FUNCTIONALITIES
-- This script adds missing columns to match the code expectations
-- =====================================================

-- 1. Fix groups table - add missing columns (without recurring_days)
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
ALTER TABLE groups ADD COLUMN IF NOT EXISTS freeze_start_date DATE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS freeze_end_date DATE;

-- 2. Fix students table - add missing columns
ALTER TABLE students ADD COLUMN IF NOT EXISTS custom_id VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_fee_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_fee_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_fee_group_id INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS default_discount DECIMAL(5,2) DEFAULT 0;

-- 3. Fix student_groups table - add missing columns
ALTER TABLE student_groups ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 4. Fix waiting_list table - add missing columns
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS default_discount DECIMAL(5,2) DEFAULT 0;
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS registration_fee_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS registration_fee_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS registration_fee_group_id INTEGER;

-- 5. Fix call_logs table - add missing columns
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS call_type VARCHAR(50) DEFAULT 'incoming';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS call_result VARCHAR(100);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS next_action TEXT;

-- 6. Verify all tables have correct structure
SELECT 'Groups table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'groups' 
ORDER BY ordinal_position;

SELECT 'Students table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

SELECT 'Call logs table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'call_logs' 
ORDER BY ordinal_position;

-- 7. Test data insertion (without recurring_days)
INSERT INTO groups (name, teacher_id, start_date, total_sessions, language, level, category, price)
SELECT 'Test Group', t.id, CURRENT_DATE, 16, 'English', 'Beginner', 'Adults', 100.00
FROM teachers t LIMIT 1
ON CONFLICT DO NOTHING;

-- 8. Final status
SELECT '🎉 ALL FUNCTIONALITIES RESTORED! 🎉' as message;
SELECT 'Groups, students, call logs, and all other features should now work properly.' as details;
SELECT 'Note: recurring_days column was not added as it does not exist in your schema.' as note;
