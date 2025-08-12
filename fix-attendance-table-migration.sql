-- Migration script to fix attendance table structure
-- This will add missing columns and standardize the table structure

-- First, let's check what columns currently exist
SELECT 'Current attendance table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'attendance' 
ORDER BY ordinal_position;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'attendance' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE attendance 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added updated_at column to attendance table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in attendance table';
    END IF;
END $$;

-- Check if we need to add a status column or convert attended to status
DO $$ 
BEGIN
    -- Check if status column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'attendance' 
        AND column_name = 'status'
    ) THEN
        -- Check if attended column exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'attendance' 
            AND column_name = 'attended'
        ) THEN
            -- Convert attended boolean to status string
            ALTER TABLE attendance 
            ADD COLUMN status VARCHAR(20) DEFAULT 'default';
            
            -- Update existing records
            UPDATE attendance 
            SET status = CASE 
                WHEN attended = true THEN 'present'
                WHEN attended = false THEN 'absent'
                ELSE 'default'
            END;
            
            -- Drop the old attended column
            ALTER TABLE attendance DROP COLUMN attended;
            
            RAISE NOTICE 'Converted attended boolean to status string';
        ELSE
            -- Add status column with default
            ALTER TABLE attendance 
            ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'default';
            
            RAISE NOTICE 'Added status column to attendance table';
        END IF;
    ELSE
        RAISE NOTICE 'status column already exists in attendance table';
    END IF;
END $$;

-- Add check constraint for status values if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_attendance_status'
    ) THEN
        ALTER TABLE attendance 
        ADD CONSTRAINT check_attendance_status 
        CHECK (status IN ('present', 'absent', 'late', 'excused', 'default'));
        
        RAISE NOTICE 'Added status check constraint';
    ELSE
        RAISE NOTICE 'Status check constraint already exists';
    END IF;
END $$;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_attendance_updated_at ON attendance;
CREATE TRIGGER trigger_update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_updated_at();

-- Verify the final table structure
SELECT 'Final attendance table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'attendance' 
ORDER BY ordinal_position;

-- Show any constraints
SELECT 'Table constraints:' as info;
SELECT constraint_name, constraint_type, check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'attendance';

-- Show triggers
SELECT 'Table triggers:' as info;
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'attendance';
