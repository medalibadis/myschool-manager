-- Add missing columns to groups table
-- This script adds the language, level, category, and price columns that are needed for group creation

-- Add language column
ALTER TABLE groups ADD COLUMN IF NOT EXISTS language VARCHAR(100);

-- Add level column
ALTER TABLE groups ADD COLUMN IF NOT EXISTS level VARCHAR(100);

-- Add category column
ALTER TABLE groups ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add price column
ALTER TABLE groups ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- Create indexes for the new columns for better performance
CREATE INDEX IF NOT EXISTS idx_groups_language ON groups(language);
CREATE INDEX IF NOT EXISTS idx_groups_level ON groups(level);
CREATE INDEX IF NOT EXISTS idx_groups_category ON groups(category); 