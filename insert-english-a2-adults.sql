-- Insert English A2 Adults into waiting list
-- Based on the provided names, addresses, and phone numbers

INSERT INTO "public"."waiting_list" ("name", "phone", "address", "second_phone", "language", "level", "category", "registration_fee_paid", "registration_fee_amount") VALUES
('عمر قرفي', '666872117', 'حي الشهداء', NULL, 'English', 'A2', 'Adults', true, 500.00),
('اياد عبيد', '795603039', 'البياضة', NULL, 'English', 'A2', 'Adults', true, 500.00),
('حمود عطا الله', '660607734', 'حي النور', NULL, 'English', 'A2', 'Adults', true, 500.00),
('اميرة مالكي', '780627659', 'حي 8 ماي', NULL, 'English', 'A2', 'Adults', true, 500.00),
('زكرياء دركي', '675234649', 'حي 8 ماي', NULL, 'English', 'A2', 'Adults', true, 500.00),
('مخلص زكور محمد', '797108901', 'حي الشهداء', NULL, 'English', 'A2', 'Adults', true, 500.00),
('خالد مدلل', '699064796', 'حي الاستقلال - النزلة', NULL, 'English', 'A2', 'Adults', true, 500.00),
('الجموعي بن خليفة', '560949237', 'حي باب الوادي', NULL, 'English', 'A2', 'Adults', true, 500.00),
('انوار تي', '663402672', 'ام سلمی', NULL, 'English', 'A2', 'Adults', true, 500.00),
('احمد شوقي حنكة', '796915425', 'حي الرمال', NULL, 'English', 'A2', 'Adults', true, 500.00),
('عبد الباري ابراهيمي', '699824116', 'حي 18 فيفري', NULL, 'English', 'A2', 'Adults', true, 500.00),
('خير الدين وصيف فايزة', '557856858', 'حي المجاهدين', NULL, 'English', 'A2', 'Adults', true, 500.00),
('محمد الصادق حاج عمار', '775751221', 'حي الازدهار البياضة', NULL, 'English', 'A2', 'Adults', true, 500.00),
('مبارك نسيب', '669794231', 'حي المجاهدين', NULL, 'English', 'A2', 'Adults', true, 500.00),
('حسام هميسي', '770300616', 'حي النور', NULL, 'English', 'A2', 'Adults', true, 500.00),
('رحمة بوسنينة', '667717566', 'حي النور', NULL, 'English', 'A2', 'Adults', true, 500.00),
('زوليخة عاشور', '778324253', 'البياضة', NULL, 'English', 'A2', 'Adults', true, 500.00),
('اميمة قزي', '662445894', 'حي 8 ماي 1945', NULL, 'English', 'A2', 'Adults', true, 500.00),
('ابتهال قزي', '675388778', 'ماي 8', NULL, 'English', 'A2', 'Adults', true, 500.00),
('روان برشاوة', '673581405', 'اکتوبر 17', NULL, 'English', 'A2', 'Adults', true, 500.00),
('مبارك بن علي', '662568160', 'الرباح', NULL, 'English', 'A2', 'Adults', true, 500.00),
('المية بركاني', '664645150', 'حي الرمال', NULL, 'English', 'A2', 'Adults', true, 500.00),
('اکرم دعمش 1', '775494041', 'البياضة', NULL, 'English', 'A2', 'Adults', true, 500.00),
('یحی امیر مجول', '541947199', 'تكسبت', NULL, 'English', 'A2', 'Adults', true, 500.00),
('کمال حساني', '662887744', 'حساني عبد الكريم', NULL, 'English', 'A2', 'Adults', true, 500.00),
('قطر ندى بوقنة', '676625201', 'non', NULL, 'English', 'A2', 'Adults', true, 500.00),
('رانيا حدانه', '782269077', 'non', NULL, 'English', 'A2', 'Adults', true, 500.00),
('محسن الاطرش', '557176175', 'non', NULL, 'English', 'A2', 'Adults', true, 500.00);

-- Verify the insertion
SELECT 
    'Inserted Students Count' as status,
    COUNT(*) as total_inserted,
    COUNT(CASE WHEN language = 'English' AND level = 'A2' AND category = 'Adults' THEN 1 END) as english_a2_adults
FROM waiting_list 
WHERE language = 'English' AND level = 'A2' AND category = 'Adults';

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
WHERE language = 'English' AND level = 'A2' AND category = 'Adults'
ORDER BY name;
