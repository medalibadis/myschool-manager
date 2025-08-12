-- Update attendance table to support attendance status
-- This script changes the attendance table to use status instead of boolean

-- First, let's see the current structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'attendance' 
ORDER BY ordinal_position;

-- Add a new status column
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'default';

-- Update existing records to convert boolean to status
UPDATE attendance 
SET status = CASE 
    WHEN attended = true THEN 'present'
    WHEN attended = false THEN 'absent'
    ELSE 'default'
END
WHERE status IS NULL OR status = '';

-- Create an index for the status column
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Verify the changes
SELECT 
    'attendance' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN status = 'default' THEN 1 END) as default_count,
    COUNT(CASE WHEN status NOT IN ('present', 'absent', 'default') THEN 1 END) as other_count
FROM attendance; 