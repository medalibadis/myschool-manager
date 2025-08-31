-- Add group_discount column to student_groups table
-- This script adds the group_discount column to store individual group discounts per student

-- Add group_discount column to student_groups table
ALTER TABLE student_groups ADD COLUMN IF NOT EXISTS group_discount DECIMAL(5,2) DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN student_groups.group_discount IS 'Individual discount percentage for this student in this specific group (0-100). NULL means use student default discount';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_student_groups_group_discount ON student_groups(group_discount);

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_groups' 
    AND column_name = 'group_discount';

-- Show current student_groups with their discounts
SELECT 
    sg.id,
    s.name as student_name,
    g.name as group_name,
    s.default_discount as student_default_discount,
    sg.group_discount as group_specific_discount,
    CASE 
        WHEN sg.group_discount IS NOT NULL THEN 'Custom group discount'
        WHEN s.default_discount > 0 THEN 'Using student default'
        ELSE 'No discount'
    END as discount_status
FROM student_groups sg
JOIN students s ON sg.student_id = s.id
JOIN groups g ON sg.group_id = g.id
ORDER BY s.name, g.name;
