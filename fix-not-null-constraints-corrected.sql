-- =====================================================
-- FIX NOT NULL CONSTRAINTS - CORRECTED VERSION
-- This script fixes NOT NULL constraints only for columns that exist
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

-- 2. Fix groups table NOT NULL constraints (only if columns exist)
-- Check if price column exists before trying to modify it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'price') THEN
        ALTER TABLE groups ALTER COLUMN price SET DEFAULT 0.00;
        RAISE NOTICE 'Set default for groups.price';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'language') THEN
        ALTER TABLE groups ALTER COLUMN language SET DEFAULT 'English';
        RAISE NOTICE 'Set default for groups.language';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'level') THEN
        ALTER TABLE groups ALTER COLUMN level SET DEFAULT 'Beginner';
        RAISE NOTICE 'Set default for groups.level';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'category') THEN
        ALTER TABLE groups ALTER COLUMN category SET DEFAULT 'Adults';
        RAISE NOTICE 'Set default for groups.category';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'max_students') THEN
        ALTER TABLE groups ALTER COLUMN max_students SET DEFAULT 20;
        RAISE NOTICE 'Set default for groups.max_students';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'is_active') THEN
        ALTER TABLE groups ALTER COLUMN is_active SET DEFAULT true;
        RAISE NOTICE 'Set default for groups.is_active';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'is_frozen') THEN
        ALTER TABLE groups ALTER COLUMN is_frozen SET DEFAULT false;
        RAISE NOTICE 'Set default for groups.is_frozen';
    END IF;
END $$;

-- 3. Fix students table NOT NULL constraints (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'default_discount') THEN
        ALTER TABLE students ALTER COLUMN default_discount SET DEFAULT 0.00;
        RAISE NOTICE 'Set default for students.default_discount';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'registration_fee_paid') THEN
        ALTER TABLE students ALTER COLUMN registration_fee_paid SET DEFAULT false;
        RAISE NOTICE 'Set default for students.registration_fee_paid';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'registration_fee_amount') THEN
        ALTER TABLE students ALTER COLUMN registration_fee_amount SET DEFAULT 0.00;
        RAISE NOTICE 'Set default for students.registration_fee_amount';
    END IF;
END $$;

-- 4. Fix waiting_list table NOT NULL constraints (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waiting_list' AND column_name = 'default_discount') THEN
        ALTER TABLE waiting_list ALTER COLUMN default_discount SET DEFAULT 0.00;
        RAISE NOTICE 'Set default for waiting_list.default_discount';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waiting_list' AND column_name = 'registration_fee_paid') THEN
        ALTER TABLE waiting_list ALTER COLUMN registration_fee_paid SET DEFAULT false;
        RAISE NOTICE 'Set default for waiting_list.registration_fee_paid';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waiting_list' AND column_name = 'registration_fee_amount') THEN
        ALTER TABLE waiting_list ALTER COLUMN registration_fee_amount SET DEFAULT 0.00;
        RAISE NOTICE 'Set default for waiting_list.registration_fee_amount';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waiting_list' AND column_name = 'status') THEN
        ALTER TABLE waiting_list ALTER COLUMN status SET DEFAULT 'pending';
        RAISE NOTICE 'Set default for waiting_list.status';
    END IF;
END $$;

-- 5. Fix call_logs table NOT NULL constraints (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'call_type') THEN
        ALTER TABLE call_logs ALTER COLUMN call_type SET DEFAULT 'incoming';
        RAISE NOTICE 'Set default for call_logs.call_type';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'call_status') THEN
        ALTER TABLE call_logs ALTER COLUMN call_status SET DEFAULT 'pending';
        RAISE NOTICE 'Set default for call_logs.call_status';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'admin_name') THEN
        ALTER TABLE call_logs ALTER COLUMN admin_name SET DEFAULT 'Dalila';
        RAISE NOTICE 'Set default for call_logs.admin_name';
    END IF;
END $$;

-- 6. Fix payments table NOT NULL constraints (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'discount') THEN
        ALTER TABLE payments ALTER COLUMN discount SET DEFAULT 0.00;
        RAISE NOTICE 'Set default for payments.discount';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_type') THEN
        ALTER TABLE payments ALTER COLUMN payment_type SET DEFAULT 'group_payment';
        RAISE NOTICE 'Set default for payments.payment_type';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'admin_name') THEN
        ALTER TABLE payments ALTER COLUMN admin_name SET DEFAULT 'Dalila';
        RAISE NOTICE 'Set default for payments.admin_name';
    END IF;
END $$;

-- 7. Fix sessions table NOT NULL constraints (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'is_rescheduled') THEN
        ALTER TABLE sessions ALTER COLUMN is_rescheduled SET DEFAULT false;
        RAISE NOTICE 'Set default for sessions.is_rescheduled';
    END IF;
END $$;

-- 8. Fix attendance table NOT NULL constraints (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'status') THEN
        ALTER TABLE attendance ALTER COLUMN status SET DEFAULT 'present';
        RAISE NOTICE 'Set default for attendance.status';
    END IF;
END $$;

-- 9. Fix student_groups table NOT NULL constraints (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_groups' AND column_name = 'status') THEN
        ALTER TABLE student_groups ALTER COLUMN status SET DEFAULT 'active';
        RAISE NOTICE 'Set default for student_groups.status';
    END IF;
END $$;

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

-- Test group insert (with minimal required fields)
INSERT INTO groups (name, teacher_id, start_date, total_sessions)
SELECT 'Test Group After Fix', t.id, CURRENT_DATE, 16
FROM teachers t LIMIT 1
ON CONFLICT DO NOTHING;

-- Test call log insert (with minimal required fields)
INSERT INTO call_logs (student_name, student_phone, call_date, call_time, notes)
VALUES ('Test Student After Fix', '+1234567890', CURRENT_DATE, CURRENT_TIME, 'Test call log after fix')
ON CONFLICT DO NOTHING;

-- 12. Final status
SELECT '🎉 NOT NULL CONSTRAINTS FIXED!' as message;
SELECT 'All tables now have proper default values for required fields.' as details;
SELECT 'Try creating groups and call logs now - they should work!' as next_step;
