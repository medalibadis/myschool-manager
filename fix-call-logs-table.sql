-- Fix call_logs table to allow null student_id for call logs from main students table
-- This allows call logs to be created for students from the main students table (not just waiting list)

-- First, drop the existing foreign key constraint
ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_student_id_fkey;

-- Modify the student_id column to allow NULL values
ALTER TABLE call_logs ALTER COLUMN student_id DROP NOT NULL;

-- Since we can't have a foreign key that references multiple tables directly,
-- we'll remove the foreign key constraint and handle referential integrity at the application level
-- This allows the student_id to reference either waiting_list(id) or students(id)

-- Add a comment to document the change
COMMENT ON COLUMN call_logs.student_id IS 'References waiting_list(id) or students(id) or NULL for general call logs';

-- Update the call_type check constraint to include 'activity'
ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_call_type_check;
ALTER TABLE call_logs ADD CONSTRAINT call_logs_call_type_check 
    CHECK (call_type IN ('registration', 'attendance', 'payment', 'activity', 'other'));

SELECT 'Call logs table updated successfully! student_id now allows references to both waiting_list and students tables.' as status; 