-- Simple Teacher Salary System Setup
-- Run this in your Supabase SQL editor
-- This script is safe to run multiple times

-- 1. Add price_per_session field to teachers table (if not exists)
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS price_per_session DECIMAL(10,2) DEFAULT 1000.00;

-- 2. Create teacher_salaries table for payment history
CREATE TABLE IF NOT EXISTS teacher_salaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    total_sessions INTEGER NOT NULL,
    present_sessions INTEGER DEFAULT 0,
    late_sessions INTEGER DEFAULT 0,
    absent_sessions INTEGER DEFAULT 0,
    justified_sessions INTEGER DEFAULT 0,
    calculated_salary DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_salaries_teacher_id ON teacher_salaries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_salaries_group_id ON teacher_salaries(group_id);
CREATE INDEX IF NOT EXISTS idx_teacher_salaries_payment_date ON teacher_salaries(payment_date);

-- 4. Enable RLS on teacher_salaries table
ALTER TABLE teacher_salaries ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to view teacher salaries" ON teacher_salaries;
DROP POLICY IF EXISTS "Allow authenticated users to insert teacher salaries" ON teacher_salaries;
DROP POLICY IF EXISTS "Allow authenticated users to update teacher salaries" ON teacher_salaries;

-- 6. Create RLS policies for teacher_salaries
CREATE POLICY "Allow authenticated users to view teacher salaries" ON teacher_salaries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert teacher salaries" ON teacher_salaries
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update teacher salaries" ON teacher_salaries
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 7. Update existing teachers to have a default price per session
UPDATE teachers 
SET price_per_session = 1000.00 
WHERE price_per_session IS NULL OR price_per_session = 0;

-- 8. Verify the setup
SELECT 'Teacher salary system setup completed successfully!' as status;
SELECT COUNT(*) as teachers_count FROM teachers;
SELECT COUNT(*) as groups_count FROM groups;
