-- =====================================================
-- FIX GROUP CONFIGURATIONS PERSISTENCE
-- This creates a table to store group configurations so they don't get lost on refresh
-- =====================================================

-- 1. Create group_configurations table to store configurations
CREATE TABLE IF NOT EXISTS group_configurations (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL UNIQUE,
    language VARCHAR(100),
    level VARCHAR(100),
    category VARCHAR(100),
    teacher_id UUID REFERENCES teachers(id),
    start_date DATE,
    start_time TIME,
    end_time TIME,
    sessions_number INTEGER DEFAULT 16,
    recurring_days INTEGER[] DEFAULT '{1}',
    course_price DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    is_configured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_configurations_name ON group_configurations(group_name);

-- 3. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_group_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_group_configurations_updated_at 
    BEFORE UPDATE ON group_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_group_configurations_updated_at();

-- 4. Test the table structure
SELECT 'GROUP_CONFIGURATIONS TABLE CREATED:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'group_configurations' 
ORDER BY ordinal_position;

-- 5. Final status
SELECT '🎉 GROUP CONFIGURATIONS TABLE READY!' as message;
SELECT 'Now group configurations will persist after refresh.' as details;
