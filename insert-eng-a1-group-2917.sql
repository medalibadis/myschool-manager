-- =====================================================
-- INSERT STUDENTS INTO GROUP 2917
-- Group: ENG A1 | Teacher: ايمان شرفي (T22)
-- Price: 6000 | Sessions: 12 | Start: 4/16/26
-- Time: THU 18:00
-- =====================================================

-- Step 0: Create the group with explicit ID 2917
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2917, 
    'ENG A1 - Group 2917', 
    (SELECT id FROM teachers WHERE custom_id = 'T22' LIMIT 1), 
    'English', 
    'A1', 
    'Teens', 
    6000.00, 
    12, 
    '2026-04-16'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 9 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('عبد الظاهر عموري', '662993594', NULL, NULL, true, 500.00, 2917, 0.00),
('يمان بوصبيع العايش', '661382777', '0664458932', 'حي الشهداء', true, 500.00, 2917, 0.00),
('ادم طليبة', '561909090', NULL, 'حي القدد', true, 500.00, 2917, 0.00),
('اويس ليمان', '661670867', '0559797664', 'حي الرمال', true, 500.00, 2917, 0.00),
('ريان بالقط', '669371786', NULL, 'حي الحرية', true, 500.00, 2917, 0.00),
('ريحانة شايع', '795914229', '664418664', 'البياضة', true, 500.00, 2917, 0.00),
('عمر غندير مبروك', '671199159', NULL, 'حي 19 مارس', true, 500.00, 2917, 0.00),
('بتول رحماني', '666597749', NULL, 'حي 500 سكن', true, 500.00, 2917, 0.00),
('ميسم عشيري', '664039900', '0782221643', 'حي باب الواد', true, 500.00, 2917, 0.00);

-- Step 2: Link all 9 students to group 2917 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2917, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2917
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2917
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2917, 500.00, CURRENT_DATE, 'Registration fee - Group 2917', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2917
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2917 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2917;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2917;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2917 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2917 AND payment_type = 'registration_fee';

-- Show all students in group 2917
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2917
ORDER BY s.name;

SELECT '🎉 9 students added to Group 2917 (ENG A1 - Teacher T22) successfully!' as final_status;
