-- Create student_groups junction table to track student status in each group
-- This table will store whether a student is active or stopped in each group

CREATE TABLE IF NOT EXISTS student_groups (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stopped')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, group_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_student_groups_student_id ON student_groups(student_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_group_id ON student_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_status ON student_groups(status);

-- Add comment to table
COMMENT ON TABLE student_groups IS 'Junction table to track student status (active/stopped) in each group';

-- Insert existing active students into the table
INSERT INTO student_groups (student_id, group_id, status, created_at, updated_at)
SELECT 
    s.id as student_id,
    s.group_id,
    'active' as status,
    NOW() as created_at,
    NOW() as updated_at
FROM students s
WHERE s.group_id IS NOT NULL
ON CONFLICT (student_id, group_id) DO NOTHING;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_student_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_student_groups_updated_at
    BEFORE UPDATE ON student_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_student_groups_updated_at();
