-- Test query to check why students are not showing in suggested groups
-- Run this in Supabase SQL Editor to debug the issue

-- 1. Check if students exist in waiting_list
SELECT 
    'Students in waiting_list' as check_type,
    COUNT(*) as total_count
FROM waiting_list 
WHERE name IN (
    'قطر الندى بن عيسى', 'الزهراء بن عون', 'فاطمة الزهراء بالخير', 'عائشة محمودي',
    'نورهان بشيري', 'ملاك بن عيسى', 'محمد الطاهر سروطي', 'العلمي الحاج عمر',
    'محمد السعيد احمادي', 'فاتن زكور محمد', 'عبد السلام زبيدي', 'نور الاسلام بكيشة',
    'ابراهيم حنكة 1', 'يزن سعدين', 'مسعود فار', 'محمد ذيب',
    'الساسي قدع', 'وصال مومن مسعود', 'هارون سعود', 'اشرف شوية'
);

-- 2. Check the language, level, and category values
SELECT 
    name,
    language,
    level,
    category,
    registration_fee_paid,
    created_at
FROM waiting_list 
WHERE name IN (
    'قطر الندى بن عيسى', 'الزهراء بن عون', 'فاطمة الزهراء بالخير', 'عائشة محمودي',
    'نورهان بشيري', 'ملاك بن عيسى', 'محمد الطاهر سروطي', 'العلمي الحاج عمر',
    'محمد السعيد احمادي', 'فاتن زكور محمد', 'عبد السلام زبيدي', 'نور الاسلام بكيشة',
    'ابراهيم حنكة 1', 'يزن سعدين', 'مسعود فار', 'محمد ذيب',
    'الساسي قدع', 'وصال مومن مسعود', 'هارون سعود', 'اشرف شوية'
)
ORDER BY name;

-- 3. Check all students with English A1+ Adults combination
SELECT 
    'All English A1+ Adults students' as check_type,
    COUNT(*) as total_count
FROM waiting_list 
WHERE language = 'English' 
    AND level = 'A1+' 
    AND category = 'Adults';

-- 4. Show all English A1+ Adults students
SELECT 
    name,
    phone,
    address,
    language,
    level,
    category,
    registration_fee_paid,
    created_at
FROM waiting_list 
WHERE language = 'English' 
    AND level = 'A1+' 
    AND category = 'Adults'
ORDER BY created_at DESC;

-- 5. Check for any students with NULL values in key fields
SELECT 
    'Students with NULL values' as check_type,
    COUNT(*) as total_count
FROM waiting_list 
WHERE language IS NULL 
    OR level IS NULL 
    OR category IS NULL;

-- 6. Show students with NULL values
SELECT 
    name,
    language,
    level,
    category
FROM waiting_list 
WHERE language IS NULL 
    OR level IS NULL 
    OR category IS NULL;
