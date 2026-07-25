-- =====================================================
-- INSERT STUDENTS INTO GROUP 2915
-- Group: ENG A1+ | Teacher: يسرى بوسنينة (T21)
-- Price: 6000 | Sessions: 12 | Start: 4/11/26
-- Time: FRI-SAT 10:00
-- =====================================================

-- Step 0: Create the group with explicit ID 2915
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2915, 
    'ENG A1+ - Group 2915', 
    (SELECT id FROM teachers WHERE custom_id = 'T21' LIMIT 1), 
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

-- Step 1: Insert 17 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('يزن بوصبيع ابراهيم', '675632779', NULL, 'حي الكوثر البياضة', true, 500.00, 2915, 0.00),
('نور اليقين غديرعمر', '666205184', '674565947', 'الوادي', true, 500.00, 2915, 0.00),
('بلقيس سيا مداني', '664426267', '666146434', 'حي السعفة', true, 500.00, 2915, 0.00),
('مريم البتول قماري', '663437978', NULL, 'حي النور', true, 500.00, 2915, 0.00),
('مرام طير', '671976233', '675116699', 'حي تكسبت', true, 500.00, 2915, 0.00),
('انفال علية', '555299509', '665161116', 'حي المجاهدين', true, 500.00, 2915, 0.00),
('زهرة هناء رزاق هبلة', '560102552', NULL, 'حي 19 مارس', true, 500.00, 2915, 0.00),
('طلال تي', '663402672', NULL, 'ام سلمى', true, 500.00, 2915, 0.00),
('ايثار فرجاني', '668587075', '0676417850', 'الصحن الاول', true, 500.00, 2915, 0.00),
('امير بن موسى', '661739473', '0770023962', 'حي النور', true, 500.00, 2915, 0.00),
('محمد كنان جميل', '550599717', NULL, 'الرمال', true, 500.00, 2915, 0.00),
('محمد اسكندر بن خليفة', '553790964', NULL, 'الرمال', true, 500.00, 2915, 0.00),
('حكيمة بن خليفة', '553790964', NULL, 'الرمال', true, 500.00, 2915, 0.00),
('نزار صوالح عمار', '663298678', NULL, 'مارس 19', true, 500.00, 2915, 0.00),
('جنان بوصبيع ابراهيم', '675632779', '0672360206', 'البياضة', true, 500.00, 2915, 0.00),
('زياد عبد القادر محده', '662949862', '696440225', 'حي تكسبت', true, 500.00, 2915, 0.00),
('دارين بن موسى', '655426971', NULL, 'حي النور', true, 500.00, 2915, 0.00);

-- Step 2: Link all 17 students to group 2915 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2915, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2915
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2915
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2915, 500.00, CURRENT_DATE, 'Registration fee - Group 2915', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2915
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2915 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2915;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2915;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2915 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2915 AND payment_type = 'registration_fee';

-- Show all students in group 2915
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2915
ORDER BY s.name;

SELECT '🎉 17 students added to Group 2915 (ENG A1+ - Teacher T21) successfully!' as final_status;
