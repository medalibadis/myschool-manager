-- =====================================================
-- INSERT STUDENTS INTO GROUP 2922
-- Group: ENG A1+ | Teacher: يسرى بوسنينة (T21)
-- Price: 6000 | Sessions: 12 | Start: 4/18/26
-- Time: FRI-SAT 16:00
-- =====================================================

-- Step 0: Create the group with explicit ID 2922
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2922, 
    'ENG A1+ - Group 2922', 
    (SELECT id FROM teachers WHERE custom_id = 'T21' LIMIT 1), 
    'English', 
    'A1+', 
    'Teens', 
    6000.00, 
    12, 
    '2026-04-18'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 15 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('رودينا مهاوات', '667881466', '664916019', 'حي الازدهار', true, 500.00, 2922, 0.00),
('مريم خليل', '655483554', NULL, 'حي الاعشاش', true, 500.00, 2922, 0.00),
('محمد البشير خليل', '655483554', NULL, 'الاعشاش', true, 500.00, 2922, 0.00),
('اروى مكي', '782590922', NULL, 'حي ام سلمى', true, 500.00, 2922, 0.00),
('محمد السعيد محمودي', '780330816', '663452130', 'الامير عبد القادر', true, 500.00, 2922, 0.00),
('رنيم سيالة', '668462165', NULL, 'حي الرمال', true, 500.00, 2922, 0.00),
('علي شاوش', '663247741', NULL, 'حي النزلة', true, 500.00, 2922, 0.00),
('عبد القدوس سيالة', '668462165', NULL, 'حي الرمال', true, 500.00, 2922, 0.00),
('مريم قروي', '660747678', NULL, 'حي 17 اكتوبر', true, 500.00, 2922, 0.00),
('ادم قروي', '660747678', NULL, 'حي 17 اكتوبر', true, 500.00, 2922, 0.00),
('يحي قصير', '661525257', NULL, '/', true, 500.00, 2922, 0.00),
('رفيف تواتي طليبة', '697401610', '698190331', 'حي الصحن', true, 500.00, 2922, 0.00),
('بلال زهواني', '699248959', NULL, 'حي ام سلمى', true, 500.00, 2922, 0.00),
('تسنيم بوالعام', '674451133', NULL, 'حي القارة', true, 500.00, 2922, 0.00),
('عبد المعز تواتي احمد', '664026085', '698830641', 'حي الشهداء', true, 500.00, 2922, 0.00);

-- Step 2: Link all 15 students to group 2922 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2922, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2922
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2922
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2922, 500.00, CURRENT_DATE, 'Registration fee - Group 2922', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2922
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2922 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2922;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2922;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2922 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2922 AND payment_type = 'registration_fee';

-- Show all students in group 2922
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2922
ORDER BY s.name;

SELECT '🎉 15 students added to Group 2922 (ENG A1+ - Teacher T21) successfully!' as final_status;
