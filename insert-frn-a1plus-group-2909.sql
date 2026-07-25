-- =====================================================
-- INSERT STUDENTS INTO GROUP 2909
-- Group: FRN A1+ | Teacher: نهلة مسعي احمد (T20)
-- Price: 5000 | Sessions: 12 | Start: 4/4/26
-- Time: FRI-SAT 16
-- =====================================================

-- Step 0: Create the group with explicit ID 2909
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2909, 
    'FRN A1+ - Group 2909', 
    (SELECT id FROM teachers WHERE custom_id = 'T20' LIMIT 1), 
    'French', 
    'A1+', 
    'Teens', 
    5000.00, 
    12, 
    '2026-04-04'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 10 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('لين حلواجي', '655279627', NULL, 'حي الشهداء', true, 500.00, 2909, 0.00),
('ريتاج حليلات', '771332456', '662783812', '/', true, 500.00, 2909, 0.00),
('معتز بالله دو', '770770096', NULL, 'مارس 19', true, 500.00, 2909, 0.00),
('جوري زيتوني', '672360522', '672360642', 'حي عدل', true, 500.00, 2909, 0.00),
('رفيقة جبالي', '773964657', '666401766', 'حي النور', true, 500.00, 2909, 0.00),
('المعتز بالله فردية', '675645619', '798359086', 'حي الحرية', true, 500.00, 2909, 0.00),
('المعز بالله فردية', '675645619', '798359086', 'حي الحرية', true, 500.00, 2909, 0.00),
('رؤى بن علي', '776930004', '662686768', 'حي النور', true, 500.00, 2909, 0.00),
('سيدرة بن علي', '776930004', '662686768', 'حي النور', true, 500.00, 2909, 0.00),
('هيثم عبد اللطيف قاسمي', '665642888', NULL, 'حي النور', true, 500.00, 2909, 0.00);

-- Step 2: Link all 10 students to group 2909 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2909, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2909
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2909
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2909, 500.00, CURRENT_DATE, 'Registration fee - Group 2909', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2909
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2909 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2909;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2909;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2909 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2909 AND payment_type = 'registration_fee';

-- Show all students in group 2909
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2909
ORDER BY s.name;

SELECT '🎉 10 students added to Group 2909 (FRN A1+ - Teacher T20) successfully!' as final_status;
