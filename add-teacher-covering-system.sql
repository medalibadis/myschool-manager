-- Add Teacher Covering System
-- This script adds tables and functionality for teacher covering when teachers are absent/justified

-- 1. Create teacher_covering table to track covering sessions
CREATE TABLE IF NOT EXISTS teacher_covering (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    covering_teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    cover_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id) -- One covering record per session
);

-- 2. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_covering_original_teacher ON teacher_covering(original_teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_covering_covering_teacher ON teacher_covering(covering_teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_covering_session_id ON teacher_covering(session_id);
CREATE INDEX IF NOT EXISTS idx_teacher_covering_group_id ON teacher_covering(group_id);
CREATE INDEX IF NOT EXISTS idx_teacher_covering_cover_date ON teacher_covering(cover_date);

-- 3. Add RLS policies for teacher covering
ALTER TABLE teacher_covering ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read teacher covering
CREATE POLICY "Allow authenticated users to read teacher covering" ON teacher_covering
    FOR SELECT USING (true);

-- Allow authenticated users to insert teacher covering
CREATE POLICY "Allow authenticated users to insert teacher covering" ON teacher_covering
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users to update teacher covering
CREATE POLICY "Allow authenticated users to update teacher covering" ON teacher_covering
    FOR UPDATE USING (true);

-- Allow authenticated users to delete teacher covering
CREATE POLICY "Allow authenticated users to delete teacher covering" ON teacher_covering
    FOR DELETE USING (true);

-- 4. Add price_per_session column to teachers table if it doesn't exist
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS price_per_session DECIMAL(10,2) DEFAULT 1000;

-- 5. Create a view for teacher covering history
CREATE OR REPLACE VIEW teacher_covering_history AS
SELECT 
    tc.id,
    tc.cover_date,
    tc.notes,
    tc.created_at,
    -- Original teacher info
    ot.id as original_teacher_id,
    ot.name as original_teacher_name,
    ot.email as original_teacher_email,
    -- Covering teacher info
    ct.id as covering_teacher_id,
    ct.name as covering_teacher_name,
    ct.email as covering_teacher_email,
    ct.price_per_session as covering_teacher_price_per_session,
    -- Group info
    g.id as group_id,
    g.name as group_name,
    -- Session info
    s.id as session_id
FROM teacher_covering tc
JOIN teachers ot ON tc.original_teacher_id = ot.id
JOIN teachers ct ON tc.covering_teacher_id = ct.id
JOIN groups g ON tc.group_id = g.id
JOIN sessions s ON tc.session_id = s.id
ORDER BY tc.cover_date DESC, tc.created_at DESC;

-- 6. Create a function to get covering sessions for salary calculation
CREATE OR REPLACE FUNCTION get_teacher_covering_sessions(teacher_uuid UUID)
RETURNS TABLE (
    covering_id UUID,
    cover_date DATE,
    group_id INTEGER,
    group_name VARCHAR(255),
    original_teacher_name VARCHAR(255),
    price_per_session DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.id,
        tc.cover_date,
        tc.group_id,
        g.name,
        ot.name,
        ct.price_per_session
    FROM teacher_covering tc
    JOIN teachers ct ON tc.covering_teacher_id = ct.id
    JOIN teachers ot ON tc.original_teacher_id = ot.id
    JOIN groups g ON tc.group_id = g.id
    WHERE tc.covering_teacher_id = teacher_uuid
    ORDER BY tc.cover_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. Create a function to get covering history for a specific teacher
CREATE OR REPLACE FUNCTION get_teacher_covering_history(teacher_uuid UUID)
RETURNS TABLE (
    covering_id UUID,
    cover_date DATE,
    group_id INTEGER,
    group_name VARCHAR(255),
    original_teacher_name VARCHAR(255),
    covering_teacher_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.id,
        tc.cover_date,
        tc.group_id,
        g.name,
        ot.name,
        ct.name,
        tc.notes,
        tc.created_at
    FROM teacher_covering tc
    JOIN teachers ct ON tc.covering_teacher_id = ct.id
    JOIN teachers ot ON tc.original_teacher_id = ot.id
    JOIN groups g ON tc.group_id = g.id
    WHERE tc.original_teacher_id = teacher_uuid OR tc.covering_teacher_id = teacher_uuid
    ORDER BY tc.cover_date DESC, tc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Add comment to explain the system
COMMENT ON TABLE teacher_covering IS 'Tracks when teachers cover for other teachers who are absent or justified';
COMMENT ON VIEW teacher_covering_history IS 'Complete view of teacher covering history with all related information';
COMMENT ON FUNCTION get_teacher_covering_sessions(UUID) IS 'Returns covering sessions for a specific teacher for salary calculation';
COMMENT ON FUNCTION get_teacher_covering_history(UUID) IS 'Returns complete covering history for a specific teacher';
