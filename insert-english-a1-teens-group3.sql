-- Insert English A1 Teens Group 3 into waiting list
-- Based on the provided names, addresses, and phone numbers

INSERT INTO "public"."waiting_list" ("name", "phone", "address", "second_phone", "language", "level", "category", "registration_fee_paid", "registration_fee_amount") VALUES
('محمد منذر شايب', '770188979', '17 اكتوبر', NULL, 'English', 'A1', 'Teens', true, 500.00),
('ريتاج قزون', '657304904', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('محمد نذير قدة', '661119919', 'ام سلمی', NULL, 'English', 'A1', 'Teens', true, 500.00),
('علي قدة', '661119919', 'حي الصحن الاول', NULL, 'English', 'A1', 'Teens', true, 500.00),
('بيلسان العايب', '780586436', 'حي الصحن الاول', NULL, 'English', 'A1', 'Teens', true, 500.00),
('انفال العائب', '780586436', 'الصحن الاول', NULL, 'English', 'A1', 'Teens', true, 500.00),
('ابرار العائب', '780586436', 'حي المصاعبة', NULL, 'English', 'A1', 'Teens', true, 500.00),
('صالح قنوعة', '770901340', 'حي 18 فيفري', NULL, 'English', 'A1', 'Teens', true, 500.00),
('فاطمة فالح', '673852799', 'حي الصحن 1', NULL, 'English', 'A1', 'Teens', true, 500.00),
('رتيل ميهي', '655401547', 'ماي 08', NULL, 'English', 'A1', 'Teens', true, 500.00),
('محمد طه هبيته', '663555170', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('ريحانة بوغزالة', '698120303', 'حي الامبر عبد القادر', NULL, 'English', 'A1', 'Teens', true, 500.00),
('انس بن ساسي', '560062202', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('الطاهر وليد بكاري', '696527691', 'حي الصحن الاول', NULL, 'English', 'A1', 'Teens', true, 500.00),
('جوري عثماني', '784373703', 'حي المصاعبه', NULL, 'English', 'A1', 'Teens', true, 500.00),
('وائل بوغزالة', '698120303', 'البياضة', NULL, 'English', 'A1', 'Teens', true, 500.00),
('رنيم تجاني', '662632606', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('احمد تقي الرحمان غربي', '665156076', 'حي الصحن الاول', NULL, 'English', 'A1', 'Teens', true, 500.00);

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
