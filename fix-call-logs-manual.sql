-- Manual fix for call_logs table to allow null student_id
-- Run this script in your Supabase SQL Editor

-- First, drop the existing foreign key constraint
ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_student_id_fkey;

-- Modify the student_id column to allow NULL values
ALTER TABLE call_logs ALTER COLUMN student_id DROP NOT NULL;

-- Re-add the foreign key constraint with ON DELETE CASCADE
ALTER TABLE call_logs ADD CONSTRAINT call_logs_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES waiting_list(id) ON DELETE CASCADE;

-- Add a comment to document the change
COMMENT ON COLUMN call_logs.student_id IS 'References waiting_list(id) or NULL for call logs from main students table';

-- Verify the change
SELECT 'Call logs table updated successfully! student_id now allows NULL values.' as status; 