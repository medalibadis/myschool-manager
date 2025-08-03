-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    recurring_days INTEGER[] NOT NULL,
    total_sessions INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    birth_date DATE,
    price_per_session DECIMAL(10,2),
    total_paid DECIMAL(10,2) DEFAULT 0,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attended BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_teacher_id ON groups(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_group_id ON students(group_id);
CREATE INDEX IF NOT EXISTS idx_sessions_group_id ON sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_group_id ON payments(group_id);

-- Enable Row Level Security (RLS)
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these based on your authentication needs)
CREATE POLICY "Allow public read access" ON teachers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON teachers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON teachers FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON groups FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON groups FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON groups FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON students FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON students FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON students FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON sessions FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON attendance FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON attendance FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON payments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON payments FOR DELETE USING (true); 