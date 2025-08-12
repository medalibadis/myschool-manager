-- Add duration fields to groups table
-- This script adds start_time and end_time columns to store group duration

-- Add start_time and end_time columns to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS end_time TIME;

-- Create indexes for the new columns for better performance
CREATE INDEX IF NOT EXISTS idx_groups_start_time ON groups(start_time);
CREATE INDEX IF NOT EXISTS idx_groups_end_time ON groups(end_time);

-- Update existing groups to have default duration if they're null
UPDATE groups
SET start_time = '09:00:00', end_time = '11:00:00'
WHERE start_time IS NULL OR end_time IS NULL;

-- Verify the changes
SELECT
    id,
    name,
    start_time,
    end_time,
    CONCAT(
        TO_CHAR(start_time, 'HH:MI AM'),
        ' - ',
        TO_CHAR(end_time, 'HH:MI AM')
    ) as duration_display
FROM groups
LIMIT 5; 