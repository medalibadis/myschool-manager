-- =====================================================
-- INSERT STUDENTS INTO GROUP 2912
-- Group: ENG A2 | Teacher: رؤوف بوكوشة (T01)
-- Price: 6000 | Sessions: 12 | Start: 4/9/26
-- Time: THUR 18
-- =====================================================

-- Step 0: Create the group with explicit ID 2912
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2912, 
    'ENG A2 - Group 2912', 
    (SELECT id FROM teachers WHERE custom_id = 'T01' LIMIT 1), 
    'English', 
    'A2', 
    'Teens', 
    6000.00, 
    12, 
    '2026-04-09'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 23 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('ملاك بوغزالة', '657362752', NULL, 'حي الصحن الاول', true, 500.00, 2912, 0.00),
('يحي عدوكة', '661712820', NULL, 'حي الامير عبد القادر', true, 500.00, 2912, 0.00),
('احمد نزار بن عمر', '664101616', '558321178', 'حي النور البياضة', true, 500.00, 2912, 0.00),
('محمد علي محده', '661784433', NULL, 'حي المنظر الجميل', true, 500.00, 2912, 0.00),
('الاء خليل', '660876023', '775034890', 'حي الرمال', true, 500.00, 2912, 0.00),
('احمد مؤنس بحري', '666720921', NULL, '/', true, 500.00, 2912, 0.00),
('معاوية تواتي طليبة', '662494803', '0663581086', 'حي الشهداء', true, 500.00, 2912, 0.00),
('عبد الرحمان مكي2', '666331635', '0697129119', 'حي القواطين', true, 500.00, 2912, 0.00),
('بلقيس كرمادي', '780539896', NULL, 'حي 160 مسكن', true, 500.00, 2912, 0.00),
('محمد جاسم عاد', '661706980', NULL, 'حي الامير عبد القادر', true, 500.00, 2912, 0.00),
('اريام عيادي', '667414646', NULL, '.', true, 500.00, 2912, 0.00),
('فؤاد غنامي', '663601557', NULL, 'حي الشهداء', true, 500.00, 2912, 0.00),
('العربي بالعروسي', '556441626', NULL, 'حي الصحن الاول', true, 500.00, 2912, 0.00),
('اكرم بوصبيع العايش', '796705588', NULL, 'حي الشهداء', true, 500.00, 2912, 0.00),
('محمد ايهم شريط1', '554743235', '554743235', NULL, true, 500.00, 2912, 0.00),
('احمد شعيب بن علي', '658333341', NULL, 'حي النجار', true, 500.00, 2912, 0.00),
('شذا بن عمر', '782137822', NULL, 'حي 19 مارس', true, 500.00, 2912, 0.00),
('عثمان عباسي1', '657071212', NULL, 'البياضة', true, 500.00, 2912, 0.00),
('بشير وقادي1', '674444782', NULL, 'البياضة', true, 500.00, 2912, 0.00),
('حمزة شوية1', '699962496', NULL, 'حي النور', true, 500.00, 2912, 0.00),
('محمد مراد حمايدة', '669379280', NULL, 'البياضة', true, 500.00, 2912, 0.00),
('الياس سليماني', '559187443', NULL, '/', true, 500.00, 2912, 0.00);

-- Step 2: Link all 22 students to group 2912 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2912, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2912
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2912
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2912, 500.00, CURRENT_DATE, 'Registration fee - Group 2912', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2912
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2912 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2912;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2912;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2912 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2912 AND payment_type = 'registration_fee';

-- Show all students in group 2912
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2912
ORDER BY s.name;

SELECT '🎉 22 students added to Group 2912 (ENG A2 - Teacher T01) successfully!' as final_status;
