-- =====================================================
-- INSERT STUDENTS INTO GROUP 2906
-- Group: ENG A2 | Teacher: ندى دربال (T16)
-- Price: 6000 | Sessions: 12 | Start: 4/3/26
-- Time: FRI-SAT 18
-- =====================================================

-- Step 0: Create the group with explicit ID 2906
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2906, 
    'ENG A2 - Group 2906', 
    (SELECT id FROM teachers WHERE custom_id = 'T16' LIMIT 1), 
    'English', 
    'A2', 
    'Teens', 
    6000.00, 
    12, 
    '2026-04-03'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 11 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('عبد المعز مخيبر', '0790580456', '0665912177', 'حي الحرية اولاد تواتي', true, 500.00, 2906, 0.00),
('رفيف فرجاني', '666502535', NULL, 'حي 18 فيفري', true, 500.00, 2906, 0.00),
('يحي لبرارة', '660351435', '559311187', 'حي 18 فيفري', true, 500.00, 2906, 0.00),
('رفيدة باهي', '698000600', NULL, 'الصحن الاول', true, 500.00, 2906, 0.00),
('احمد سوده', '770334830', '676734761', 'حي اولاد احمد', true, 500.00, 2906, 0.00),
('محمد سوده', '770334830', '676734761', 'حي اولاد حمد', true, 500.00, 2906, 0.00),
('مجاهد مبروك حمتين', '795352220', '673282828', 'حي الصحن الاول', true, 500.00, 2906, 0.00),
('محمد يزن هبيته', '66138364', '668087048', 'حي الصحن الاول', true, 500.00, 2906, 0.00),
('قصي تواتي طليبة', '664019544', '0697203860', 'حي الصحن الاول', true, 500.00, 2906, 0.00),
('قمر الشام قبطوبي', '0776027557', '0699934404', 'الازدهار البياضة', true, 500.00, 2906, 0.00),
('ايوب نويلي', '770483491', '555178305', 'الامير عبد القادر', true, 500.00, 2906, 0.00);

-- Step 2: Link all 11 students to group 2906 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2906, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2906
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2906
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2906, 500.00, CURRENT_DATE, 'Registration fee - Group 2906', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2906
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2906 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2906;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2906;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2906 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2906 AND payment_type = 'registration_fee';

-- Show all students in group 2906
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2906
ORDER BY s.name;

SELECT '🎉 11 students added to Group 2906 (ENG A2 - Teacher T16) successfully!' as final_status;
