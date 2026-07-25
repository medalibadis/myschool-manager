-- =====================================================
-- INSERT STUDENTS INTO GROUP 2918
-- Group: ENG A1 | Teacher: غادة صفیناز علالي (T13)
-- Price: 6000 | Sessions: 12 | Start: 4/16/26
-- Time: TUE-THUR 18:00
-- =====================================================

-- Step 0: Create the group with explicit ID 2918
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2918, 
    'ENG A1 - Group 2918', 
    (SELECT id FROM teachers WHERE custom_id = 'T13' LIMIT 1), 
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

-- Step 1: Insert 6 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('محمد ابراهيم رواق', '782896940', '782896932', 'حي الصحن الاول', true, 500.00, 2918, 0.00),
('سيرين رحماني', '666597749', NULL, 'حي 500 سكن عدل', true, 500.00, 2918, 0.00),
('سارة العايب', '666581919', '776808616', 'حي الصحن الاول', true, 500.00, 2918, 0.00),
('ايمان شادو', '558960207', NULL, 'حي 18 فيفري', true, 500.00, 2918, 0.00),
('زهية معمري', '673961445', NULL, 'حي العدل', true, 500.00, 2918, 0.00),
('محمد الصالح احمودة', '671761199', '659044807', 'حي 1 نوفمبر', true, 500.00, 2918, 0.00);

-- Step 2: Link all 6 students to group 2918 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2918, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2918
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2918
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2918, 500.00, CURRENT_DATE, 'Registration fee - Group 2918', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2918
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2918 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2918;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2918;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2918 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2918 AND payment_type = 'registration_fee';

-- Show all students in group 2918
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2918
ORDER BY s.name;

SELECT '🎉 6 students added to Group 2918 (ENG A1 - Teacher T13) successfully!' as final_status;
