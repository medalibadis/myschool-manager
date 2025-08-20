-- Setup Test Data After Clearing Tables
-- Run this after running clear-all-tables.sql to set up minimal test data

-- 1. Add a test teacher
SELECT '=== SETTING UP TEST DATA ===' as info;

SELECT 'Adding test teacher...' as info;
INSERT INTO teachers (name, email, phone) 
VALUES ('Test Teacher', 'teacher@test.com', '1234567890')
RETURNING id, name, email;

-- 2. Create a test group
SELECT 'Creating test group...' as info;
INSERT INTO groups (name, teacher_id, price, duration, max_students) 
VALUES ('Test Group', (SELECT id FROM teachers WHERE name = 'Test Teacher'), 100.00, 60, 10)
RETURNING id, name, price, teacher_id;

-- 3. Add a test student
SELECT 'Adding test student...' as info;
INSERT INTO students (name, phone, email) 
VALUES ('Test Student', '0987654321', 'student@test.com')
RETURNING id, name, phone;

-- 4. Add student to group
SELECT 'Adding student to group...' as info;
INSERT INTO student_groups (student_id, group_id) 
VALUES (
    (SELECT id FROM students WHERE name = 'Test Student'),
    (SELECT id FROM groups WHERE name = 'Test Group')
)
RETURNING student_id, group_id;

-- 5. Verify the setup
SELECT '=== VERIFYING TEST DATA ===' as info;

SELECT 'Teachers:' as info;
SELECT id, name, email FROM teachers;

SELECT 'Groups:' as info;
SELECT id, name, price, teacher_id FROM groups;

SELECT 'Students:' as info;
SELECT id, name, phone FROM students;

SELECT 'Student-Group relationships:' as info;
SELECT 
    s.name as student_name,
    g.name as group_name,
    g.price as group_price
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
JOIN groups g ON sg.group_id = g.id;

-- 6. Check payment status (should be pending)
SELECT '=== CHECKING PAYMENT STATUS ===' as info;

-- Create a simple payment status check
SELECT 
    s.name as student_name,
    g.name as group_name,
    g.price as group_price,
    COALESCE(SUM(CASE 
        WHEN p.amount > 0 
        AND p.notes IS NOT NULL 
        AND p.notes != '' 
        AND p.notes != 'Registration fee'
        THEN p.amount 
        ELSE 0 
    END), 0) as total_paid,
    CASE 
        WHEN g.price IS NULL OR g.price = 0 THEN 'pending'
        WHEN COALESCE(SUM(CASE 
            WHEN p.amount > 0 
            AND p.notes IS NOT NULL 
            AND p.notes != '' 
            AND p.notes != 'Registration fee'
            THEN p.amount 
            ELSE 0 
        END), 0) >= g.price THEN 'paid'
        ELSE 'pending'
    END as payment_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
JOIN groups g ON sg.group_id = g.id
LEFT JOIN payments p ON s.id = p.student_id AND g.id = p.group_id
GROUP BY s.id, s.name, g.id, g.name, g.price;

-- 7. Summary
SELECT '=== TEST DATA SETUP COMPLETED ===' as info;

SELECT 
    'Status:' as info,
    CASE 
        WHEN (SELECT COUNT(*) FROM teachers) > 0
         AND (SELECT COUNT(*) FROM groups) > 0
         AND (SELECT COUNT(*) FROM students) > 0
         AND (SELECT COUNT(*) FROM student_groups) > 0
        THEN '✅ SUCCESS: Test data created successfully'
        ELSE '❌ FAILED: Test data creation failed'
    END as setup_status;

SELECT 'You can now test:' as next_step;
SELECT '1. Add more students to the group' as test_case;
SELECT '2. Verify they show as pending payment status' as test_case;
SELECT '3. Add actual payments and verify status changes' as test_case;
SELECT '4. Check that no automatic payments are created' as test_case;
