-- =====================================================
-- INSERT STUDENTS INTO GROUP 2921
-- Group: ENG A1+ | Teacher: جهينة قرار (T05)
-- Price: 6000 | Sessions: 12 | Start: 4/18/26
-- Time: FRI-SAT 8:00
-- =====================================================

-- Step 0: Create the group with explicit ID 2921
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2921, 
    'ENG A1+ - Group 2921', 
    (SELECT id FROM teachers WHERE custom_id = 'T05' LIMIT 1), 
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

-- Step 1: Insert 12 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('عبد السميع مبروك بن سعيد', '660391640', NULL, 'البياضة', true, 500.00, 2921, 0.00),
('رنيم سعود', '662096329', NULL, '/', true, 500.00, 2921, 0.00),
('ماريا حدانه', '556579070', NULL, 'حي 400 سكن', true, 500.00, 2921, 0.00),
('سدرة المنتهى خليل', '673052895', NULL, 'الصحن الاول', true, 500.00, 2921, 0.00),
('يوسف حميدة', '673268542', NULL, 'حي الصحن 1', true, 500.00, 2921, 0.00),
('محمد اسحاق هبيته', '661398364', NULL, 'حي الصحن 1', true, 500.00, 2921, 0.00),
('نوح تواتي طليبة', '664019544', NULL, 'حي الصحن 1', true, 500.00, 2921, 0.00),
('بتول سعودي', '698721634', NULL, 'حي تكسبت', true, 500.00, 2921, 0.00),
('ايلاف ميلودي', '663004245', NULL, 'حي 08 ماي', true, 500.00, 2921, 0.00),
('روان تركي', '667956358', NULL, '.', true, 500.00, 2921, 0.00),
('ريم حدانه', '557866410', '556579070', 'حي 400 سكن', true, 500.00, 2921, 0.00),
('ضحى عبد الملك', '668022323', NULL, 'الامير عبد القادر', true, 500.00, 2921, 0.00);

-- Step 2: Link all 12 students to group 2921 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2921, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2921
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2921
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2921, 500.00, CURRENT_DATE, 'Registration fee - Group 2921', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2921
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2921 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2921;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2921;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2921 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2921 AND payment_type = 'registration_fee';

-- Show all students in group 2921
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2921
ORDER BY s.name;

SELECT '🎉 12 students added to Group 2921 (ENG A1+ - Teacher T05) successfully!' as final_status;
