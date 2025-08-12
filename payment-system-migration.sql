-- Payment System Migration Script
-- This script adds the necessary fields and tables for the comprehensive payment system

-- Add new fields to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS default_discount DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0;

-- Add new fields to waiting_list table
ALTER TABLE waiting_list 
ADD COLUMN IF NOT EXISTS default_discount DECIMAL(5,2) DEFAULT 0;

-- Add new fields to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS admin_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS discount DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2);

-- Update existing payments to set original_amount = amount where original_amount is null
UPDATE payments 
SET original_amount = amount 
WHERE original_amount IS NULL;

-- Create a new table for student balances (for tracking purposes)
CREATE TABLE IF NOT EXISTS student_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    total_balance DECIMAL(10,2) DEFAULT 0,
    total_paid DECIMAL(10,2) DEFAULT 0,
    remaining_balance DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a new table for group balances (for tracking purposes)
CREATE TABLE IF NOT EXISTS group_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    group_fees DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, group_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_balances_student_id ON student_balances(student_id);
CREATE INDEX IF NOT EXISTS idx_group_balances_student_id ON group_balances(student_id);
CREATE INDEX IF NOT EXISTS idx_group_balances_group_id ON group_balances(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_admin_name ON payments(admin_name);

-- Enable RLS on new tables
ALTER TABLE student_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_balances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access" ON student_balances;
DROP POLICY IF EXISTS "Allow public insert access" ON student_balances;
DROP POLICY IF EXISTS "Allow public update access" ON student_balances;
DROP POLICY IF EXISTS "Allow public delete access" ON student_balances;

DROP POLICY IF EXISTS "Allow public read access" ON group_balances;
DROP POLICY IF EXISTS "Allow public insert access" ON group_balances;
DROP POLICY IF EXISTS "Allow public update access" ON group_balances;
DROP POLICY IF EXISTS "Allow public delete access" ON group_balances;

-- Create policies for new tables
CREATE POLICY "Allow public read access" ON student_balances FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON student_balances FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON student_balances FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON student_balances FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON group_balances FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON group_balances FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON group_balances FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON group_balances FOR DELETE USING (true);

-- Create a function to calculate student balance
CREATE OR REPLACE FUNCTION calculate_student_balance(student_uuid UUID)
RETURNS TABLE(
    total_balance DECIMAL(10,2),
    total_paid DECIMAL(10,2),
    remaining_balance DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(g.price), 0) as total_balance,
        COALESCE(SUM(p.amount), 0) as total_paid,
        COALESCE(SUM(g.price), 0) - COALESCE(SUM(p.amount), 0) as remaining_balance
    FROM students s
    LEFT JOIN groups g ON s.group_id = g.id
    LEFT JOIN payments p ON s.id = p.student_id AND g.id = p.group_id
    WHERE s.id = student_uuid
    GROUP BY s.id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update student balance
CREATE OR REPLACE FUNCTION update_student_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update student balance when payment is added/updated/deleted
    UPDATE students 
    SET balance = (
        SELECT remaining_balance 
        FROM calculate_student_balance(NEW.student_id)
    )
    WHERE id = NEW.student_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_student_balance ON payments;

-- Create trigger for updating student balance
CREATE TRIGGER trigger_update_student_balance
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_student_balance();

-- Create a function to calculate group balance
CREATE OR REPLACE FUNCTION calculate_group_balance(student_uuid UUID, group_int INTEGER)
RETURNS TABLE(
    group_fees DECIMAL(10,2),
    amount_paid DECIMAL(10,2),
    remaining_amount DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(g.price, 0) as group_fees,
        COALESCE(SUM(p.amount), 0) as amount_paid,
        COALESCE(g.price, 0) - COALESCE(SUM(p.amount), 0) as remaining_amount
    FROM groups g
    LEFT JOIN payments p ON g.id = p.group_id AND p.student_id = student_uuid
    WHERE g.id = group_int
    GROUP BY g.id, g.price;
END;
$$ LANGUAGE plpgsql; 

-- Registration fee fields
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS registration_fee_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_fee_amount NUMERIC(10,2) DEFAULT 500;

-- Optional: create a synthetic group id constant via a table to reference in receipts (or just use group_id NULL with notes)
-- We will keep group_id NULL and set notes to 'Registration fee' to simplify. 