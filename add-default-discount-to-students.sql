-- Add default_discount column to students table
-- This script adds the default_discount column to store each student's default discount percentage

-- Add default_discount column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS default_discount DECIMAL(5,2) DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN students.default_discount IS 'Default discount percentage for this student (0-100)';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_students_default_discount ON students(default_discount);

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
    AND column_name = 'default_discount';

-- Show current students with their default discounts
SELECT 
    id,
    name,
    default_discount,
    CASE 
        WHEN default_discount > 0 THEN 'Has default discount'
        ELSE 'No default discount'
    END as discount_status
FROM students
ORDER BY name;
