-- Performance Optimization Indexes for MySchool Manager
-- Run this in your Supabase SQL Editor to speed up database queries

-- 1. Index student_groups table for fast lookups by student, group, and status
CREATE INDEX IF NOT EXISTS idx_student_groups_student_id ON student_groups(student_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_group_id ON student_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_status ON student_groups(status);
CREATE INDEX IF NOT EXISTS idx_student_groups_composite ON student_groups(group_id, student_id, status);

-- 2. Index payments table for balance and group queries
CREATE INDEX IF NOT EXISTS idx_payments_student_group ON payments(student_id, group_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date DESC);

-- 3. Index attendance table for fast session/student checks
CREATE INDEX IF NOT EXISTS idx_attendance_session_student ON attendance(session_id, student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- 4. Index sessions table for fast group lookups and ordering
CREATE INDEX IF NOT EXISTS idx_sessions_group_date ON sessions(group_id, date);

-- 5. Index students table
CREATE INDEX IF NOT EXISTS idx_students_custom_id ON students(custom_id);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
