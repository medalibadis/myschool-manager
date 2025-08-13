-- =====================================================
-- FIX GROUPS TABLE MISSING COLUMNS
-- This adds the missing columns needed for group creation
-- =====================================================

-- 1. Check current groups table structure
SELECT 'CURRENT GROUPS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'groups' 
ORDER BY ordinal_position;

-- 2. Add missing columns that the code expects
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
ALTER TABLE groups ADD COLUMN IF NOT EXISTS freeze_start_date DATE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS freeze_end_date DATE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Test inserting a group with the new structure
SELECT 'TESTING GROUP INSERT:' as info;

-- First, ensure we have at least one teacher
INSERT INTO teachers (name, email, phone) 
VALUES ('Test Teacher for Groups', 'test@groups.com', '+1234567890')
ON CONFLICT (email) DO NOTHING;

-- Try to insert a test group
INSERT INTO groups (
    name, 
    teacher_id, 
    start_date, 
    recurring_days, 
    total_sessions,
    language,
    level,
    category,
    price,
    start_time,
    end_time
) VALUES (
    'Test Group', 
    (SELECT id FROM teachers WHERE email = 'test@groups.com' LIMIT 1), 
    CURRENT_DATE, 
    '{1,3,5}', 
    16,
    'English',
    'Beginner',
    'Adults',
    100.00,
    '09:00:00',
    '11:00:00'
) ON CONFLICT DO NOTHING;

-- 4. Verify the test group was inserted
SELECT 'VERIFYING TEST GROUP:' as info;
SELECT * FROM groups WHERE name = 'Test Group';

-- 5. Show final structure
SELECT 'FINAL GROUPS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'groups' 
ORDER BY ordinal_position;

-- 6. Final status
SELECT '🎉 GROUPS TABLE FIXED!' as message;
SELECT 'Now you can create groups with all required fields.' as details;
SELECT 'Try launching your group again!' as next_step;
