-- Add Teacher Attendance Table for Teacher Evaluations
-- This table stores teacher attendance records for each session

CREATE TABLE IF NOT EXISTS teacher_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'late', 'absent', 'sick', 'justified')),
    notes TEXT,
    evaluated_by UUID REFERENCES teachers(id), -- Admin who evaluated the teacher
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, session_id) -- One evaluation per teacher per session
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_teacher_id ON teacher_attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_session_id ON teacher_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_group_id ON teacher_attendance(group_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON teacher_attendance(date);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_status ON teacher_attendance(status);

-- Add RLS policies for teacher attendance
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read teacher attendance
CREATE POLICY "Allow authenticated users to read teacher attendance" ON teacher_attendance
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert teacher attendance
CREATE POLICY "Allow authenticated users to insert teacher attendance" ON teacher_attendance
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update teacher attendance
CREATE POLICY "Allow authenticated users to update teacher attendance" ON teacher_attendance
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete teacher attendance
CREATE POLICY "Allow authenticated users to delete teacher attendance" ON teacher_attendance
    FOR DELETE USING (auth.role() = 'authenticated');
