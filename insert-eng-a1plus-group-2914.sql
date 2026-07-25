-- =====================================================
-- INSERT STUDENTS INTO GROUP 2914
-- Group: ENG A1+ | Teacher: ايمان شرفي (T22)
-- Price: 6000 | Sessions: 12 | Start: 4/11/26
-- Time: FRI-SAT 10:00
-- =====================================================

-- Step 0: Create the group with explicit ID 2914
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2914, 
    'ENG A1+ - Group 2914', 
    (SELECT id FROM teachers WHERE custom_id = 'T22' LIMIT 1), 
    'English', 
    'A1+', 
    'Teens', 
    6000.00, 
    12, 
    '2026-04-11'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 9 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('اميمة شتحونة', '555021119', NULL, 'حي الكوثر النزلة', true, 500.00, 2914, 0.00),
('اروى بن حسين', '552013183', NULL, 'حي الصحن', true, 500.00, 2914, 0.00),
('مستور موان', '662512166', NULL, 'حي المنظر الجميل', true, 500.00, 2914, 0.00),
('نورسان ميلودي', '663004245', NULL, 'حي 08 ماي', true, 500.00, 2914, 0.00),
('احمد ساسي زمالي', '671996060', NULL, 'حي 500 سكن عدل', true, 500.00, 2914, 0.00),
('وجيه عيساوي', '778564090', NULL, 'حي المصاعبة', true, 500.00, 2914, 0.00),
('مراد فردية', '675645619', '798359086', 'حي الحرية', true, 500.00, 2914, 0.00),
('سيرين محده', '662949862', '696440225', 'تكسبت', true, 500.00, 2914, 0.00),
('عبد السميع فريجات', '770806413', NULL, 'وادي العلندة', true, 500.00, 2914, 0.00);

-- Step 2: Link all 9 students to group 2914 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2914, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2914
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2914
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2914, 500.00, CURRENT_DATE, 'Registration fee - Group 2914', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2914
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2914 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2914;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2914;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2914 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2914 AND payment_type = 'registration_fee';

-- Show all students in group 2914
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2914
ORDER BY s.name;

SELECT '🎉 9 students added to Group 2914 (ENG A1+ - Teacher T22) successfully!' as final_status;
