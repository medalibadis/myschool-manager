-- Migration script to convert group IDs from UUID to sequential integers
-- WARNING: This will delete all existing data in the groups table and related tables
-- Only run this if you're okay with losing existing data

-- First, drop existing foreign key constraints
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_group_id_fkey;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_group_id_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_group_id_fkey;

-- Drop the existing groups table
DROP TABLE IF EXISTS groups CASCADE;

-- Recreate the groups table with SERIAL ID
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    recurring_days INTEGER[] NOT NULL,
    total_sessions INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update the students table to reference the new group ID type
ALTER TABLE students 
    ALTER COLUMN group_id TYPE INTEGER USING group_id::INTEGER;

-- Update the sessions table to reference the new group ID type
ALTER TABLE sessions 
    ALTER COLUMN group_id TYPE INTEGER USING group_id::INTEGER;

-- Update the payments table to reference the new group ID type
ALTER TABLE payments 
    ALTER COLUMN group_id TYPE INTEGER USING group_id::INTEGER;

-- Recreate foreign key constraints
ALTER TABLE students 
    ADD CONSTRAINT students_group_id_fkey 
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE sessions 
    ADD CONSTRAINT sessions_group_id_fkey 
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE payments 
    ADD CONSTRAINT payments_group_id_fkey 
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_groups_teacher_id ON groups(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_group_id ON students(group_id);
CREATE INDEX IF NOT EXISTS idx_sessions_group_id ON sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_group_id ON payments(group_id);

-- Enable RLS on the new groups table
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for groups
CREATE POLICY "Allow public read access" ON groups FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON groups FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON groups FOR DELETE USING (true);

-- Reset the sequence to start from 1
ALTER SEQUENCE groups_id_seq RESTART WITH 1; 