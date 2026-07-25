-- =====================================================
-- INSERT STUDENTS INTO GROUP 2903
-- Group: ENG A1+ | Teacher: سندس بدرة (T18)
-- Price: 6000 | Sessions: 12 | Start: 4/3/26
-- Time: FRI-SAT 16
-- =====================================================

-- Step 0: Create the group with explicit ID 2903
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2903, 
    'ENG A1+ - Group 2903', 
    (SELECT id FROM teachers WHERE custom_id = 'T18' LIMIT 1), 
    'English', 
    'A1+', 
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
('انس قماري', '780646065', NULL, 'حي الرمال', true, 500.00, 2903, 0.00),
('معاذ محمدي', '669147854', '0669376391', '.', true, 500.00, 2903, 0.00),
('معاذ مكي', '666331635', '697129119', 'حي القواطين', true, 500.00, 2903, 0.00),
('سلسبييل قروي', '660747678', NULL, 'حي 17 اكتوبر', true, 500.00, 2903, 0.00),
('ايوب خليل1', '655483554', NULL, 'حي الاعشاش', true, 500.00, 2903, 0.00),
('نصيرة بن علي', '776930004', '662686768', 'حي النور', true, 500.00, 2903, 0.00),
('عبد الحي زهواني', '699248959', '668309799', 'حي عبد الحميد بن باديس البياضة', true, 500.00, 2903, 0.00),
('بلقيس غميمة', '668883321', '662883054', 'البياضة', true, 500.00, 2903, 0.00),
('غسان زهواني', '699248959', '668309799', 'حي عبد الحميد بن باديس', true, 500.00, 2903, 0.00);

-- Step 2: Link all 9 students to group 2903 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2903, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2903
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2903
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2903, 500.00, CURRENT_DATE, 'Registration fee - Group 2903', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2903
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2903 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2903;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2903;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2903 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2903 AND payment_type = 'registration_fee';

-- Show all students in group 2903
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2903
ORDER BY s.name;

SELECT '🎉 9 students added to Group 2903 (ENG A1+ - Teacher T18) successfully!' as final_status;
