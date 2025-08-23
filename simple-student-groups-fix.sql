-- Simple fix for student_groups table
-- Run this in your Supabase SQL editor if you're still getting errors

-- 1. Ensure the student_groups table exists with basic structure
CREATE TABLE IF NOT EXISTS student_groups (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL,
    group_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key to students table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'student_groups_student_id_fkey'
    ) THEN
        ALTER TABLE student_groups 
        ADD CONSTRAINT student_groups_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key to groups table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'student_groups_group_id_fkey'
    ) THEN
        ALTER TABLE student_groups 
        ADD CONSTRAINT student_groups_group_id_fkey 
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN
        -- Foreign keys might fail if referenced tables don't exist, continue anyway
        NULL;
END $$;

-- 3. Add unique constraint to prevent duplicates
DO $$
BEGIN
    -- Remove any existing conflicting constraints
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'student_groups_student_id_group_id_key'
        AND table_name = 'student_groups'
    ) THEN
        ALTER TABLE student_groups DROP CONSTRAINT student_groups_student_id_group_id_key;
    END IF;
    
    -- Add the proper unique constraint
    ALTER TABLE student_groups 
    ADD CONSTRAINT student_groups_unique_student_group 
    UNIQUE (student_id, group_id);
EXCEPTION
    WHEN others THEN
        -- Constraint might already exist with different name
        NULL;
END $$;

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_groups_student_id ON student_groups (student_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_group_id ON student_groups (group_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_status ON student_groups (status);

-- 5. Ensure proper permissions
GRANT ALL ON student_groups TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE student_groups_id_seq TO anon, authenticated;

-- 6. Add RLS policies if needed (optional)
DO $$
BEGIN
    -- Enable RLS
    ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;
    
    -- Allow all operations for authenticated users (adjust as needed)
    CREATE POLICY "Allow all for authenticated users" ON student_groups
    FOR ALL TO authenticated USING (true);
    
    -- Allow read for anonymous users (adjust as needed)
    CREATE POLICY "Allow read for anonymous" ON student_groups
    FOR SELECT TO anon USING (true);
EXCEPTION
    WHEN duplicate_object THEN
        -- Policies might already exist
        NULL;
    WHEN others THEN
        -- RLS might not be needed
        NULL;
END $$;

COMMIT;
