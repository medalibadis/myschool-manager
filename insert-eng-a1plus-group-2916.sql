-- =====================================================
-- INSERT STUDENTS INTO GROUP 2916
-- Group: ENG A1+ | Teacher: حنان لقميري (T11)
-- Price: 6000 | Sessions: 12 | Start: 4/11/26
-- Time: FRI-SAT 18
-- =====================================================

-- Step 0: Create the group with explicit ID 2916
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2916, 
    'ENG A1+ - Group 2916', 
    (SELECT id FROM teachers WHERE custom_id = 'T11' LIMIT 1), 
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

-- Step 1: Insert 11 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('مريم غدير مداني', '664426267', NULL, 'حي المصاعبة-الوادي', true, 500.00, 2916, 0.00),
('خلود زيتوني', '672360642', '782854240', 'حي 18 فيفري', true, 500.00, 2916, 0.00),
('ريتاج حليلات', '771332456', '662783812', '/', true, 500.00, 2916, 0.00),
('محمد الامين نصيرة', '550109504', '697908994', 'فاتح ماي', true, 500.00, 2916, 0.00),
('قطر الندى نصيرة2', '772505013', '697908994', 'حي الفاتح ماي', true, 500.00, 2916, 0.00),
('اياد غزال', '655617104', '556992463', 'حي باب الواد', true, 500.00, 2916, 0.00),
('منير زهواني', '675811243', NULL, 'ابن باديس', true, 500.00, 2916, 0.00),
('مريم حميده', '662096625', '668389095', 'حي اولاد احمد الوادي', true, 500.00, 2916, 0.00),
('نهى حميده', '662096625', '668389095', 'حي اولاد احمد الوادي', true, 500.00, 2916, 0.00),
('ساجدة بده', '663709056', NULL, 'حي الصحن الاول', true, 500.00, 2916, 0.00),
('ريتاج بده', '782268902', NULL, 'حي الصحن الاول', true, 500.00, 2916, 0.00);

-- Step 2: Link all 11 students to group 2916 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2916, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2916
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2916
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2916, 500.00, CURRENT_DATE, 'Registration fee - Group 2916', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2916
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2916 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2916;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2916;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2916 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2916 AND payment_type = 'registration_fee';

-- Show all students in group 2916
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2916
ORDER BY s.name;

SELECT '🎉 11 students added to Group 2916 (ENG A1+ - Teacher T11) successfully!' as final_status;
