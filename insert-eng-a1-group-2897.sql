-- Step 0: Create the group with explicit ID 2897
-- Note: We use a subquery to find the teacher's ID by name
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2897, 
    'ENG A1 - Group 2897', 
    (SELECT id FROM teachers WHERE name = 'ملاك وجدان شيحاني' LIMIT 1), 
    'English', 
    'A1', 
    'Teens', 
    6000.00, 
    12, 
    '2026-03-26'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 17 students into the students table
-- Using parent_phone for the second phone number
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('دارين بوترعة', '782269046', NULL, 'ام سلمى', true, 500.00, 2897, 0.00),
('اسيل بوترعة', '782269046', NULL, 'ام سلمى', true, 500.00, 2897, 0.00),
('يزن ضو', '660738091', '659640202', '.', true, 500.00, 2897, 0.00),
('احمد زياد سروطي', '673698256', NULL, 'حي الرمال', true, 500.00, 2897, 0.00),
('ادم سردوك', '655383939', '699975831', 'الرمال', true, 500.00, 2897, 0.00),
('عبد الرحمان هيبنه', '675608282', NULL, 'الرمال', true, 500.00, 2897, 0.00),
('عبد الرحمان تواتي احمد', '664026085', '698830641', 'حي الشهداء', true, 500.00, 2897, 0.00),
('محمد العربي باهي', '661848552', NULL, 'حي الرمال', true, 500.00, 2897, 0.00),
('بوبكر بكاري', '664960410', '664936282', 'حي الحرية', true, 500.00, 2897, 0.00),
('ملاك شلبي', '666001886', NULL, 'الرياح', true, 500.00, 2897, 0.00),
('حسين مشري', '668582969', '669304681', 'حي الصحن الاول', true, 500.00, 2897, 0.00),
('مريم قطوطة', '660158461', '660087268', 'حي منظر الجميل', true, 500.00, 2897, 0.00),
('اية قطوطة', '660158461', '660087268', 'حي المنظر الجميل', true, 500.00, 2897, 0.00),
('نور اليقين تواتي حمد', '698620401', '675109607', 'حي الرمال', true, 500.00, 2897, 0.00),
('نوريس غميمه', '560964005', NULL, 'حي 18 فيفري', true, 500.00, 2897, 0.00),
('ميمونة خليل', '660876023', '560319090', 'حي الرمال', true, 500.00, 2897, 0.00),
('ابرار بده', '663709056', NULL, 'الصحن الاول', true, 500.00, 2897, 0.00);

-- Step 2: Link all 17 students to group 2897 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2897, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2897
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2897
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2897, 500.00, CURRENT_DATE, 'Registration fee - Group 2897', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2897
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2897 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2897;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2897 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2897 AND payment_type = 'registration_fee';

-- Show all students in group 2897
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2897
ORDER BY s.name;

SELECT '🎉 17 students added to Group 2897 (ENG A1) successfully!' as final_status;
