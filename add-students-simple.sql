-- Add students with same structure as first group (without second phone numbers)
-- Run this in Supabase SQL Editor

-- Insert students into waiting_list for "English A1+ Adults" group
-- All students have registration_fee_paid = true
-- Language: English, Level: A1+, Category: Adults
-- Structure matches the first group that worked

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
('قطر الندى بن عيسى', NULL, '555481112', 'حي 17 اكتوبر', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('الزهراء بن عون', NULL, '676132004', 'حي الصحن الاول', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('فاطمة الزهراء بالخير', NULL, '667878434', 'حي الشهداء', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('عائشة محمودي', NULL, '658502296', 'الجدلة', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('نورهان بشيري', NULL, '555481112', 'حي الناظور', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('ملاك بن عيسى', NULL, '676132004', 'حي النور', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('محمد الطاهر سروطي', NULL, '667878434', 'حي الفاتح ماي', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('العلمي الحاج عمر', NULL, '658502296', 'حي البياضة', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('محمد السعيد احمادي', NULL, '555481112', 'حي المصاعبة', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('فاتن زكور محمد', NULL, '676132004', 'حي الشهداء', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('عبد السلام زبيدي', NULL, '667878434', 'الطلايبية', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('نور الاسلام بكيشة', NULL, '658502296', 'حي القبة', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('ابراهيم حنكة 1', NULL, '555481112', 'حي الرمال', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('يزن سعدين', NULL, '676132004', 'سيدي مستور', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('مسعود فار', NULL, '667878434', 'حاسي خليفة', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('محمد ذيب', NULL, '658502296', 'البياضة', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('الساسي قدع', NULL, '555481112', 'حي الاصنام', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('وصال مومن مسعود', NULL, '676132004', 'الرباح', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('هارون سعود', NULL, '667878434', 'العواشير الرباح', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00),
('اشرف شوية', NULL, '658502296', 'حي عبد القادر', NULL, NULL, NULL, 0.00, 'English', 'A1+', 'Adults', NULL, true, 500.00);

-- Verify the insertions
SELECT 
    'Inserted Students' as status,
    COUNT(*) as total_students
FROM waiting_list 
WHERE name IN (
    'قطر الندى بن عيسى', 'الزهراء بن عون', 'فاطمة الزهراء بالخير', 'عائشة محمودي',
    'نورهان بشيري', 'ملاك بن عيسى', 'محمد الطاهر سروطي', 'العلمي الحاج عمر',
    'محمد السعيد احمادي', 'فاتن زكور محمد', 'عبد السلام زبيدي', 'نور الاسلام بكيشة',
    'ابراهيم حنكة 1', 'يزن سعدين', 'مسعود فار', 'محمد ذيب',
    'الساسي قدع', 'وصال مومن مسعود', 'هارون سعود', 'اشرف شوية'
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
    'قطر الندى بن عيسى', 'الزهراء بن عون', 'فاطمة الزهراء بالخير', 'عائشة محمودي',
    'نورهان بشيري', 'ملاك بن عيسى', 'محمد الطاهر سروطي', 'العلمي الحاج عمر',
    'محمد السعيد احمادي', 'فاتن زكور محمد', 'عبد السلام زبيدي', 'نور الاسلام بكيشة',
    'ابراهيم حنكة 1', 'يزن سعدين', 'مسعود فار', 'محمد ذيب',
    'الساسي قدع', 'وصال مومن مسعود', 'هارون سعود', 'اشرف شوية'
)
ORDER BY name;

SELECT '✅ 20 students added to waiting list for English A1+ Adults group!' as final_status;
