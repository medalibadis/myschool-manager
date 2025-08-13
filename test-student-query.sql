-- =====================================================
-- TEST STUDENT QUERY - IDENTIFY ID FIELD ISSUE
-- =====================================================

-- 1. Check students table structure
SELECT 'STUDENTS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'students'
ORDER BY ordinal_position;

-- 2. Check if there are any students
SELECT 'STUDENTS COUNT:' as info;
SELECT COUNT(*) as student_count FROM students;

-- 3. Look at actual student data (first 3 rows)
SELECT 'ACTUAL STUDENT DATA:' as info;
SELECT * FROM students LIMIT 3;

-- 4. Check if ID field exists and has values
SELECT 'ID FIELD CHECK:' as info;
SELECT 
    CASE 
        WHEN id IS NOT NULL THEN 'ID exists and has value'
        ELSE 'ID is NULL'
    END as id_status,
    COUNT(*) as count
FROM students 
GROUP BY id IS NOT NULL;

-- 5. Check for any students with NULL names
SELECT 'STUDENTS WITH NULL NAMES:' as info;
SELECT COUNT(*) as null_name_count 
FROM students 
WHERE name IS NULL;

-- 6. Test basic query
SELECT 'BASIC QUERY TEST:' as info;
SELECT id, name, email, phone
FROM students
WHERE id IS NOT NULL
LIMIT 3;
