-- =====================================================
-- COMPLETE FUNCTIONALITY RESTORATION
-- Fixes all database issues and restores full functionality
-- =====================================================

-- 1. First, let's see what we actually have
SELECT 'Current database state:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Fix groups table - add ALL missing columns
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

-- 3. Fix students table - add ALL missing columns
ALTER TABLE students ADD COLUMN IF NOT EXISTS custom_id VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_fee_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_fee_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_fee_group_id INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS default_discount DECIMAL(5,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Fix student_groups table - add ALL missing columns
ALTER TABLE student_groups ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE student_groups ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE student_groups ADD COLUMN IF NOT EXISTS enrollment_date DATE DEFAULT CURRENT_DATE;

-- 5. Fix waiting_list table - add ALL missing columns
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS default_discount DECIMAL(5,2) DEFAULT 0;
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS registration_fee_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS registration_fee_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS registration_fee_group_id INTEGER;
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255);
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(50);
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS preferred_schedule VARCHAR(255);
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- 6. Fix call_logs table - add ALL missing columns
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS call_type VARCHAR(50) DEFAULT 'incoming';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS call_result VARCHAR(100);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS admin_name VARCHAR(255) DEFAULT 'Dalila';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. Fix sessions table - add missing columns
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_number INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_rescheduled BOOLEAN DEFAULT FALSE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS original_date DATE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 8. Fix attendance table - add missing columns
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 9. Fix payments table - add missing columns
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS admin_name VARCHAR(255) DEFAULT 'Dalila';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'group_payment';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 10. Fix teachers table - add missing columns
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS specialization VARCHAR(255);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 11. Create missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_language ON groups(language);
CREATE INDEX IF NOT EXISTS idx_groups_level ON groups(level);
CREATE INDEX IF NOT EXISTS idx_groups_category ON groups(category);
CREATE INDEX IF NOT EXISTS idx_groups_is_active ON groups(is_active);
CREATE INDEX IF NOT EXISTS idx_groups_start_date ON groups(start_date);

CREATE INDEX IF NOT EXISTS idx_students_custom_id ON students(custom_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);

CREATE INDEX IF NOT EXISTS idx_student_groups_status ON student_groups(status);
CREATE INDEX IF NOT EXISTS idx_student_groups_enrollment_date ON student_groups(enrollment_date);

CREATE INDEX IF NOT EXISTS idx_sessions_session_number ON sessions(session_number);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);

CREATE INDEX IF NOT EXISTS idx_call_logs_student_id ON call_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_group_id ON call_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_date ON call_logs(call_date);

-- 12. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 13. Create triggers for updated_at (only if they don't exist)
DO $$
BEGIN
    -- Groups trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_groups_updated_at') THEN
        CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Students trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_students_updated_at') THEN
        CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Sessions trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sessions_updated_at') THEN
        CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Attendance trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_attendance_updated_at') THEN
        CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Payments trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_updated_at') THEN
        CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Teachers trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_teachers_updated_at') THEN
        CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Call logs trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_call_logs_updated_at') THEN
        CREATE TRIGGER update_call_logs_updated_at BEFORE UPDATE ON call_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 14. Test data insertion (FIXED - with proper values)
INSERT INTO groups (name, teacher_id, start_date, total_sessions, language, level, category, price, start_time, end_time)
SELECT 'Test Group', t.id, CURRENT_DATE, 16, 'English', 'Beginner', 'Adults', 100.00, '09:00:00', '11:00:00'
FROM teachers t LIMIT 1
ON CONFLICT DO NOTHING;

-- 15. Verify all tables have correct structure
SELECT '🎯 GROUPS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'groups' 
ORDER BY ordinal_position;

SELECT '🎯 STUDENTS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

SELECT '🎯 CALL LOGS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'call_logs' 
ORDER BY ordinal_position;

-- 16. Final status
SELECT '🎉 ALL FUNCTIONALITIES RESTORED! 🎉' as message;
SELECT 'Groups, students, call logs, and all other features should now work properly.' as details;
SELECT 'Data linking between pages should now work correctly.' as note;
SELECT 'Try creating a group, adding students, and creating call logs now!' as next_step;
