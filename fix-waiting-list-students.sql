-- Fix script to ensure students appear in suggested groups
-- Run this in Supabase SQL Editor

-- Update the students to ensure they have the correct format
UPDATE waiting_list 
SET 
    language = 'English',
    level = 'A1+',
    category = 'Adults',
    registration_fee_paid = true,
    registration_fee_amount = 500.00
WHERE name IN (
    'قطر الندى بن عيسى', 'الزهراء بن عون', 'فاطمة الزهراء بالخير', 'عائشة محمودي',
    'نورهان بشيري', 'ملاك بن عيسى', 'محمد الطاهر سروطي', 'العلمي الحاج عمر',
    'محمد السعيد احمادي', 'فاتن زكور محمد', 'عبد السلام زبيدي', 'نور الاسلام بكيشة',
    'ابراهيم حنكة 1', 'يزن سعدين', 'مسعود فار', 'محمد ذيب',
    'الساسي قدع', 'وصال مومن مسعود', 'هارون سعود', 'اشرف شوية'
);

-- Verify the update
SELECT 
    'Updated Students' as status,
    COUNT(*) as total_students
FROM waiting_list 
WHERE name IN (
    'قطر الندى بن عيسى', 'الزهراء بن عون', 'فاطمة الزهراء بالخير', 'عائشة محمودي',
    'نورهان بشيري', 'ملاك بن عيسى', 'محمد الطاهر سروطي', 'العلمي الحاج عمر',
    'محمد السعيد احمادي', 'فاتن زكور محمد', 'عبد السلام زبيدي', 'نور الاسلام بكيشة',
    'ابراهيم حنكة 1', 'يزن سعدين', 'مسعود فار', 'محمد ذيب',
    'الساسي قدع', 'وصال مومن مسعود', 'هارون سعود', 'اشرف شوية'
)
AND language = 'English' 
AND level = 'A1+' 
AND category = 'Adults';

-- Show the updated students
SELECT 
    name,
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

SELECT '✅ Students updated successfully! Refresh the waiting list page to see them in suggested groups.' as final_status;
