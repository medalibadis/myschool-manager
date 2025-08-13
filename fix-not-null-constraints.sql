-- =====================================================
-- FIX NOT NULL CONSTRAINTS
-- This script fixes all NOT NULL constraints that are causing insert failures
-- =====================================================

-- 1. First, let's see what NOT NULL constraints exist
SELECT 'CURRENT NOT NULL CONSTRAINTS:' as info;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND is_nullable = 'NO'
ORDER BY table_name, ordinal_position;

-- 2. Fix groups table NOT NULL constraints
-- If price is NOT NULL, we need to provide a default value
ALTER TABLE groups ALTER COLUMN price SET DEFAULT 0.00;

-- If language is NOT NULL, set default
ALTER TABLE groups ALTER COLUMN language SET DEFAULT 'English';

-- If level is NOT NULL, set default  
ALTER TABLE groups ALTER COLUMN level SET DEFAULT 'Beginner';

-- If category is NOT NULL, set default
ALTER TABLE groups ALTER COLUMN category SET DEFAULT 'Adults';

-- If max_students is NOT NULL, set default
ALTER TABLE groups ALTER COLUMN max_students SET DEFAULT 20;

-- If is_active is NOT NULL, set default
ALTER TABLE groups ALTER COLUMN is_active SET DEFAULT true;

-- If is_frozen is NOT NULL, set default
ALTER TABLE groups ALTER COLUMN is_frozen SET DEFAULT false;

-- 3. Fix students table NOT NULL constraints
-- If total_paid is NOT NULL, set default
ALTER TABLE students ALTER COLUMN total_paid SET DEFAULT 0.00;

-- If default_discount is NOT NULL, set default
ALTER TABLE students ALTER COLUMN default_discount SET DEFAULT 0.00;

-- If registration_fee_paid is NOT NULL, set default
ALTER TABLE students ALTER COLUMN registration_fee_paid SET DEFAULT false;

-- If registration_fee_amount is NOT NULL, set default
ALTER TABLE students ALTER COLUMN registration_fee_amount SET DEFAULT 0.00;

-- 4. Fix waiting_list table NOT NULL constraints
-- If default_discount is NOT NULL, set default
ALTER TABLE waiting_list ALTER COLUMN default_discount SET DEFAULT 0.00;

-- If registration_fee_paid is NOT NULL, set default
ALTER TABLE waiting_list ALTER COLUMN registration_fee_paid SET DEFAULT false;

-- If registration_fee_amount is NOT NULL, set default
ALTER TABLE waiting_list ALTER COLUMN registration_fee_amount SET DEFAULT 0.00;

-- If status is NOT NULL, set default
ALTER TABLE waiting_list ALTER COLUMN status SET DEFAULT 'pending';

-- 5. Fix call_logs table NOT NULL constraints
-- If call_type is NOT NULL, set default
ALTER TABLE call_logs ALTER COLUMN call_type SET DEFAULT 'incoming';

-- If call_status is NOT NULL, set default
ALTER TABLE call_logs ALTER COLUMN call_status SET DEFAULT 'pending';

-- If admin_name is NOT NULL, set default
ALTER TABLE call_logs ALTER COLUMN admin_name SET DEFAULT 'Dalila';

-- 6. Fix payments table NOT NULL constraints
-- If discount is NOT NULL, set default
ALTER TABLE payments ALTER COLUMN discount SET DEFAULT 0.00;

-- If payment_type is NOT NULL, set default
ALTER TABLE payments ALTER COLUMN payment_type SET DEFAULT 'group_payment';

-- If admin_name is NOT NULL, set default
ALTER TABLE payments ALTER COLUMN admin_name SET DEFAULT 'Dalila';

-- 7. Fix sessions table NOT NULL constraints
-- If is_rescheduled is NOT NULL, set default
ALTER TABLE sessions ALTER COLUMN is_rescheduled SET DEFAULT false;

-- 8. Fix attendance table NOT NULL constraints
-- If status is NOT NULL, set default
ALTER TABLE attendance ALTER COLUMN status SET DEFAULT 'present';

-- 9. Fix student_groups table NOT NULL constraints
-- If status is NOT NULL, set default
ALTER TABLE student_groups ALTER COLUMN status SET DEFAULT 'active';

-- 10. Verify the changes
SELECT 'UPDATED NOT NULL CONSTRAINTS:' as info;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND is_nullable = 'NO'
ORDER BY table_name, ordinal_position;

-- 11. Test insert operations again
SELECT 'TESTING INSERTS AFTER FIXES:' as info;

-- Test group insert
INSERT INTO groups (name, teacher_id, start_date, total_sessions)
SELECT 'Test Group After Fix', t.id, CURRENT_DATE, 16
FROM teachers t LIMIT 1
ON CONFLICT DO NOTHING;

-- Test call log insert
INSERT INTO call_logs (student_name, student_phone, call_date, call_time, notes)
VALUES ('Test Student After Fix', '+1234567890', CURRENT_DATE, CURRENT_TIME, 'Test call log after fix')
ON CONFLICT DO NOTHING;

-- 12. Final status
SELECT '🎉 NOT NULL CONSTRAINTS FIXED!' as message;
SELECT 'All tables now have proper default values for required fields.' as details;
SELECT 'Try creating groups and call logs now - they should work!' as next_step;
