-- =====================================================
-- INSERT STUDENTS INTO GROUP 2920
-- Group: ENG A2 | Teacher: شيحاني ملاك وجدان (T15)
-- Price: 6000 | Sessions: 12 | Start: 4/17/26
-- Time: FRI-SAT 16:00
-- =====================================================

-- Step 0: Create the group with explicit ID 2920
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2920, 
    'ENG A2 - Group 2920', 
    (SELECT id FROM teachers WHERE custom_id = 'T15' LIMIT 1), 
    'English', 
    'A2', 
    'Teens', 
    6000.00, 
    12, 
    '2026-04-17'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 19 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('اسينات دو', '666473228', '658131604', 'حي 19 مارس', true, 500.00, 2920, 0.00),
('اصالة مهري', '676706379', NULL, 'حي ام سلمى', true, 500.00, 2920, 0.00),
('فاطمة الزهراء حم عيد', '794780674', '669997889', 'حي المصاعبة', true, 500.00, 2920, 0.00),
('ياسين بوقطاية', '555213999', NULL, 'المصاعبة', true, 500.00, 2920, 0.00),
('يعقوب سروطي2', '673698256', '0555832855', 'حي الرمال', true, 500.00, 2920, 0.00),
('خلود شاوش', '663247741', NULL, 'حي النزلة', true, 500.00, 2920, 0.00),
('محمد قمودي', '668535853', '555288887', 'مارس 19', true, 500.00, 2920, 0.00),
('رهف فرجاني', '667016283', NULL, 'فيفري 18', true, 500.00, 2920, 0.00),
('اسامة هبيته', '699934404', NULL, 'حي 19 مارس', true, 500.00, 2920, 0.00),
('سارة كناوية', '662156591', NULL, 'حي 19 مارس', true, 500.00, 2920, 0.00),
('محمد الحبيب قده', '660890734', NULL, 'حي الرمال', true, 500.00, 2920, 0.00),
('ردينة غميمة', '666919147', '661123512', 'الشط', true, 500.00, 2920, 0.00),
('سيف الدين بولوسة', '664463059', NULL, 'حي باب الوادي', true, 500.00, 2920, 0.00),
('محمد الصالح زين', '698982633', NULL, 'حي النجار', true, 500.00, 2920, 0.00),
('نذير قصير', '661525257', NULL, 'حي تكسبت', true, 500.00, 2920, 0.00),
('محمد نعرورة', '773192637', NULL, 'حي الكوثر الوادي', true, 500.00, 2920, 0.00),
('نهى عدوكة', '662049634', NULL, NULL, true, 500.00, 2920, 0.00),
('ايلاف حاج احمد', '662618869', NULL, NULL, true, 500.00, 2920, 0.00);

-- Step 2: Link all 18 students to group 2920 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2920, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2920
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2920
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2920, 500.00, CURRENT_DATE, 'Registration fee - Group 2920', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2920
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2920 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2920;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2920;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2920 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2920 AND payment_type = 'registration_fee';

-- Show all students in group 2920
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2920
ORDER BY s.name;

SELECT '🎉 18 students added to Group 2920 (ENG A2 - Teacher T15) successfully!' as final_status;
