-- =====================================================
-- COMPLETE SUPABASE DATABASE SETUP
-- This file sets up the entire database for myschool_manager
-- Run this ONCE to restore all functionalities
-- =====================================================

-- Drop existing tables if they exist (WARNING: This will delete all data)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS student_groups CASCADE;
DROP TABLE IF EXISTS waiting_list CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS call_logs CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS groups_id_seq CASCADE;
DROP SEQUENCE IF EXISTS call_logs_id_seq CASCADE;

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Teachers table
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    specialization VARCHAR(255),
    hourly_rate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES teachers(id),
    language VARCHAR(100),
    level VARCHAR(100),
    category VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    max_students INTEGER DEFAULT 20,
    is_active BOOLEAN DEFAULT TRUE,
    is_frozen BOOLEAN DEFAULT FALSE,
    freeze_start_date DATE,
    freeze_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_id VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    age INTEGER,
    parent_name VARCHAR(255),
    parent_phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    registration_fee_paid BOOLEAN DEFAULT FALSE,
    registration_fee_amount DECIMAL(10,2) DEFAULT 0,
    registration_fee_group_id INTEGER,
    default_discount DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student-Groups junction table
CREATE TABLE student_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, group_id)
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    topic VARCHAR(255),
    notes TEXT,
    is_rescheduled BOOLEAN DEFAULT FALSE,
    original_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, session_number)
);

-- Attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id),
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    admin_name VARCHAR(255) DEFAULT 'Dalila',
    discount DECIMAL(10,2) DEFAULT 0,
    original_amount DECIMAL(10,2),
    payment_type VARCHAR(50) DEFAULT 'group_payment',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waiting List table
CREATE TABLE waiting_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    age INTEGER,
    parent_name VARCHAR(255),
    parent_phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    language VARCHAR(100),
    level VARCHAR(100),
    category VARCHAR(100),
    preferred_schedule VARCHAR(255),
    registration_fee_paid BOOLEAN DEFAULT FALSE,
    registration_fee_amount DECIMAL(10,2) DEFAULT 0,
    registration_fee_group_id INTEGER,
    default_discount DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call Logs table
CREATE TABLE call_logs (
    id SERIAL PRIMARY KEY,
    student_name VARCHAR(255),
    student_phone VARCHAR(50),
    call_date DATE DEFAULT CURRENT_DATE,
    call_time TIME DEFAULT CURRENT_TIME,
    call_duration INTEGER,
    call_status VARCHAR(50),
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- Teachers indexes
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(name);

-- Groups indexes
CREATE INDEX IF NOT EXISTS idx_groups_teacher_id ON groups(teacher_id);
CREATE INDEX IF NOT EXISTS idx_groups_language ON groups(language);
CREATE INDEX IF NOT EXISTS idx_groups_level ON groups(level);
CREATE INDEX IF NOT EXISTS idx_groups_category ON groups(category);
CREATE INDEX IF NOT EXISTS idx_groups_is_active ON groups(is_active);
CREATE INDEX IF NOT EXISTS idx_groups_start_date ON groups(start_date);

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_custom_id ON students(custom_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);

-- Student-Groups indexes
CREATE INDEX IF NOT EXISTS idx_student_groups_student_id ON student_groups(student_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_group_id ON student_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_status ON student_groups(status);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_group_id ON sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_session_number ON sessions(session_number);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_group_id ON payments(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_admin_name ON payments(admin_name);
CREATE INDEX IF NOT EXISTS idx_payments_discount ON payments(discount);
CREATE INDEX IF NOT EXISTS idx_payments_original_amount ON payments(original_amount);

-- Waiting List indexes
CREATE INDEX IF NOT EXISTS idx_waiting_list_language ON waiting_list(language);
CREATE INDEX IF NOT EXISTS idx_waiting_list_level ON waiting_list(level);
CREATE INDEX IF NOT EXISTS idx_waiting_list_category ON waiting_list(category);
CREATE INDEX IF NOT EXISTS idx_waiting_list_name ON waiting_list(name);

-- Call Logs indexes
CREATE INDEX IF NOT EXISTS idx_call_logs_student_name ON call_logs(student_name);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_date ON call_logs(call_date);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_status ON call_logs(call_status);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Teachers policies
CREATE POLICY "Allow public read access" ON teachers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON teachers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON teachers FOR DELETE USING (true);

-- Groups policies
CREATE POLICY "Allow public read access" ON groups FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON groups FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON groups FOR DELETE USING (true);

-- Students policies
CREATE POLICY "Allow public read access" ON students FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON students FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON students FOR DELETE USING (true);

-- Student-Groups policies
CREATE POLICY "Allow public read access" ON student_groups FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON student_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON student_groups FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON student_groups FOR DELETE USING (true);

-- Sessions policies
CREATE POLICY "Allow public read access" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON sessions FOR DELETE USING (true);

-- Attendance policies
CREATE POLICY "Allow public read access" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON attendance FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON attendance FOR DELETE USING (true);

-- Payments policies
CREATE POLICY "Allow public read access" ON payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON payments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON payments FOR DELETE USING (true);

-- Waiting List policies
CREATE POLICY "Allow public read access" ON waiting_list FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON waiting_list FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON waiting_list FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON waiting_list FOR DELETE USING (true);

-- Call Logs policies
CREATE POLICY "Allow public read access" ON call_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON call_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON call_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON call_logs FOR DELETE USING (true);

-- =====================================================
-- CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waiting_list_updated_at BEFORE UPDATE ON waiting_list FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate custom_id for students
CREATE OR REPLACE FUNCTION generate_custom_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.custom_id IS NULL THEN
        NEW.custom_id := 'ST' || LPAD(COALESCE((SELECT MAX(CAST(SUBSTRING(custom_id FROM 3) AS INTEGER)) FROM students WHERE custom_id ~ '^ST[0-9]+$'), 0) + 1::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for custom_id generation
CREATE TRIGGER generate_student_custom_id BEFORE INSERT ON students FOR EACH ROW EXECUTE FUNCTION generate_custom_id();

-- =====================================================
-- INSERT SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert a default teacher
INSERT INTO teachers (name, email, phone, specialization) 
VALUES ('Default Teacher', 'teacher@school.com', '+1234567890', 'General Education')
ON CONFLICT (email) DO NOTHING;

-- Insert a default group
INSERT INTO groups (name, description, teacher_id, language, level, category, price, total_sessions, start_date, max_students)
SELECT 
    'Sample Group', 
    'A sample group for testing', 
    t.id, 
    'English', 
    'Beginner', 
    'General', 
    100.00, 
    10, 
    CURRENT_DATE, 
    15
FROM teachers t 
WHERE t.email = 'teacher@school.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all tables were created
SELECT 'Tables created successfully:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('teachers', 'groups', 'students', 'student_groups', 'sessions', 'attendance', 'payments', 'waiting_list', 'call_logs')
ORDER BY table_name;

-- Check students table structure
SELECT 'Students table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Check payments table structure
SELECT 'Payments table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- Check waiting_list table structure
SELECT 'Waiting list table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'waiting_list' 
ORDER BY ordinal_position;

-- Check indexes
SELECT 'Indexes created:' as info;
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('teachers', 'groups', 'students', 'student_groups', 'sessions', 'attendance', 'payments', 'waiting_list', 'call_logs')
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 'RLS policies created:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- FINAL STATUS
-- =====================================================

SELECT '🎉 DATABASE SETUP COMPLETE! 🎉' as message;
SELECT 'All tables, columns, indexes, and policies have been created.' as details;
SELECT 'Your myschool_manager application should now work with full functionality.' as next_step;
