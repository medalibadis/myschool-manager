-- Update Call Logs table structure
-- This script updates the existing call_logs table to include new fields

-- First, let's check if the table exists and what its current structure is
DO $$
BEGIN
    -- Check if call_logs table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'call_logs') THEN
        -- Add new columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'admin_name') THEN
            ALTER TABLE call_logs ADD COLUMN admin_name VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'call_date') THEN
            ALTER TABLE call_logs ADD COLUMN call_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'call_type') THEN
            ALTER TABLE call_logs ADD COLUMN call_type VARCHAR(50) NOT NULL DEFAULT 'registration';
        END IF;
        
        -- Add constraints if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.check_constraints WHERE constraint_name = 'call_logs_call_type_check') THEN
            ALTER TABLE call_logs ADD CONSTRAINT call_logs_call_type_check 
            CHECK (call_type IN ('registration', 'attendance', 'payment', 'other'));
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.check_constraints WHERE constraint_name = 'call_logs_status_check') THEN
            ALTER TABLE call_logs ADD CONSTRAINT call_logs_status_check 
            CHECK (status IN ('pending', 'coming', 'not_coming'));
        END IF;
        
        -- Update existing records to have proper call_date if it's null
        UPDATE call_logs SET call_date = created_at WHERE call_date IS NULL;
        
        RAISE NOTICE 'Call logs table updated successfully!';
    ELSE
        RAISE NOTICE 'Call logs table does not exist. Please run the add-new-fields.sql script first.';
    END IF;
END $$;

-- Verify the updated structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'call_logs' 
ORDER BY ordinal_position;

-- Show sample data
SELECT 
    id,
    student_id,
    call_date,
    call_type,
    status,
    notes,
    admin_name,
    created_at
FROM call_logs 
ORDER BY created_at DESC 
LIMIT 5; 