-- Insert English A1 Teens Group 2 into waiting list
-- Based on the provided names, addresses, and phone numbers

INSERT INTO "public"."waiting_list" ("name", "phone", "address", "second_phone", "language", "level", "category", "registration_fee_paid", "registration_fee_amount") VALUES
('احمد غسان بوكوشة', '550576060', 'حي 8 ماي 1945', NULL, 'English', 'A1', 'Teens', true, 500.00),
('عمار جاب الله 2', '662506610', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('بلال حشيفة', NULL, 'حي الناظور', NULL, 'English', 'A1', 'Teens', true, 500.00),
('نصر الدين قبلة', NULL, 'حي سيدي عبد الله', NULL, 'English', 'A1', 'Teens', true, 500.00),
('امجد احمادي', '660317318', 'حي الناظور', NULL, 'English', 'A1', 'Teens', true, 500.00),
('رسلان بن عمر', '662447172', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('شكري حنكة', '775444021', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('عمر شبرو', '665656487', 'حي النور', NULL, 'English', 'A1', 'Teens', true, 500.00),
('ياسين يوسف حشلاف', '542891290', 'حي النور', NULL, 'English', 'A1', 'Teens', true, 500.00),
('موسى زين', '697040497', 'حي الازدهار البياضة', NULL, 'English', 'A1', 'Teens', true, 500.00),
('حسن شرفي', '656406382', 'حي 8 ماي 1945', NULL, 'English', 'A1', 'Teens', true, 500.00),
('حسين شرفي', '656406382', 'حي الكوثر', NULL, 'English', 'A1', 'Teens', true, 500.00),
('اياد بالنور', '671359935', 'حي 19 مارس', NULL, 'English', 'A1', 'Teens', true, 500.00),
('اسكندر مدلل', '672392514', 'البياضة', NULL, 'English', 'A1', 'Teens', true, 500.00),
('عبد المهيمن ولابي', '667550161', 'البياضة', NULL, 'English', 'A1', 'Teens', true, 500.00),
('بلقاسم قماري', '661393943', 'مارس 19', NULL, 'English', 'A1', 'Teens', true, 500.00),
('احمد علي بن علي', '697495063', 'ماي 8', NULL, 'English', 'A1', 'Teens', true, 500.00),
('احمد ياسين قرفي 1', '660716181', 'الرباح', NULL, 'English', 'A1', 'Teens', true, 500.00),
('محمد حسان قرفي', '660716181', 'المصاعبة', NULL, 'English', 'A1', 'Teens', true, 500.00),
('اسينات قرفي', '772010281', 'رقيبة', NULL, 'English', 'A1', 'Teens', true, 500.00),
('ناصر رزيق', '667419041', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('بوبكر بابه', '667419041', 'حي النور', NULL, 'English', 'A1', 'Teens', true, 500.00),
('هيثم بن عمر', '663495480', 'حي المجاهدين', NULL, 'English', 'A1', 'Teens', true, 500.00);

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
