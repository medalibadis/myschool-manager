-- Complete Database Setup Script
-- This script will drop all existing tables and recreate them with proper structure
-- WARNING: This will delete ALL existing data

-- Drop all existing tables in the correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS waiting_list CASCADE;

-- Drop existing enum types if they exist
DROP TYPE IF EXISTS language_type CASCADE;
DROP TYPE IF EXISTS level_type CASCADE;
DROP TYPE IF EXISTS category_type CASCADE;

-- Create enum types for language, level, and category
CREATE TYPE language_type AS ENUM (
    'English', 'French', 'Spanish', 'German', 'Italian', 'Arabic', 'Chinese', 'Japanese', 'Korean', 'Russian', 'Portuguese', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian', 'Romanian', 'Bulgarian', 'Croatian', 'Serbian', 'Slovenian', 'Slovak', 'Estonian', 'Latvian', 'Lithuanian', 'Greek', 'Turkish', 'Hebrew', 'Hindi', 'Urdu', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Sinhala', 'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Filipino', 'other'
);

CREATE TYPE level_type AS ENUM (
    'Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced', 'Proficient', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'A1+', 'A2+', 'B1+', 'B2+', 'C1+', 'other'
);

CREATE TYPE category_type AS ENUM (
    'Children', 'Teenagers', 'Adults', 'Seniors', 'Business', 'Academic', 'Conversation', 'Grammar', 'Writing', 'Reading', 'Listening', 'Speaking', 'Exam Preparation', 'TOEFL', 'IELTS', 'TOEIC', 'Cambridge', 'DELF', 'DALF', 'DELE', 'TestDaF', 'Goethe', 'HSK', 'JLPT', 'TOPIK', 'other'
);

-- Create teachers table
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create groups table with SERIAL ID (starts from 1 and increments)
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    recurring_days INTEGER[] NOT NULL,
    total_sessions INTEGER NOT NULL,
    language language_type,
    level level_type,
    category category_type,
    price DECIMAL(10,2),
    start_time TIME,
    end_time TIME,
    custom_language VARCHAR(100),
    custom_level VARCHAR(100),
    custom_category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    birth_date DATE,
    price_per_session DECIMAL(10,2),
    total_paid DECIMAL(10,2) DEFAULT 0,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    parent_name VARCHAR(255),
    second_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table (using 'date' column to match application expectations)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table (using 'status' string to match application expectations)
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- Create payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waiting_list table
CREATE TABLE waiting_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    birth_date DATE,
    language language_type NOT NULL,
    level level_type NOT NULL,
    category category_type NOT NULL,
    notes TEXT,
    parent_name VARCHAR(255),
    second_phone VARCHAR(20),
    custom_language VARCHAR(100),
    custom_level VARCHAR(100),
    custom_category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_groups_teacher_id ON groups(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_group_id ON students(group_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_sessions_group_id ON sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_group_id ON payments(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);

-- Create indexes for waiting_list table
CREATE INDEX IF NOT EXISTS idx_waiting_list_language ON waiting_list(language);
CREATE INDEX IF NOT EXISTS idx_waiting_list_level ON waiting_list(level);
CREATE INDEX IF NOT EXISTS idx_waiting_list_category ON waiting_list(category);
CREATE INDEX IF NOT EXISTS idx_waiting_list_email ON waiting_list(email);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for teachers
CREATE POLICY "Allow public read access" ON teachers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON teachers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON teachers FOR DELETE USING (true);

-- Create RLS policies for groups
CREATE POLICY "Allow public read access" ON groups FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON groups FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON groups FOR DELETE USING (true);

-- Create RLS policies for students
CREATE POLICY "Allow public read access" ON students FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON students FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON students FOR DELETE USING (true);

-- Create RLS policies for sessions
CREATE POLICY "Allow public read access" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON sessions FOR DELETE USING (true);

-- Create RLS policies for attendance
CREATE POLICY "Allow public read access" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON attendance FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON attendance FOR DELETE USING (true);

-- Create RLS policies for payments
CREATE POLICY "Allow public read access" ON payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON payments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON payments FOR DELETE USING (true);

-- Enable RLS and create policies for waiting_list
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON waiting_list FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON waiting_list FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON waiting_list FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON waiting_list FOR DELETE USING (true);

-- Reset the groups sequence to start from 1
ALTER SEQUENCE groups_id_seq RESTART WITH 1;

-- Insert some sample data (optional)
-- INSERT INTO teachers (name, email, phone) VALUES 
-- ('John Doe', 'john@example.com', '+1234567890'),
-- ('Jane Smith', 'jane@example.com', '+0987654321');

-- Verify the setup
SELECT 'Database setup completed successfully!' as status;
SELECT 'Groups will start from ID 1 and increment sequentially' as note; 