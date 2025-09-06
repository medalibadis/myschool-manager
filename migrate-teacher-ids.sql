-- Migration script to add custom_id field to teachers table and migrate existing data
-- This will add sequential teacher IDs starting from T01

-- Step 1: Add custom_id column to teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS custom_id VARCHAR(10);

-- Step 2: Create a sequence for teacher IDs
CREATE SEQUENCE IF NOT EXISTS teacher_id_seq START 1;

-- Step 3: Update existing teachers with sequential IDs
-- This will assign T01, T02, T03, etc. to existing teachers based on their creation date
WITH teacher_ranking AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY created_at ASC) as rank_num
    FROM teachers
    WHERE custom_id IS NULL
)
UPDATE teachers 
SET custom_id = 'T' || LPAD(teacher_ranking.rank_num::text, 2, '0')
FROM teacher_ranking
WHERE teachers.id = teacher_ranking.id;

-- Step 4: Set the sequence to continue from the next available number
-- This ensures new teachers get the next sequential ID
SELECT setval('teacher_id_seq', (
    SELECT COALESCE(MAX(CAST(SUBSTRING(custom_id FROM 2) AS INTEGER)), 0) + 1
    FROM teachers 
    WHERE custom_id IS NOT NULL AND custom_id ~ '^T[0-9]+$'
));

-- Step 5: Create a function to auto-generate teacher IDs for new teachers
CREATE OR REPLACE FUNCTION generate_teacher_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.custom_id IS NULL OR NEW.custom_id = '' THEN
        NEW.custom_id := 'T' || LPAD(nextval('teacher_id_seq')::text, 2, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to auto-generate teacher IDs
DROP TRIGGER IF EXISTS trigger_generate_teacher_id ON teachers;
CREATE TRIGGER trigger_generate_teacher_id
    BEFORE INSERT ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION generate_teacher_id();

-- Step 7: Add unique constraint on custom_id
ALTER TABLE teachers ADD CONSTRAINT unique_teacher_custom_id UNIQUE (custom_id);

-- Step 8: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_custom_id ON teachers(custom_id);

-- Verification queries
SELECT 
    id,
    name,
    custom_id,
    created_at
FROM teachers 
ORDER BY created_at ASC;

-- Show the current sequence value
SELECT last_value FROM teacher_id_seq;
