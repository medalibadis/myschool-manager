-- Insert students into waiting_list for "English A1+ Adults" group
-- All students have registration_fee_paid = true
-- Language: English, Level: A1+, Category: Adults

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
('حاج عمار قعر المثرد', NULL, '541059257', NULL, NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('خديجة معتوق', NULL, '541173928', 'حي باب الواد', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('اکرم بوصبيع العايش', NULL, '550466930', 'حي 502 مسكن', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('محمد ايهم شريط 1', NULL, '549760702', NULL, NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('محمد علوش', NULL, '698651040', 'حي الشهداء', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('اسماء علوش', NULL, '698651040', 'كوينين', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('هديل سموحي', NULL, '782134261', 'حي طلايبة', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('محمد العيد مسعي احمد', NULL, '660305919', 'البياضة', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('رواسي بن عمر', NULL, '675141897', NULL, NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('احمد مسعي احمد', NULL, '775581182', 'البياضة', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('وائل مسعي احمد 1', NULL, '660305919', 'البياضة', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('ضياء طليبة', NULL, '655862179', 'حي باب الواد', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('انجم يحي', NULL, '555948196', 'حي الشط', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('اميرة نينة', NULL, '542160463', NULL, NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('خالد عثماني', NULL, '699727207', 'كوينين', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('العيد فرحات', NULL, '770171828', NULL, NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('بشير خوازم', NULL, '671878091', NULL, NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('عبد الحق جديدي', NULL, '699836683', 'حي المجاهدين', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00);

-- Verify the insertions
SELECT 
    'Inserted Students' as status,
    COUNT(*) as total_students
FROM waiting_list 
WHERE name IN (
    'حاج عمار قعر المثرد', 'خديجة معتوق', 'اکرم بوصبيع العايش', 'محمد ايهم شريط 1',
    'محمد علوش', 'اسماء علوش', 'هديل سموحي', 'محمد العيد مسعي احمد',
    'رواسي بن عمر', 'احمد مسعي احمد', 'وائل مسعي احمد 1', 'ضياء طليبة',
    'انجم يحي', 'اميرة نينة', 'خالد عثماني', 'العيد فرحات',
    'بشير خوازم', 'عبد الحق جديدي'
);

-- Show all inserted students
SELECT 
    name,
    phone,
    address,
    language,
    level,
    category,
    registration_fee_paid,
    registration_fee_amount
FROM waiting_list 
WHERE name IN (
    'حاج عمار قعر المثرد', 'خديجة معتوق', 'اکرم بوصبيع العايش', 'محمد ايهم شريط 1',
    'محمد علوش', 'اسماء علوش', 'هديل سموحي', 'محمد العيد مسعي احمد',
    'رواسي بن عمر', 'احمد مسعي احمد', 'وائل مسعي احمد 1', 'ضياء طليبة',
    'انجم يحي', 'اميرة نينة', 'خالد عثماني', 'العيد فرحات',
    'بشير خوازم', 'عبد الحق جديدي'
)
ORDER BY name;

SELECT '✅ 18 students added to waiting list for English A1+ Adults group!' as final_status;
