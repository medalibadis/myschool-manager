-- =====================================================
-- INSERT STUDENTS INTO GROUP 2907
-- Group: FRN A1+ | Teacher: حسنة بوكوشة (T17)
-- Price: 5000 | Sessions: 12 | Start: 4/4/26
-- Time: FRI-SAT 10
-- =====================================================

-- Step 0: Create the group with explicit ID 2907
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2907, 
    'FRN A1+ - Group 2907', 
    (SELECT id FROM teachers WHERE custom_id = 'T17' LIMIT 1), 
    'French', 
    'A1+', 
    'Teens', 
    5000.00, 
    12, 
    '2026-04-04'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 19 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('اسينات دو', '666473228', '658131604', 'حي 19 مارس', true, 500.00, 2907, 0.00),
('رناد ميهي', '770929697', NULL, 'حي 8 ماي', true, 500.00, 2907, 0.00),
('عبد المعز مخيبر', '0790580456', '0665912177', 'حي الحرية اولاد تواتي', true, 500.00, 2907, 0.00),
('محمد زياد عطاالله', '770978152', '555785450', 'حي اولاد احمد', true, 500.00, 2907, 0.00),
('رنيم سعود', '662096329', NULL, NULL, true, 500.00, 2907, 0.00),
('مرام بحري', '662387001', '696272594', 'حي الرمال', true, 500.00, 2907, 0.00),
('ريتاج العايب', '666030205', NULL, 'حي الصحن', true, 500.00, 2907, 0.00),
('اكرام باسي', '661338017', NULL, 'البياضة', true, 500.00, 2907, 0.00),
('جنان باسي', '662303728', NULL, 'البياضة', true, 500.00, 2907, 0.00),
('معز قده', '660890625', '0773186837', 'حي الرمال', true, 500.00, 2907, 0.00),
('نور اليقين معطالله', '665929285', NULL, 'الصحن', true, 500.00, 2907, 0.00),
('قيس حميدي', '669224766', NULL, 'مارس 19', true, 500.00, 2907, 0.00),
('سدرة المنتهى خليل', '673052895', NULL, 'الصحن الاول', true, 500.00, 2907, 0.00),
('بتول سعودي', '698721634', NULL, 'حي تكسبت', true, 500.00, 2907, 0.00),
('ايلاف ميلودي', '663004245', NULL, 'حي 08 ماي', true, 500.00, 2907, 0.00),
('روان تركي', '667956358', NULL, '.', true, 500.00, 2907, 0.00),
('الاء غريسي', '698349781', NULL, 'حي الصحن الاول', true, 500.00, 2907, 0.00),
('جنى سعيد', '671163143', NULL, 'حي سيدي عبد الله', true, 500.00, 2907, 0.00);

-- Step 2: Link all 18 students to group 2907 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2907, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2907
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2907
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2907, 500.00, CURRENT_DATE, 'Registration fee - Group 2907', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2907
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2907 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2907;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2907;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2907 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2907 AND payment_type = 'registration_fee';

-- Show all students in group 2907
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2907
ORDER BY s.name;

SELECT '🎉 18 students added to Group 2907 (FRN A1+ - Teacher T17) successfully!' as final_status;
