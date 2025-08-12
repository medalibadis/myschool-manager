-- Add new fields and features to the database
-- This script adds new enum values and creates progress tracking features
-- Note: Run complete-database-setup.sql first to ensure base enums exist

-- 1. Add new level values (A1+, A2+, B1+, B2+, C1+) if they don't exist
-- Note: These are already included in the complete setup, but we'll add them safely
DO $$
BEGIN
    -- Add A1+ if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'A1+' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'level_type')) THEN
        ALTER TYPE level_type ADD VALUE 'A1+';
    END IF;
    
    -- Add A2+ if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'A2+' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'level_type')) THEN
        ALTER TYPE level_type ADD VALUE 'A2+';
    END IF;
    
    -- Add B1+ if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'B1+' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'level_type')) THEN
        ALTER TYPE level_type ADD VALUE 'B1+';
    END IF;
    
    -- Add B2+ if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'B2+' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'level_type')) THEN
        ALTER TYPE level_type ADD VALUE 'B2+';
    END IF;
    
    -- Add C1+ if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'C1+' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'level_type')) THEN
        ALTER TYPE level_type ADD VALUE 'C1+';
    END IF;
    
    -- Add "other" option to all enums if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'other' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'language_type')) THEN
        ALTER TYPE language_type ADD VALUE 'other';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'other' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'level_type')) THEN
        ALTER TYPE level_type ADD VALUE 'other';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'other' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'category_type')) THEN
        ALTER TYPE category_type ADD VALUE 'other';
    END IF;
END $$;

-- 2. Create a function to calculate session progress
CREATE OR REPLACE FUNCTION get_session_progress(group_id_param INTEGER)
RETURNS TABLE(total_sessions INTEGER, completed_sessions INTEGER, progress_percentage DECIMAL)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.total_sessions::INTEGER,
        COUNT(s.id)::INTEGER as completed_sessions,
        CASE 
            WHEN g.total_sessions > 0 THEN 
                ROUND((COUNT(s.id)::DECIMAL / g.total_sessions::DECIMAL) * 100, 1)
            ELSE 0 
        END as progress_percentage
    FROM groups g
    LEFT JOIN sessions s ON g.id = s.group_id
    WHERE g.id = group_id_param
    GROUP BY g.id, g.total_sessions;
END;
$$;

-- 3. Create a view for group progress
CREATE OR REPLACE VIEW group_progress AS
SELECT 
    g.id,
    g.name,
    g.total_sessions,
    COUNT(s.id) as completed_sessions,
    CASE 
        WHEN g.total_sessions > 0 THEN 
            ROUND((COUNT(s.id)::DECIMAL / g.total_sessions::DECIMAL) * 100, 1)
        ELSE 0 
    END as progress_percentage
FROM groups g
LEFT JOIN sessions s ON g.id = s.group_id
GROUP BY g.id, g.name, g.total_sessions;

-- 4. Add comments to document the structure
COMMENT ON COLUMN groups.custom_language IS 'Custom language when "other" is selected';
COMMENT ON COLUMN groups.custom_level IS 'Custom level when "other" is selected';
COMMENT ON COLUMN groups.custom_category IS 'Custom category when "other" is selected';
COMMENT ON COLUMN students.parent_name IS 'Optional parent/guardian name';
COMMENT ON COLUMN students.second_phone IS 'Optional second phone number';
COMMENT ON COLUMN waiting_list.parent_name IS 'Optional parent/guardian name';
COMMENT ON COLUMN waiting_list.second_phone IS 'Optional second phone number';
COMMENT ON COLUMN waiting_list.custom_language IS 'Custom language when "other" is selected';
COMMENT ON COLUMN waiting_list.custom_level IS 'Custom level when "other" is selected';
COMMENT ON COLUMN waiting_list.custom_category IS 'Custom category when "other" is selected';

-- 5. Verify the changes (separated to avoid type conversion errors)
SELECT 'Language types:' as enum_name;
SELECT unnest(enum_range(NULL::language_type)) as language_values;

SELECT 'Level types:' as enum_name;
SELECT unnest(enum_range(NULL::level_type)) as level_values;

SELECT 'Category types:' as enum_name;
SELECT unnest(enum_range(NULL::category_type)) as category_values;

SELECT 'Function created successfully!' as status;
SELECT 'View created successfully!' as status; 

-- Add Call Log table for tracking student confirmations
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES waiting_list(id) ON DELETE CASCADE,
    call_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    call_type VARCHAR(50) NOT NULL DEFAULT 'registration' CHECK (call_type IN ('registration', 'attendance', 'payment', 'other')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'coming', 'not_coming')),
    notes TEXT,
    admin_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_call_logs_student_id ON call_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(status);

-- Add RLS policies for call_logs
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON call_logs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON call_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON call_logs
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON call_logs
    FOR DELETE USING (true);

SELECT 'Call Log table created successfully!' as status; 