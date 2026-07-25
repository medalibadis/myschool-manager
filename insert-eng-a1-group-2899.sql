-- =====================================================
-- INSERT STUDENTS INTO GROUP 2899
-- Group: ENG A1 | Teacher: يسرى بوسنينة (T21)
-- Price: 6000 | Sessions: 12 | Start: 4/1/26
-- Time: FRI-SAT 18
-- =====================================================

-- Step 0: Create the group with explicit ID 2899
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2899, 
    'ENG A1 - Group 2899', 
    (SELECT id FROM teachers WHERE custom_id = 'T21' LIMIT 1), 
    'English', 
    'A1', 
    'Teens', 
    6000.00, 
    12, 
    '2026-04-01'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 22 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('لين حلواجي', '655279627', NULL, 'حي الشهداء', true, 500.00, 2899, 0.00),
('مازن بن خليفة', '770860063', '656502375', 'حي النور', true, 500.00, 2899, 0.00),
('بيلسان بن خليفة', '770860063', '656502375', 'حي النور', true, 500.00, 2899, 0.00),
('لجين زبيدي', '668513330', NULL, 'حي باب الوادي', true, 500.00, 2899, 0.00),
('معتز بالله دو', '770770096', NULL, 'مارس 19', true, 500.00, 2899, 0.00),
('نجم الدين قبطوبي', '699934404', '77602755', 'حي الازدهار', true, 500.00, 2899, 0.00),
('احمد حمتين', '795352220', NULL, 'الصحن الاول', true, 500.00, 2899, 0.00),
('الفاروق فرحات حميدة', '673039304', NULL, 'المصاعبة', true, 500.00, 2899, 0.00),
('جوهر كناوية', '783981617', '669803298', 'حي 160 سكن الوادي', true, 500.00, 2899, 0.00),
('ميسم قدور', '773732456', NULL, 'حي اولاد احمد', true, 500.00, 2899, 0.00),
('جوري زيتوني', '672360522', '672360642', 'حي عدل', true, 500.00, 2899, 0.00),
('رفيقة جبالي', '773964657', '666401766', 'حي النور', true, 500.00, 2899, 0.00),
('يوسف قطحيزة تجاني', '672866055', '659866033', 'البياضة', true, 500.00, 2899, 0.00),
('المعتز بالله فردية', '675645619', '798359086', 'حي الحرية', true, 500.00, 2899, 0.00),
('المعز بالله فردية', '675645619', '798359086', 'حي الحرية', true, 500.00, 2899, 0.00),
('رؤى بن علي', '776930004', '662686768', 'حي النور', true, 500.00, 2899, 0.00),
('سيدرة بن علي', '776930004', '662686768', 'حي النور', true, 500.00, 2899, 0.00),
('انس زهواني', '699248959', '668349799', 'البياضة', true, 500.00, 2899, 0.00),
('ريتاج سعدون', '555237447', NULL, 'حي الكثبان', true, 500.00, 2899, 0.00),
('عبد الرحيم بكاري', '664960410', '664936282', 'حي الحرية', true, 500.00, 2899, 0.00),
('الاء تركي', '663143105', '663656572', 'حي باب الواد', true, 500.00, 2899, 0.00),
('بلقيس حفوظة', '664120042', '697161673', 'حي الرمال', true, 500.00, 2899, 0.00);

-- Step 2: Link all 22 students to group 2899 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2899, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2899
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2899
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2899, 500.00, CURRENT_DATE, 'Registration fee - Group 2899', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2899
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2899 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2899;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2899;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2899 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2899 AND payment_type = 'registration_fee';

-- Show all students in group 2899
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2899
ORDER BY s.name;

SELECT '🎉 22 students added to Group 2899 (ENG A1 - Teacher T21) successfully!' as final_status;
