-- Simple test to check students table
SELECT '=== BASIC STUDENT TEST ===' as info;

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'students'
) as table_exists;

-- Check if there are any students
SELECT COUNT(*) as student_count FROM students;

-- Look at one student record (if any exist)
SELECT * FROM students LIMIT 1;

-- Check ID field specifically
SELECT 
    CASE 
        WHEN id IS NULL THEN 'ID is NULL'
        WHEN id = '' THEN 'ID is empty string'
        ELSE 'ID has value: ' || id
    END as id_status
FROM students 
LIMIT 1;
