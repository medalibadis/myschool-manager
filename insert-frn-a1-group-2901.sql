-- =====================================================
-- INSERT STUDENTS INTO GROUP 2901
-- Group: FRN A1 | Teacher: حسنة بوكوشة (T17)
-- Price: 5000 | Sessions: 12 | Start: 4/3/26
-- Time: FRI-SAT 8
-- =====================================================

-- Step 0: Create the group with explicit ID 2901
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2901, 
    'FRN A1 - Group 2901', 
    (SELECT id FROM teachers WHERE custom_id = 'T17' LIMIT 1), 
    'French', 
    'A1', 
    'Teens', 
    5000.00, 
    12, 
    '2026-04-03'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 16 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('ميمونة شبرو', '665656487', '0667911651', '.', true, 500.00, 2901, 0.00),
('حسام مخيبر', '662254152', NULL, 'حي الحرية', true, 500.00, 2901, 0.00),
('رسيل بن عمارة', '782268949', '668641392', 'حي اولاد احمد', true, 500.00, 2901, 0.00),
('محمد اياد حمروني', '667272818', NULL, 'حي النور', true, 500.00, 2901, 0.00),
('اسراء عطا الله', '770978152', NULL, 'حي اولاد حمد الوادي', true, 500.00, 2901, 0.00),
('لينة حميدي', '669224766', NULL, '.', true, 500.00, 2901, 0.00),
('لؤي قمودي', '668535853', '555288887', 'تكسبت', true, 500.00, 2901, 0.00),
('اياد احمادي', '660451173', '665816171', 'حي المنظر الجميل', true, 500.00, 2901, 0.00),
('ايمن شايب', '662421908', NULL, 'حي 17 اكتوبر', true, 500.00, 2901, 0.00),
('محمد جود سعيد', '671163143', '0698279714', 'حي سيدي عبد الله', true, 500.00, 2901, 0.00),
('احمد سليمان باي', '0', NULL, 'حي النزلة', true, 500.00, 2901, 0.00),
('اياد قماري', '780640065', NULL, 'حي الرمال', true, 500.00, 2901, 0.00),
('محمد علي بن عمارة', '660432650', NULL, NULL, true, 500.00, 2901, 0.00),
('مروان بحري1', '66287001', '0696272594', 'الرمال', true, 500.00, 2901, 0.00),
('عاصم سباغ', '667385025', NULL, 'حي الشهداء', true, 500.00, 2901, 0.00),
('غزلان هبيته1', '699934404', NULL, 'حي 19 مارس', true, 500.00, 2901, 0.00);

-- Step 2: Link all 16 students to group 2901 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2901, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2901
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2901
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2901, 500.00, CURRENT_DATE, 'Registration fee - Group 2901', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2901
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2901 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2901;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2901;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2901 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2901 AND payment_type = 'registration_fee';

-- Show all students in group 2901
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2901
ORDER BY s.name;

SELECT '🎉 16 students added to Group 2901 (FRN A1 - Teacher T17) successfully!' as final_status;
