-- =====================================================
-- INSERT STUDENTS INTO GROUP 2913
-- Group: ENG A1 | Teacher: ايمان شرفي (T22)
-- Price: 6000 | Sessions: 12 | Start: 4/10/26
-- Time: FRI-SAT 16:00
-- =====================================================

-- Step 0: Create the group with explicit ID 2913
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2913, 
    'ENG A1 - Group 2913', 
    (SELECT id FROM teachers WHERE custom_id = 'T22' LIMIT 1), 
    'English', 
    'A1', 
    'Teens', 
    6000.00, 
    12, 
    '2026-04-10'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 15 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('امجد شتحونة', '555021119', NULL, 'حي الكوثر', true, 500.00, 2913, 0.00),
('رفيف سباغ', '661564333', NULL, 'حي النور', true, 500.00, 2913, 0.00),
('اريام سالمي', '660705279', '666066933', 'حي 8 ماي', true, 500.00, 2913, 0.00),
('محمد سوداء', '541189742', NULL, 'حي الطلابية', true, 500.00, 2913, 0.00),
('لؤي قمودي', '668535853', '555288887', 'تكسبت', true, 500.00, 2913, 0.00),
('منذر قده', '660890734', '657586300', 'حي الرمال', true, 500.00, 2913, 0.00),
('احمد براء فرحات', '664775323', '664907446', 'حي تكسبت', true, 500.00, 2913, 0.00),
('اساور فرحات', '664775323', '664907446', 'تكسبت', true, 500.00, 2913, 0.00),
('اياد قماري', '780640065', NULL, 'حي الرمال', true, 500.00, 2913, 0.00),
('اريج قاسمي', '656991340', NULL, 'حي النور', true, 500.00, 2913, 0.00),
('محمد مداني ميهي', '662742929', '699172717', 'حي باب الواد', true, 500.00, 2913, 0.00),
('شهد ضو', '659640202', NULL, 'حي 19 مارس', true, 500.00, 2913, 0.00),
('اية محمدي', '669147854', '669376391', 'حي الرمال', true, 500.00, 2913, 0.00),
('غزلان هبيته1', '699934404', NULL, 'حي 19 مارس', true, 500.00, 2913, 0.00),
('صابر سروطي', '663644158', '797506065', 'سيدي مستور', true, 500.00, 2913, 0.00);

-- Step 2: Link all 15 students to group 2913 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2913, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2913
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2913
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2913, 500.00, CURRENT_DATE, 'Registration fee - Group 2913', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2913
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2913 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2913;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2913;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2913 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2913 AND payment_type = 'registration_fee';

-- Show all students in group 2913
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2913
ORDER BY s.name;

SELECT '🎉 15 students added to Group 2913 (ENG A1 - Teacher T22) successfully!' as final_status;
