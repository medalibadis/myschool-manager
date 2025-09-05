-- Insert English A1 Teens Group 4 into waiting list
-- Based on the provided names, addresses, and phone numbers

INSERT INTO "public"."waiting_list" ("name", "phone", "address", "second_phone", "language", "level", "category", "registration_fee_paid", "registration_fee_amount") VALUES
('محمد البراء خنفور', '661670774', 'حي السروطي', NULL, 'English', 'A1', 'Teens', true, 500.00),
('البشير توانسة', '780199105', 'تكسبت', NULL, 'English', 'A1', 'Teens', true, 500.00),
('جمال قبلة', NULL, 'حي 8 ماي', NULL, 'English', 'A1', 'Teens', true, 500.00),
('ابرار ميهي', '655401547', 'حي الصح الاول', NULL, 'English', 'A1', 'Teens', true, 500.00),
('تقوى مسعي محمد', '659653017', 'حي 19 مارس', NULL, 'English', 'A1', 'Teens', true, 500.00),
('يونس باي', NULL, 'حي النزلة', NULL, 'English', 'A1', 'Teens', true, 500.00),
('جود موساوي', '667597488', 'مركز التكوين المهني للبنات', NULL, 'English', 'A1', 'Teens', true, 500.00),
('اليمان خنفور', '661670774', 'السروطي', NULL, 'English', 'A1', 'Teens', true, 500.00),
('رائد هارون مجول', '661383216', 'تكسبت', NULL, 'English', 'A1', 'Teens', true, 500.00),
('اسيل رزوق', '659607264', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('قصى عبد الحي زمال', '661409716', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('محمد منتصر شاوش', '663247741', 'نزلة', NULL, 'English', 'A1', 'Teens', true, 500.00),
('نمارق قدور', '661385786', 'اولاد احمد', NULL, 'English', 'A1', 'Teens', true, 500.00),
('نرجس بوراس', '555617954', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('عبد الرحمان مكي 2', '666331635', 'حي القواطين', NULL, 'English', 'A1', 'Teens', true, 500.00),
('عبد الرحمان سالمي', '553120304', 'حي 5 جويلية', NULL, 'English', 'A1', 'Teens', true, 500.00),
('رائد مهاوات', '667881466', 'حي الازدهار', NULL, 'English', 'A1', 'Teens', true, 500.00),
('محمد حسام هبيته', '663555170', 'حي 8 ماي', NULL, 'English', 'A1', 'Teens', true, 500.00),
('اية بكاري', '696527691', 'حي عبد القادر', NULL, 'English', 'A1', 'Teens', true, 500.00),
('حفصة بوصبيع صالح', '675299157', 'حي الكوثر', NULL, 'English', 'A1', 'Teens', true, 500.00),
('انس قدور', '771551815', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('محمد سراج الدين العوام', '699994043', 'حي الصحن الاول', NULL, 'English', 'A1', 'Teens', true, 500.00),
('طه بن عمر 1', '676132165', 'حي الصحن الاول', NULL, 'English', 'A1', 'Teens', true, 500.00),
('مروان بحري', '550189986', 'حي سيدي عبد الله', NULL, 'English', 'A1', 'Teens', true, 500.00),
('وائل بحري', '550189986', 'حي سيدي عبد الله', NULL, 'English', 'A1', 'Teens', true, 500.00),
('نرجس حنكة', '775444021', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('لجين فرجاني', '664785614', 'حي سيدي عبد الله', NULL, 'English', 'A1', 'Teens', true, 500.00),
('صفاء فرجاني', '794677634', 'حي سيدي عبد الله', NULL, 'English', 'A1', 'Teens', true, 500.00),
('حنين لخويمس', '664192473', 'حساني عبد الكريم', NULL, 'English', 'A1', 'Teens', true, 500.00),
('حنان فرجاني', '675295875', 'القارة الشرقية', NULL, 'English', 'A1', 'Teens', true, 500.00),
('نور اليقين عميار', '665983345', 'البياضة', NULL, 'English', 'A1', 'Teens', true, 500.00);

-- Verify the insertion
SELECT 
    'Inserted Students Count' as status,
    COUNT(*) as total_inserted,
    COUNT(CASE WHEN language = 'English' AND level = 'A1' AND category = 'Teens' THEN 1 END) as english_a1_teens
FROM waiting_list 
WHERE language = 'English' AND level = 'A1' AND category = 'Teens';

-- Show the inserted records
SELECT 
    'Inserted Records' as status,
    name,
    phone,
    address,
    language,
    level,
    category,
    registration_fee_paid,
    registration_fee_amount
FROM waiting_list 
WHERE language = 'English' AND level = 'A1' AND category = 'Teens'
ORDER BY name;

-- Show total count for all English A1 Teens
SELECT 
    'Total English A1 Teens' as status,
    COUNT(*) as total_students,
    COUNT(CASE WHEN phone IS NULL THEN 1 END) as students_without_phone,
    COUNT(CASE WHEN address = 'non' THEN 1 END) as students_without_address
FROM waiting_list 
WHERE language = 'English' AND level = 'A1' AND category = 'Teens';

-- Show summary of all waiting list students by category
SELECT 
    'Waiting List Summary' as status,
    language,
    level,
    category,
    COUNT(*) as student_count,
    SUM(registration_fee_amount) as total_registration_fees
FROM waiting_list 
GROUP BY language, level, category
ORDER BY language, level, category;
