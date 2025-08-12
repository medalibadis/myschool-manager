-- Add registration_fee_group_id column to track which group consumed the registration fee
-- This prevents double-charging registration fees from multiple groups

-- Add the new column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'students' AND column_name = 'registration_fee_group_id'
    ) THEN
        ALTER TABLE students ADD COLUMN registration_fee_group_id INTEGER REFERENCES groups(id);
    END IF;
END $$;

-- Add comment to explain the purpose
COMMENT ON COLUMN students.registration_fee_group_id IS 'Tracks which group consumed the registration fee to prevent double-charging from multiple groups';

-- Verify the column was added
SELECT 'Students table structure after adding registration_fee_group_id:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'students' AND column_name = 'registration_fee_group_id';

-- Show current students with registration fee info
SELECT 'Current students with registration fee status:' as info;
SELECT 
    id,
    name,
    registration_fee_paid,
    registration_fee_amount,
    registration_fee_group_id
FROM students
WHERE registration_fee_amount > 0 OR registration_fee_paid = true
LIMIT 10;
