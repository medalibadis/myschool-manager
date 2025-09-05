-- Insert English A2 Adults Group 2 into waiting list
-- Based on the provided names, addresses, and phone numbers

INSERT INTO "public"."waiting_list" ("name", "phone", "address", "second_phone", "language", "level", "category", "registration_fee_paid", "registration_fee_amount") VALUES
('احمد رائد خنفور', '661670774', 'حي السروطي', '668300574', 'English', 'A2', 'Adults', true, 500.00),
('خديجة علاهم', '780572396', 'ص.ب 187 حي 17 اكتوبر الوادي', NULL, 'English', 'A2', 'Adults', true, 500.00),
('عبد القادر عزام عويد', '697839866', 'تغزوت', NULL, 'English', 'A2', 'Adults', true, 500.00),
('منال شريط', '549150108', 'حي اول نوفمبر', NULL, 'English', 'A2', 'Adults', true, 500.00),
('اشرف بدادة', '668747849', 'حي الرمال', '673712048', 'English', 'A2', 'Adults', true, 500.00),
('نجاة علاهم', '782269305', 'حي 400 مسكن', NULL, 'English', 'A2', 'Adults', true, 500.00),
('صبرة شلبي', '699203090', 'حي ام سلمى', NULL, 'English', 'A2', 'Adults', true, 500.00),
('ام الهناء بن عون', '659913631', 'حي اولاد احمد', NULL, 'English', 'A2', 'Adults', true, 500.00),
('انفال مسعي محمد', '671192111', 'حي الرمال', NULL, 'English', 'A2', 'Adults', true, 500.00),
('خليفة سويد', NULL, 'مارس 19', NULL, 'English', 'A2', 'Adults', true, 500.00),
('احمد الصالح سباع', '697554465', 'حي المجاهدين', NULL, 'English', 'A2', 'Adults', true, 500.00),
('رونق العوامر', '553253397', 'حي الصحن الاول', NULL, 'English', 'A2', 'Adults', true, 500.00),
('مرجانة بوغزالة', '698120303', 'حي الصحن', NULL, 'English', 'A2', 'Adults', true, 500.00),
('امل سوید', '774700597', 'حي سيدي عبد الله', NULL, 'English', 'A2', 'Adults', true, 500.00),
('بشری سباق محمد', '668437146', 'حي 19 مارس', NULL, 'English', 'A2', 'Adults', true, 500.00),
('مسعود تامة', '782947191', 'حي المنظر الجميل', NULL, 'English', 'A2', 'Adults', true, 500.00),
('هداية هبيته', '663555170', '1945 حي 8 ماي', NULL, 'English', 'A2', 'Adults', true, 500.00),
('سيرين سالمي 1', '661385880', 'حي المصاعبة', '770574334', 'English', 'A2', 'Adults', true, 500.00),
('اكرام هبة الرحمان ذياب', '665700838', 'حي الاعشاش', NULL, 'English', 'A2', 'Adults', true, 500.00),
('ايمان ذياب', '665700838', 'حي الاعشاش', NULL, 'English', 'A2', 'Adults', true, 500.00),
('لمية بركاني', '662445894', 'حي الرمال', NULL, 'English', 'A2', 'Adults', true, 500.00),
('اسماعيل صوادقية', '669229948', 'حي الشهداء', NULL, 'English', 'A2', 'Adults', true, 500.00),
('جمانة بوغزالة', '795251992', 'الصحن الاول', NULL, 'English', 'A2', 'Adults', true, 500.00);

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
    second_phone,
    language,
    level,
    category,
    registration_fee_paid,
    registration_fee_amount
FROM waiting_list 
WHERE language = 'English' AND level = 'A2' AND category = 'Adults'
ORDER BY name;

-- Show total count for all English A2 Adults
SELECT 
    'Total English A2 Adults' as status,
    COUNT(*) as total_students,
    COUNT(CASE WHEN second_phone IS NOT NULL THEN 1 END) as students_with_second_phone
FROM waiting_list 
WHERE language = 'English' AND level = 'A2' AND category = 'Adults';
