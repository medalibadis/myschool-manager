-- Fix teacher_id to be nullable in groups table
-- This allows creating groups without a teacher initially

ALTER TABLE groups ALTER COLUMN teacher_id DROP NOT NULL;

-- Add a comment to document the change
COMMENT ON COLUMN groups.teacher_id IS 'Teacher ID - can be null if no teacher is assigned yet';

SELECT 'Teacher ID is now nullable!' as status; 