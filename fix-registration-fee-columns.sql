-- =====================================================
-- FIX REGISTRATION FEE COLUMNS
-- This script adds missing columns for registration fee functionality
-- =====================================================

-- 1. Add missing columns to students table
SELECT 'ADDING REGISTRATION FEE COLUMNS TO STUDENTS:' as info;

ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_fee_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_fee_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_fee_group_id INTEGER;

-- 2. Add missing columns to payments table
SELECT 'ADDING PAYMENT TYPE COLUMNS TO PAYMENTS:' as info;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'group_payment';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2);

-- 3. Create index for better performance
SELECT 'CREATING INDEXES:' as info;

CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_students_registration_fee ON students(registration_fee_paid, registration_fee_amount);

-- 4. Update existing payments to have default payment_type
SELECT 'UPDATING EXISTING PAYMENTS:' as info;

UPDATE payments 
SET payment_type = 'group_payment' 
WHERE payment_type IS NULL;

-- 5. Set original_amount to amount if it's NULL
SELECT 'UPDATING ORIGINAL AMOUNTS:' as info;

UPDATE payments 
SET original_amount = amount 
WHERE original_amount IS NULL;

-- 6. Verify the setup
SELECT 'VERIFYING SETUP:' as info;

-- Check students table structure
SELECT 'STUDENTS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name IN ('registration_fee_paid', 'registration_fee_amount', 'registration_fee_group_id')
ORDER BY column_name;

-- Check payments table structure
SELECT 'PAYMENTS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name IN ('payment_type', 'original_amount')
ORDER BY column_name;

-- Check indexes
SELECT 'CREATED INDEXES:' as info;
SELECT indexname, tablename, indexdef
FROM pg_indexes 
WHERE tablename IN ('students', 'payments')
AND indexname LIKE '%registration_fee%' OR indexname LIKE '%payment_type%';

-- 7. Test data insertion
SELECT 'TESTING DATA INSERTION:' as info;

-- Insert a test student with registration fee
INSERT INTO students (
    name,
    email,
    phone,
    registration_fee_paid,
    registration_fee_amount
) VALUES (
    'Test Student Registration Fee',
    'test@registration.com',
    '+1234567890',
    true,
    500.00
) ON CONFLICT DO NOTHING;

-- Insert a test payment record
INSERT INTO payments (
    student_id,
    amount,
    date,
    notes,
    admin_name,
    payment_type
) VALUES (
    (SELECT id FROM students WHERE name = 'Test Student Registration Fee' LIMIT 1),
    500.00,
    CURRENT_DATE,
    'Test registration fee payment',
    'System',
    'registration_fee'
) ON CONFLICT DO NOTHING;

-- 8. Final status
SELECT '🎉 REGISTRATION FEE COLUMNS ADDED SUCCESSFULLY!' as message;
SELECT 'The students and payments tables now support registration fee functionality.' as details;
SELECT 'Try refreshing your payment page - the error should be resolved!' as next_step;
