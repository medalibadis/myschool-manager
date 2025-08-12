-- Add freeze functionality to groups table
-- This script adds the necessary fields for freezing and unfreezing groups

-- Add freeze-related columns to groups table
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS freeze_date DATE,
ADD COLUMN IF NOT EXISTS unfreeze_date DATE;

-- Add index for freeze status for better performance
CREATE INDEX IF NOT EXISTS idx_groups_is_frozen ON groups(is_frozen);
CREATE INDEX IF NOT EXISTS idx_groups_freeze_date ON groups(freeze_date);
CREATE INDEX IF NOT EXISTS idx_groups_unfreeze_date ON groups(unfreeze_date); 