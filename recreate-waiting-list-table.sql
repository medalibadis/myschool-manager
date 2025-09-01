-- Recreate waiting_list table with correct structure
-- Run this in Supabase SQL Editor

-- Drop existing table if it exists
DROP TABLE IF EXISTS waiting_list CASCADE;

-- Create waiting_list table with essential columns only
CREATE TABLE waiting_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    parent_name TEXT,
    email TEXT,
    phone TEXT,
    second_phone TEXT,
    default_discount DECIMAL(5,2) DEFAULT 0,
    language TEXT,
    level TEXT,
    category TEXT,
    birth_date DATE,
    notes TEXT,
    registration_fee_paid BOOLEAN DEFAULT false,
    registration_fee_amount DECIMAL(10,2) DEFAULT 500,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waiting_list_email ON waiting_list(email);
CREATE INDEX IF NOT EXISTS idx_waiting_list_phone ON waiting_list(phone);
CREATE INDEX IF NOT EXISTS idx_waiting_list_created_at ON waiting_list(created_at DESC);

-- Enable Row Level Security
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view waiting list" ON waiting_list;
DROP POLICY IF EXISTS "Allow authenticated users to insert waiting list" ON waiting_list;
DROP POLICY IF EXISTS "Allow authenticated users to update waiting list" ON waiting_list;
DROP POLICY IF EXISTS "Allow authenticated users to delete waiting list" ON waiting_list;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to view waiting list" ON waiting_list
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert waiting list" ON waiting_list
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update waiting list" ON waiting_list
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete waiting list" ON waiting_list
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_waiting_list_updated_at
    BEFORE UPDATE ON waiting_list
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created correctly
SELECT 
    'Table Created Successfully' as status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'waiting_list' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '✅ waiting_list table recreated with all required columns!' as final_status;
