-- =====================================================
-- INSERT STUDENTS INTO GROUP 2902
-- Group: ENG A1 | Teacher: ريان تجاني (T09)
-- Price: 6000 | Sessions: 12 | Start: 4/3/26
-- Time: FRI-SAT 10
-- =====================================================

-- Step 0: Create the group with explicit ID 2902
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2902, 
    'ENG A1 - Group 2902', 
    (SELECT id FROM teachers WHERE custom_id = 'T09' LIMIT 1), 
    'English', 
    'A1', 
    'Teens', 
    6000.00, 
    12, 
    '2026-04-03'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 9 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('امين قديري', '658211513', NULL, 'حي الرمال', true, 500.00, 2902, 0.00),
('اياد داهم', '559531147', NULL, 'حي سيدي عبد الله', true, 500.00, 2902, 0.00),
('اريام داهم', '559531147', NULL, 'حي سيدي عبد الله', true, 500.00, 2902, 0.00),
('محمد ملك بلطرش', '658934770', '551109945', 'حي المنظر الجميل', true, 500.00, 2902, 0.00),
('عبد الرحمان غنايزية', '557100777', '0560577552', 'الجدلة', true, 500.00, 2902, 0.00),
('وصال بلطرش', '658934770', '551109945', 'حي المنظر الجميل', true, 500.00, 2902, 0.00),
('تيم غريسي', '560013923', '0782623944', 'حي الرمال', true, 500.00, 2902, 0.00),
('هيثم عبد اللطيف قاسمي', '665642888', NULL, 'حي النور', true, 500.00, 2902, 0.00),
('امنة بن ناصر', '0662991448', '0782643285', 'حي الرمال', true, 500.00, 2902, 0.00);

-- Step 2: Link all 9 students to group 2902 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2902, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2902
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2902
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2902, 500.00, CURRENT_DATE, 'Registration fee - Group 2902', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2902
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2902 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2902;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2902;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2902 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2902 AND payment_type = 'registration_fee';

-- Show all students in group 2902
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2902
ORDER BY s.name;

SELECT '🎉 9 students added to Group 2902 (ENG A1 - Teacher T09) successfully!' as final_status;
