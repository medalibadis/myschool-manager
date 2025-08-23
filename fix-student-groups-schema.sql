-- Fix student_groups table schema and constraints
-- Run this in your Supabase SQL editor

-- 1. First, let's check the current structure and fix any issues
-- Drop existing constraint if it exists (with a different name)
DO $$
BEGIN
    -- Try to drop potential constraint variations
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'student_groups_student_id_group_id_key' 
               AND table_name = 'student_groups') THEN
        ALTER TABLE student_groups DROP CONSTRAINT student_groups_student_id_group_id_key;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'student_groups_pkey' 
               AND table_name = 'student_groups') THEN
        -- Keep primary key, it's fine
    END IF;
EXCEPTION
    WHEN others THEN
        -- Constraint might not exist, continue
        NULL;
END $$;

-- 2. Add missing columns if they don't exist
ALTER TABLE student_groups 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS stop_reason TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Ensure we have the right columns with correct types
ALTER TABLE student_groups 
ALTER COLUMN status SET DEFAULT 'active',
ALTER COLUMN created_at SET DEFAULT NOW();

-- 4. Create a proper unique constraint
ALTER TABLE student_groups 
ADD CONSTRAINT student_groups_student_group_unique 
UNIQUE (student_id, group_id);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_groups_student_id ON student_groups (student_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_group_id ON student_groups (group_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_status ON student_groups (status);

-- 6. Create or replace function for safe upsert
CREATE OR REPLACE FUNCTION upsert_student_group_status(
    p_student_id UUID,
    p_group_id INTEGER,
    p_status TEXT,
    p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Try to update first
    UPDATE student_groups 
    SET status = p_status, 
        notes = COALESCE(p_notes, notes),
        updated_at = NOW()
    WHERE student_id = p_student_id AND group_id = p_group_id;
    
    -- If no rows were updated, insert
    IF NOT FOUND THEN
        INSERT INTO student_groups (student_id, group_id, status, notes, created_at, updated_at)
        VALUES (p_student_id, p_group_id, p_status, p_notes, NOW(), NOW());
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON student_groups TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_student_group_status TO anon, authenticated;

-- 8. Test the function (you can run this to verify it works)
-- SELECT upsert_student_group_status('test-uuid'::uuid, 1, 'active', 'test note');
-- SELECT upsert_student_group_status('test-uuid'::uuid, 1, 'stopped', 'stop reason');
-- DELETE FROM student_groups WHERE student_id = 'test-uuid'::uuid AND group_id = 1;

COMMIT;
