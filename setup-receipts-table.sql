-- Setup Receipts Table
-- This script creates the receipts table and sets up proper RLS policies

-- Drop existing table if it exists (for clean setup)
DROP TABLE IF EXISTS receipts CASCADE;

-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN (
        'registration_fee',
        'group_payment', 
        'balance_addition',
        'balance_credit',
        'attendance_credit',
        'debt_reduction',
        'refund'
    )),
    group_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_receipts_student_id ON receipts(student_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_type ON receipts(payment_type);

-- Enable Row Level Security
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view receipts" ON receipts;
DROP POLICY IF EXISTS "Allow authenticated users to insert receipts" ON receipts;
DROP POLICY IF EXISTS "Allow authenticated users to update receipts" ON receipts;
DROP POLICY IF EXISTS "Allow authenticated users to delete receipts" ON receipts;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to view receipts" ON receipts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert receipts" ON receipts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update receipts" ON receipts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete receipts" ON receipts
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_receipts_updated_at 
    BEFORE UPDATE ON receipts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample receipts for testing (optional)
-- Uncomment the lines below if you want to add sample data
/*
INSERT INTO receipts (student_id, student_name, payment_id, amount, payment_type, group_name, notes) VALUES
('sample-student-id-1', 'John Doe', 'sample-payment-id-1', 500.00, 'registration_fee', NULL, 'Registration fee payment'),
('sample-student-id-2', 'Jane Smith', 'sample-payment-id-2', 1000.00, 'group_payment', 'English Advanced', 'Group fee payment'),
('sample-student-id-3', 'Bob Johnson', 'sample-payment-id-3', 200.00, 'balance_addition', NULL, 'Balance credit deposit');
*/

-- Verify the setup
SELECT 
    'Receipts table created successfully' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_name = 'receipts';

SELECT 
    'RLS policies created' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'receipts';
