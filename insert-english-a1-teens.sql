-- Insert English A1 Teens into waiting list
-- Based on the provided names, addresses, and phone numbers

INSERT INTO "public"."waiting_list" ("name", "phone", "address", "second_phone", "language", "level", "category", "registration_fee_paid", "registration_fee_amount") VALUES
('خولة شعبان', '676830065', 'حي S7:36 علي دربال البياضة', NULL, 'English', 'A1', 'Teens', true, 500.00),
('يحي عدوكة', '661712820', 'البياضة', NULL, 'English', 'A1', 'Teens', true, 500.00),
('محمد رضوان صولي', '771736261', 'حي الامير عبد القادر', NULL, 'English', 'A1', 'Teens', true, 500.00),
('محمد انيس حميدات', '671877864', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('محمد الصادق مباركي', '774662711', 'حي المنظر الجميل', NULL, 'English', 'A1', 'Teens', true, 500.00),
('محمد علي محده', '661784433', 'حي النور', NULL, 'English', 'A1', 'Teens', true, 500.00),
('لخضر فنيك', '699584200', 'حي الكوثر', NULL, 'English', 'A1', 'Teens', true, 500.00),
('رشيد حدانه', '554020302', 'حي المجاهدين', NULL, 'English', 'A1', 'Teens', true, 500.00),
('منال شريط 1', '674222444', 'حي السلام', NULL, 'English', 'A1', 'Teens', true, 500.00),
('نور اليقين مرغادي', '673083881', 'حي السلام البياضة', NULL, 'English', 'A1', 'Teens', true, 500.00),
('مبارك نسيب', '669794231', 'حي المصاعبة', NULL, 'English', 'A1', 'Teens', true, 500.00),
('يوسف رضواني', '791894948', 'الصحن الاول', NULL, 'English', 'A1', 'Teens', true, 500.00),
('عبد السلام حاج عمار', '658581082', 'حي السلام رقيبة', NULL, 'English', 'A1', 'Teens', true, 500.00),
('مبارك شيحاني', '664877262', 'حي الاعشاش', NULL, 'English', 'A1', 'Teens', true, 500.00),
('صبرينة وادات', '655244291', 'حي الشهداء', NULL, 'English', 'A1', 'Teens', true, 500.00),
('الساسي زاوي', '673894635', 'حي اولاد احمد', NULL, 'English', 'A1', 'Teens', true, 500.00),
('ايمان جابر', '780125167', 'تكسبت الغربية', NULL, 'English', 'A1', 'Teens', true, 500.00),
('سعيدة عريف', '659045020', 'حي اول نوفمبر', NULL, 'English', 'A1', 'Teens', true, 500.00),
('اريام عيادي', '667414646', 'حي 19 مارس', NULL, 'English', 'A1', 'Teens', true, 500.00),
('عائشة بن عتوسى', '668913565', 'حي 8 ماي 1945', NULL, 'English', 'A1', 'Teens', true, 500.00),
('فؤاد غنامي', '663601557', 'حي 18 فيفري', NULL, 'English', 'A1', 'Teens', true, 500.00),
('يمينة منصر', '659042426', 'مارس 19', NULL, 'English', 'A1', 'Teens', true, 500.00),
('زوبيدة جديدي', '783155000', 'فيفري 18', NULL, 'English', 'A1', 'Teens', true, 500.00),
('عبد القادر كرمادي', '667816737', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('العربي بالعروسي', '556441626', 'حي السلام البياضة', NULL, 'English', 'A1', 'Teens', true, 500.00),
('حذيفة شعباني', '664101662', 'الصحن الاول', NULL, 'English', 'A1', 'Teens', true, 500.00),
('دعاء شعباني', '664101662', 'non', NULL, 'English', 'A1', 'Teens', true, 500.00),
('ماريا بحري', '672774887', 'non', NULL, 'English', 'A1', 'Teens', true, 500.00),
('تاج الدين قروي', '698505450', 'non', NULL, 'English', 'A1', 'Teens', true, 500.00),
('رانيا حدانه', '775494041', 'حي الرمال', NULL, 'English', 'A1', 'Teens', true, 500.00),
('عبد الواحد زكري', '697525060', 'حي النور', NULL, 'English', 'A1', 'Teens', true, 500.00),
('فاتح دیده', '660606140', 'حي المجاهدين', NULL, 'English', 'A1', 'Teens', true, 500.00),
('صفوان غدير عمر', '561733311', 'حي الشهداء', NULL, 'English', 'A1', 'Teens', true, 500.00),
('اسماء رزاق سالم', '659536453', 'حي اولاد احمد', NULL, 'English', 'A1', 'Teens', true, 500.00);

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
