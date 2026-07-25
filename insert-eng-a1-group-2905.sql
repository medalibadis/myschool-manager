-- =====================================================
-- INSERT STUDENTS INTO GROUP 2905
-- Group: ENG A1 | Teacher: ايمان شرفي (T22)
-- Price: 6000 | Sessions: 12 | Start: 4/3/26
-- Time: FRI-SAT 18:00
-- =====================================================

-- Step 0: Create the group with explicit ID 2905
INSERT INTO groups (id, name, teacher_id, language, level, category, price, total_sessions, start_date)
SELECT 
    2905, 
    'ENG A1 - Group 2905', 
    (SELECT id FROM teachers WHERE custom_id = 'T22' LIMIT 1), 
    'English', 
    'A1', 
    'Teens', 
    6000.00, 
    12, 
    '2026-04-03'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_sessions = EXCLUDED.total_sessions;

-- Step 1: Insert 16 students into the students table
INSERT INTO students (name, phone, parent_phone, address, registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount)
VALUES
('فاطمة الزهراء مهرية1', '699898932', '782197443', 'حي الصحن الاول', true, 500.00, 2905, 0.00),
('ياسين لبرارة', '660351435', NULL, 'حي 18 فيفري', true, 500.00, 2905, 0.00),
('محمد امجد تجاني', '656285647', NULL, 'الرمال', true, 500.00, 2905, 0.00),
('دانيا بوالعام', '674451133', NULL, 'حي القارة الشرقية', true, 500.00, 2905, 0.00),
('محمد البشير صوالح عمار', '660198812', '658250062', 'ورماس', true, 500.00, 2905, 0.00),
('ضياء الدين سعدون', '555237447', NULL, 'حي الكثبان', true, 500.00, 2905, 0.00),
('تاج الدين نجية', '559546311', '674839181', 'حي الرمال', true, 500.00, 2905, 0.00),
('اريج سعدون', '555237447', NULL, 'حي الكثبان', true, 500.00, 2905, 0.00),
('زينب ملوكه', '698304178', NULL, 'طرفاوي', true, 500.00, 2905, 0.00),
('الين بلهادف', '667424848', NULL, 'القارة', true, 500.00, 2905, 0.00),
('اروى حمتين', '795352220', '673282828', 'حي الصحن الاول', true, 500.00, 2905, 0.00),
('رفيف رحماني', '799996234', '799471545', 'حي الرمال', true, 500.00, 2905, 0.00),
('سدرة المنتهى تومي', '664631714', NULL, 'حي 19 مارس', true, 500.00, 2905, 0.00),
('عبد المالك الليبي', '661107233', '0782941636', 'حي سيدي مستور', true, 500.00, 2905, 0.00),
('دانيا دودي', '667932193', '0670117070', 'حي فاتح ماي', true, 500.00, 2905, 0.00),
('احمد امين حفوظة', '0697161673', '664120042', 'حي الرمال', true, 500.00, 2905, 0.00);

-- Step 2: Link all 16 students to group 2905 via student_groups junction table
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, 2905, 'active'
FROM students s
WHERE s.registration_fee_group_id = 2905
  AND NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = 2905
  );

-- Step 3: Create registration fee payments for each student
INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type, admin_name)
SELECT s.id, 2905, 500.00, CURRENT_DATE, 'Registration fee - Group 2905', 'registration_fee', 'Dalila'
FROM students s
WHERE s.registration_fee_group_id = 2905
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.student_id = s.id AND p.group_id = 2905 AND p.payment_type = 'registration_fee'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check group was created
SELECT 
    '✅ Group Created' as status,
    id, name, language, level, price, total_sessions, start_date
FROM groups 
WHERE id = 2905;

-- Check students were inserted
SELECT 
    '✅ Students Inserted' as status,
    COUNT(*) as total_students
FROM students 
WHERE registration_fee_group_id = 2905;

-- Check student_groups links
SELECT 
    '✅ Group Links Created' as status,
    COUNT(*) as total_links
FROM student_groups 
WHERE group_id = 2905 AND status = 'active';

-- Check registration fee payments
SELECT 
    '✅ Registration Fee Payments' as status,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments 
WHERE group_id = 2905 AND payment_type = 'registration_fee';

-- Show all students in group 2905
SELECT 
    s.custom_id,
    s.name,
    s.phone,
    s.parent_phone as second_phone,
    s.address,
    sg.status as group_status
FROM students s
JOIN student_groups sg ON s.id = sg.student_id
WHERE sg.group_id = 2905
ORDER BY s.name;

SELECT '🎉 16 students added to Group 2905 (ENG A1 - Teacher T22) successfully!' as final_status;
