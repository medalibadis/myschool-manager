-- Teacher Salary Management System
-- This script adds salary tracking capabilities to the existing system

-- 1. Add price_per_session field to teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS price_per_session DECIMAL(10,2) DEFAULT 0.00;

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

-- 5. Create RLS policies for teacher_salaries
CREATE POLICY "Allow authenticated users to view teacher salaries" ON teacher_salaries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert teacher salaries" ON teacher_salaries
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update teacher salaries" ON teacher_salaries
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. Create function to calculate group salary for a teacher
CREATE OR REPLACE FUNCTION calculate_teacher_group_salary(
    p_teacher_id UUID,
    p_group_id INTEGER
) RETURNS TABLE(
    total_sessions INTEGER,
    present_sessions INTEGER,
    late_sessions INTEGER,
    absent_sessions INTEGER,
    justified_sessions INTEGER,
    calculated_salary DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH session_counts AS (
        SELECT 
            COUNT(*) as total_sessions,
            COUNT(CASE WHEN ta.status = 'present' THEN 1 END) as present_sessions,
            COUNT(CASE WHEN ta.status = 'late' THEN 1 END) as late_sessions,
            COUNT(CASE WHEN ta.status = 'absent' THEN 1 END) as absent_sessions,
            COUNT(CASE WHEN ta.status = 'justified' THEN 1 END) as justified_sessions
        FROM sessions s
        LEFT JOIN teacher_attendance ta ON s.id = ta.session_id AND ta.teacher_id = p_teacher_id
        WHERE s.group_id = p_group_id
    ),
    salary_calc AS (
        SELECT 
            sc.*,
            t.price_per_session,
            (sc.present_sessions * t.price_per_session) - 
            (sc.late_sessions * 200) - 
            (sc.absent_sessions * 500) as calculated_salary
        FROM session_counts sc
        CROSS JOIN teachers t
        WHERE t.id = p_teacher_id
    )
    SELECT 
        sc.total_sessions,
        sc.present_sessions,
        sc.late_sessions,
        sc.absent_sessions,
        sc.justified_sessions,
        COALESCE(sc2.calculated_salary, 0) as calculated_salary
    FROM session_counts sc
    LEFT JOIN salary_calc sc2 ON true;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to get unpaid groups for a teacher
CREATE OR REPLACE FUNCTION get_teacher_unpaid_groups(p_teacher_id UUID)
RETURNS TABLE(
    group_id INTEGER,
    group_name TEXT,
    total_sessions INTEGER,
    present_sessions INTEGER,
    late_sessions INTEGER,
    absent_sessions INTEGER,
    justified_sessions INTEGER,
    calculated_salary DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id as group_id,
        g.name as group_name,
        sc.total_sessions,
        sc.present_sessions,
        sc.late_sessions,
        sc.absent_sessions,
        sc.justified_sessions,
        sc.calculated_salary
    FROM groups g
    CROSS JOIN LATERAL calculate_teacher_group_salary(p_teacher_id, g.id) sc
    WHERE g.id IN (
        SELECT DISTINCT s.group_id 
        FROM sessions s 
        WHERE s.group_id IN (
            SELECT DISTINCT ta.group_id 
            FROM teacher_attendance ta 
            WHERE ta.teacher_id = p_teacher_id
        )
    )
    AND sc.calculated_salary > 0
    AND g.id NOT IN (
        SELECT DISTINCT ts.group_id 
        FROM teacher_salaries ts 
        WHERE ts.teacher_id = p_teacher_id
    )
    ORDER BY g.name;
END;
$$ LANGUAGE plpgsql;

-- 8. Update existing teachers to have a default price per session
UPDATE teachers 
SET price_per_session = 1000.00 
WHERE price_per_session IS NULL OR price_per_session = 0;

-- 9. Add comments for documentation
COMMENT ON TABLE teacher_salaries IS 'Stores payment history for teacher salaries';
COMMENT ON COLUMN teachers.price_per_session IS 'Amount paid per session for this teacher';
COMMENT ON COLUMN teacher_salaries.calculated_salary IS 'Salary calculated based on attendance';
COMMENT ON COLUMN teacher_salaries.paid_amount IS 'Actual amount paid to teacher';
COMMENT ON COLUMN teacher_salaries.payment_notes IS 'Notes about the payment';

-- 10. Verify the setup
SELECT 'Teacher salary system setup completed successfully!' as status;
