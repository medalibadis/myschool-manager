-- Insert students into waiting_list for "English B1 Adults" group
-- All students have registration_fee_paid = true
-- Language: English, Level: B1, Category: Adults

INSERT INTO waiting_list (
    name,
    email,
    phone,
    address,
    birth_date,
    parent_name,
    second_phone,
    default_discount,
    language,
    level,
    category,
    notes,
    registration_fee_paid,
    registration_fee_amount
) VALUES
('سفيان عبيد', NULL, '775370239', 'الرمال', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('ريم باي', NULL, NULL, 'حي 8 ماي', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('رميصاء غيلاني', NULL, '674906028', 'حي المصاعبة', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('محمد الطاهر بشيري', NULL, '673403962', 'حي 19 مارس', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('روان بيوضة', NULL, '661707864', 'المديرية الولائية للضرائب - الوادي', NULL, NULL, '665050068', 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('لوجين باي', NULL, '659080707', 'حي النور', NULL, NULL, '776131224', 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('يوسف شيخة', NULL, '557251319', 'حي 160 سكن', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('احمد سامى سوفية', NULL, '669005980', 'النخلة', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('ابي سوفية', NULL, '669005980', 'النخلة', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('محمد وسيم صوالح احميمة', NULL, '780522216', 'حي النور', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('ضحى مهاوة', NULL, '655022086', 'حي 17 اكتوبر', NULL, NULL, '560295019', 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('سارة بن عيسى', NULL, '657013042', 'حي النور', NULL, NULL, '697436315', 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('اسماعيل تقي الدين بن عيسى', NULL, '799441407', 'حي النور', NULL, NULL, '697496315', 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('محمد امين بوذينة', NULL, '668442895', 'الثامن ماي', NULL, NULL, '778820941', 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('صفية مهاوة', NULL, '560295019', 'حي 17 اكتوبر', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('ريان تجانی', NULL, '795210448', 'حي 18 فيفري', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('يوسف تواتي 1', NULL, '672928841', 'حي الكوثر', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('هديل قماري', NULL, '664505999', 'حي النصر تغزوت', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('يسرى هويدي', NULL, '672564554', 'سيدي عبد الله', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('محمد الصغير سويد', NULL, '556453360', 'حي سيدي عبد الله', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('زكرياء بحري 2', NULL, '551984025', 'حي الطلايبة', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('نسرين سموحي', NULL, '782134261', 'ام سلمى', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('ايوب قریرح', NULL, '672870139', 'حساني عبد الكريم', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('محمد ياسين هويدي', NULL, '672564554', 'non', NULL, NULL, NULL, 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00),
('ندى حاشی', NULL, '661247383', 'non', NULL, NULL, '664282423', 0.00, 'English', 'B1', 'Adults', NULL, true, 500.00);

-- Verify the insertions
SELECT 
    'Inserted Students' as status,
    COUNT(*) as total_students
FROM waiting_list 
WHERE name IN (
    'سفيان عبيد', 'ريم باي', 'رميصاء غيلاني', 'محمد الطاهر بشيري', 'روان بيوضة',
    'لوجين باي', 'يوسف شيخة', 'احمد سامى سوفية', 'ابي سوفية', 'محمد وسيم صوالح احميمة',
    'ضحى مهاوة', 'سارة بن عيسى', 'اسماعيل تقي الدين بن عيسى', 'محمد امين بوذينة', 'صفية مهاوة',
    'ريان تجانی', 'يوسف تواتي 1', 'هديل قماري', 'يسرى هويدي', 'محمد الصغير سويد',
    'زكرياء بحري 2', 'نسرين سموحي', 'ايوب قریرح', 'محمد ياسين هويدي', 'ندى حاشی'
);

-- Show all inserted students
SELECT 
    name,
    phone,
    address,
    second_phone,
    language,
    level,
    category,
    registration_fee_paid,
    registration_fee_amount
FROM waiting_list 
WHERE name IN (
    'سفيان عبيد', 'ريم باي', 'رميصاء غيلاني', 'محمد الطاهر بشيري', 'روان بيوضة',
    'لوجين باي', 'يوسف شيخة', 'احمد سامى سوفية', 'ابي سوفية', 'محمد وسيم صوالح احميمة',
    'ضحى مهاوة', 'سارة بن عيسى', 'اسماعيل تقي الدين بن عيسى', 'محمد امين بوذينة', 'صفية مهاوة',
    'ريان تجانی', 'يوسف تواتي 1', 'هديل قماري', 'يسرى هويدي', 'محمد الصغير سويد',
    'زكرياء بحري 2', 'نسرين سموحي', 'ايوب قریرح', 'محمد ياسين هويدي', 'ندى حاشی'
)
ORDER BY name;

SELECT '✅ 25 students added to waiting list for English B1 Adults group!' as final_status;
