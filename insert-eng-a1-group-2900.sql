-- =====================================================
-- INSERT STUDENTS INTO GROUP 2900
-- Group: ENG A1 | Teacher: حميد غفران (T07)
-- Price: 6000 | Sessions: 12 | Start: 4/2/26
-- Time: TUE-THUR 18
-- =====================================================

-- Step 0: Create the group with explicit ID 2900
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2900, 
    'ENG A1 - Group 2900', 
    (SELECT id FROM teachers WHERE custom_id = 'T07' LIMIT 1), 
    'English', 
    'A1', 
    'Teens', 
    6000.00, 
    12, 
    '2026-04-02'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 17 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('ريماس فرحات', '666611739', NULL, 'حي 19 مارس 1962', true, 500.00, 2900, 0.00),
('صهيب دو', '770770096', NULL, 'مارس 19', true, 500.00, 2900, 0.00),
('احمد تقي الدين موساوي', '699913939', NULL, 'كونين', true, 500.00, 2900, 0.00),
('محمد عمارة عموري', '662993594', NULL, NULL, true, 500.00, 2900, 0.00),
('اريج ضيف الله', '672754592', '699313186', 'حي الشهداء', true, 500.00, 2900, 0.00),
('طيبة تامة', '676345516', NULL, 'حي النور', true, 500.00, 2900, 0.00),
('انفال بن حوة', '664322532', '699469020', 'حي باب الواد', true, 500.00, 2900, 0.00),
('مريم شادو', '558960207', NULL, 'فيفري 18', true, 500.00, 2900, 0.00),
('شهد طليبة', '561909090', NULL, 'حي القدد', true, 500.00, 2900, 0.00),
('صابر ايوب بن خليفة', '655689812', '659523768', 'حي ام سلمى', true, 500.00, 2900, 0.00),
('سندس ساطوح', '674213765', '655942030', 'حي البياضة', true, 500.00, 2900, 0.00),
('عبد الكافي ناب', '770209749', '557015547', 'حي الازدهار', true, 500.00, 2900, 0.00),
('هديل احمودة', '677761199', NULL, 'حي 1 نوفمبر', true, 500.00, 2900, 0.00),
('نجلاء بالقط', '669371786', NULL, NULL, true, 500.00, 2900, 0.00),
('ياسمين قدوره', '667529203', NULL, 'حي 18 فيفري', true, 500.00, 2900, 0.00),
('محمد بوصبيع صالح', '556726956', '560080489', 'حي الرمال', true, 500.00, 2900, 0.00),
('عبد الرحمان زروق', '661575347', '699607770', 'البياضة', true, 500.00, 2900, 0.00);

-- Step 2: Link all 17 students to group 2900 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2900, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2900
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2900
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2900, 500.00, CURRENT_DATE, 'Registration fee - Group 2900', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2900
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2900 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2900;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2900;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2900 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2900 AND payment_type = 'registration_fee';

-- Show all students in group 2900
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2900
ORDER BY s.name;

SELECT '🎉 17 students added to Group 2900 (ENG A1 - Teacher T07) successfully!' as final_status;
