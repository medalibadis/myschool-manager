-- =====================================================
-- INSERT STUDENTS INTO GROUP 2919
-- Group: ENG A1+ | Teacher: رؤوف بوكوشة (T01)
-- Price: 6000 | Sessions: 12 | Start: 4/17/26
-- Time: FRI-SAT 8
-- =====================================================

-- Step 0: Create the group with explicit ID 2919
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2919, 
    'ENG A1+ - Group 2919', 
    (SELECT id FROM teachers WHERE custom_id = 'T01' LIMIT 1), 
    'English', 
    'A1+', 
    'Teens', 
    6000.00, 
    12, 
    '2026-04-17'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 16 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('محمد ياسين فرحات حميدة', '660436253', '661394415', 'تكسبت الغربية', true, 500.00, 2919, 0.00),
('بلال حشيفة', '1', NULL, 'الرباح', true, 500.00, 2919, 0.00),
('السعيد عبد المليك بن سعيد', '660391640', NULL, 'حي نوفمبر البياضة', true, 500.00, 2919, 0.00),
('صهيب مزيو', '698840701', NULL, 'الطريفاوي', true, 500.00, 2919, 0.00),
('امجد احمادي', '660317318', NULL, 'حي سيدي عبد الله', true, 500.00, 2919, 0.00),
('نور الهدى محمودي', '661382005', NULL, 'الحرية', true, 500.00, 2919, 0.00),
('موسى زين', '697040497', '661387283', 'حي الرمال', true, 500.00, 2919, 0.00),
('حسن شرفي', '656406382', NULL, 'حي النور', true, 500.00, 2919, 0.00),
('حسين شرفي', '656406382', NULL, 'حي النور', true, 500.00, 2919, 0.00),
('اياد بالنور', '671359935', NULL, 'الازدهار البياضة', true, 500.00, 2919, 0.00),
('بلقاسم قماري', '661393943', NULL, 'حي الكوثر', true, 500.00, 2919, 0.00),
('فاطمة الزهراء بن عزة', '770995888', '661500596', '17 اكتوبر', true, 500.00, 2919, 0.00),
('ايناس طويل', '553318233', NULL, '400 سكن', true, 500.00, 2919, 0.00),
('احمد ياسين بن موسى1', '659747414', NULL, NULL, true, 500.00, 2919, 0.00),
('حسين بن موسى', '558941790', NULL, NULL, true, 500.00, 2919, 0.00),
('عبد الرحمان خليل', '660876023', '560319090', 'حي الرمال', true, 500.00, 2919, 0.00);

-- Step 2: Link all 16 students to group 2919 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2919, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2919
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2919
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2919, 500.00, CURRENT_DATE, 'Registration fee - Group 2919', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2919
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2919 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2919;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2919;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2919 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2919 AND payment_type = 'registration_fee';

-- Show all students in group 2919
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2919
ORDER BY s.name;

SELECT '🎉 16 students added to Group 2919 (ENG A1+ - Teacher T01) successfully!' as final_status;
