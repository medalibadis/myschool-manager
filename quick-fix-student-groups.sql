-- Quick Fix for student_groups table
-- This creates the table if it doesn't exist and adds the status column

-- Create the student_groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS student_groups (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, group_id)
);

-- Add missing columns if they don't exist (for existing tables)
DO $$
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_groups' AND column_name = 'status'
    ) THEN
        ALTER TABLE student_groups ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_groups' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE student_groups ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_groups' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE student_groups ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add check constraint for status values
ALTER TABLE student_groups 
DROP CONSTRAINT IF EXISTS check_status_values;

ALTER TABLE student_groups 
ADD CONSTRAINT check_status_values 
CHECK (status IN ('active', 'stopped'));

-- Update any existing records to have proper values
UPDATE student_groups 
SET status = 'active' 
WHERE status IS NULL OR status = '';

UPDATE student_groups 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

UPDATE student_groups 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- Populate with existing students if the table is empty
-- Since students table doesn't have group_id, we'll create a basic structure
-- You can manually add students to groups later through the application

-- For now, just create the table structure without populating data
-- The application will handle adding students to groups when they're created

-- Verify the table structure
SELECT 'Student Groups Table Structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'student_groups' 
ORDER BY ordinal_position;

-- Show sample data
SELECT 'Sample student_groups data:' as info;
SELECT * FROM student_groups LIMIT 5;

-- Check what columns your students table actually has
SELECT 'Students table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;
