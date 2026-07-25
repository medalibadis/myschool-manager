-- =====================================================
-- INSERT STUDENTS INTO GROUP 2898
-- Group: ENG A2 | Teacher: حنان لقميري (T11)
-- Price: 6000 | Sessions: 12 | Start: 3/28/26
-- Time: FRI-SAT 8
-- =====================================================

-- Step 0: Create the group with explicit ID 2898
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2898, 
    'ENG A2 - Group 2898', 
    (SELECT id FROM teachers WHERE custom_id = 'T11' LIMIT 1), 
    'English', 
    'A2', 
    'Teens', 
    6000.00, 
    12, 
    '2026-03-28'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 21 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('موسى زلاسي', '666307534', '664624855', 'المجاهدين', true, 500.00, 2898, 0.00),
('نمارق بحري', '662387001', '696272594', 'الرمال', true, 500.00, 2898, 0.00),
('يحي سردوك', '699975831', '655383939', 'حي الرمال', true, 500.00, 2898, 0.00),
('ابراهيم جديد', '662827667', NULL, 'سكن 300', true, 500.00, 2898, 0.00),
('محمد وسيم ميلودي', '663004245', NULL, 'حي 08 ماي', true, 500.00, 2898, 0.00),
('سارة عبد الملك', '668022323', '698035136', 'حي النجار', true, 500.00, 2898, 0.00),
('جوان غريسي', '783397234', NULL, 'كن البياضة 400', true, 500.00, 2898, 0.00),
('عصام تواتي طليبة', '662494803', '663581086', 'مارس 19', true, 500.00, 2898, 0.00),
('فراس سعودي', '698721634', NULL, 'تكسبت الواد', true, 500.00, 2898, 0.00),
('بهاء الدين بوطيب', '780499621', '780499674', 'حي الناظور', true, 500.00, 2898, 0.00),
('امجد تركي', '667956358', NULL, '.', true, 500.00, 2898, 0.00),
('ابراهيم الخليل بالقط', '699390518', '791478840', 'حي عدل', true, 500.00, 2898, 0.00),
('ريهام بوسعدية', '791956228', NULL, 'حي 160 مسكن', true, 500.00, 2898, 0.00),
('تسنيم بوسعدية', '791956228', NULL, 'حي 160 مسكن', true, 500.00, 2898, 0.00),
('الاء الرحمان سلمان', '664056966', NULL, 'حي الشهداء', true, 500.00, 2898, 0.00),
('اياد نصيره', '666056156', NULL, 'حي 300 مسكن', true, 500.00, 2898, 0.00),
('مرال باي', '664040500', '673888888', 'حي 8 ماي', true, 500.00, 2898, 0.00),
('هبة الرحمان باسي', '782491376', NULL, 'حي الرمال', true, 500.00, 2898, 0.00),
('رحيل جبالي', '660760468', NULL, 'حي الناظور', true, 500.00, 2898, 0.00),
('ايهاب دلال', '672110906', NULL, 'البياضة', true, 500.00, 2898, 0.00),
('ميسم لبشاقي', '661128522', NULL, 'مارس 19', true, 500.00, 2898, 0.00);

-- Step 2: Link all 21 students to group 2898 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2898, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2898
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2898
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2898, 500.00, CURRENT_DATE, 'Registration fee - Group 2898', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2898
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2898 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2898;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2898;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2898 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2898 AND payment_type = 'registration_fee';

-- Show all students in group 2898
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2898
ORDER BY s.name;

SELECT '🎉 21 students added to Group 2898 (ENG A2 - Teacher T11) successfully!' as final_status;
