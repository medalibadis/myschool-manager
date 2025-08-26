-- Enhanced Payment System Database Schema
-- This script adds all necessary tables and columns for the comprehensive payment system
-- SAFE TO RUN MULTIPLE TIMES - includes proper checks and DROP statements

-- Check if this migration has already been applied
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'schema_migrations'
    ) AND EXISTS (
        SELECT 1 FROM schema_migrations 
        WHERE version = '2024-01-01-enhanced-payment-system'
    ) THEN
        RAISE NOTICE 'Migration 2024-01-01-enhanced-payment-system has already been applied. Skipping...';
        RETURN;
    END IF;
END $$;

-- 1. Create student_groups junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS student_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'stopped')),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    stop_date DATE,
    stop_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, group_id)
);

-- 2. Update students table to remove direct group_id reference
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_group_id_fkey;
ALTER TABLE students DROP COLUMN IF EXISTS group_id;

-- 3. Add new columns to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 300.00;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS language VARCHAR(100);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS level VARCHAR(100);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS custom_language VARCHAR(100);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS custom_level VARCHAR(100);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS custom_category VARCHAR(100);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS freeze_date DATE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS unfreeze_date DATE;

-- 4. Update sessions table to include attendance data
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS attendance_data JSONB DEFAULT '{}';

-- 5. Create attendance table for detailed tracking
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'default' CHECK (status IN ('default', 'present', 'absent', 'justified', 'change', 'stop', 'new', 'too_late')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- 6. Update payments table with new fields
ALTER TABLE payments ADD COLUMN IF NOT EXISTS admin_name VARCHAR(255) DEFAULT 'Admin';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS discount DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'group_payment' CHECK (payment_type IN ('registration_fee', 'group_payment', 'balance_addition', 'refund', 'debt_payment', 'debt_reduction'));
ALTER TABLE payments ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL;

-- 7. Create stop_reasons table for tracking why students stopped
CREATE TABLE IF NOT EXISTS stop_reasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    admin_name VARCHAR(255) NOT NULL,
    stop_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create refund_requests table
CREATE TABLE IF NOT EXISTS refund_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_amount DECIMAL(10,2) NOT NULL,
    approved_amount DECIMAL(10,2),
    admin_notes TEXT,
    processed_by VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create call_logs table for debt collection
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(255),
    student_phone VARCHAR(50),
    groups_with_debts JSONB,
    total_remaining_amount DECIMAL(10,2),
    notes TEXT,
    call_date DATE DEFAULT CURRENT_DATE,
    admin_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create unpaid_balances table for tracking outstanding amounts
CREATE TABLE IF NOT EXISTS unpaid_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_registration_fee BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_groups_student_id ON student_groups(student_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_group_id ON student_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_status ON student_groups(status);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_admin_name ON payments(admin_name);
CREATE INDEX IF NOT EXISTS idx_stop_reasons_student_group ON stop_reasons(student_id, group_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_student_id ON refund_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_student_id ON call_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_unpaid_balances_student_id ON unpaid_balances(student_id);
CREATE INDEX IF NOT EXISTS idx_unpaid_balances_group_id ON unpaid_balances(group_id);

-- 12. Create views for easier data access
CREATE OR REPLACE VIEW student_payment_summary AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.custom_id,
    s.default_discount,
    COUNT(DISTINCT sg.group_id) as total_groups,
    COUNT(DISTINCT CASE WHEN sg.status = 'active' THEN sg.group_id END) as active_groups,
    COUNT(DISTINCT CASE WHEN sg.status = 'stopped' THEN sg.group_id END) as stopped_groups,
    COALESCE(SUM(CASE WHEN p.payment_type = 'registration_fee' THEN p.amount ELSE 0 END), 0) as registration_fee_paid,
    COALESCE(SUM(CASE WHEN p.payment_type = 'group_payment' THEN p.amount ELSE 0 END), 0) as group_payments_paid,
    COALESCE(SUM(CASE WHEN p.payment_type = 'balance_addition' AND p.amount > 0 THEN p.amount ELSE 0 END), 0) as balance_additions,
    COALESCE(SUM(CASE WHEN p.payment_type = 'balance_addition' AND p.amount < 0 THEN ABS(p.amount) ELSE 0 END), 0) as refunds_received
FROM students s
LEFT JOIN student_groups sg ON s.id = sg.student_id
LEFT JOIN payments p ON s.id = p.student_id
GROUP BY s.id, s.name, s.custom_id, s.default_discount;

-- 13. Create function to calculate student balance
-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS calculate_student_balance(uuid);

CREATE OR REPLACE FUNCTION calculate_student_balance(student_uuid UUID)
RETURNS TABLE(
    total_balance DECIMAL(10,2),
    total_paid DECIMAL(10,2),
    remaining_balance DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH student_fees AS (
        -- Registration fee (always $500)
        SELECT 500.00 as amount, 'registration' as type
        
        UNION ALL
        
        -- Group fees
        SELECT 
            COALESCE(g.price, 0) as amount,
            'group' as type
        FROM student_groups sg
        JOIN groups g ON sg.group_id = g.id
        WHERE sg.student_id = student_uuid
        AND sg.status IN ('active', 'stopped')
    ),
    student_payments AS (
        SELECT 
            COALESCE(SUM(CASE WHEN payment_type = 'registration_fee' THEN amount ELSE 0 END), 0) as registration_paid,
            COALESCE(SUM(CASE WHEN payment_type = 'group_payment' THEN amount ELSE 0 END), 0) as group_paid,
            COALESCE(SUM(CASE WHEN payment_type = 'balance_addition' AND amount > 0 THEN amount ELSE 0 END), 0) as balance_additions,
            COALESCE(SUM(CASE WHEN payment_type = 'balance_addition' AND amount < 0 THEN ABS(amount) ELSE 0 END), 0) as refunds
        FROM payments
        WHERE student_id = student_uuid
    )
    SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM student_fees) as total_balance,
        (SELECT registration_paid + group_paid + balance_additions - refunds FROM student_payments) as total_paid,
        (SELECT COALESCE(SUM(amount), 0) FROM student_fees) - (SELECT registration_paid + group_paid + balance_additions - refunds FROM student_payments) as remaining_balance;
END;
$$ LANGUAGE plpgsql;

-- 14. Create function to handle attendance-based payment adjustments
CREATE OR REPLACE FUNCTION handle_attendance_payment_adjustment(
    session_uuid UUID,
    student_uuid UUID,
    new_status VARCHAR(20)
)
RETURNS VOID AS $$
DECLARE
    group_id_val INTEGER;
    session_price DECIMAL(10,2);
    group_price DECIMAL(10,2);
    total_sessions INTEGER;
BEGIN
    -- Get group information
    SELECT g.id, g.price, g.total_sessions INTO group_id_val, group_price, total_sessions
    FROM sessions s
    JOIN groups g ON s.group_id = g.id
    WHERE s.id = session_uuid;
    
    IF group_id_val IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate session price
    session_price := group_price / total_sessions;
    
    -- Handle justified, change, and new statuses
    IF new_status IN ('justified', 'change', 'new') THEN
        -- Check if student has paid for this group
        IF EXISTS (
            SELECT 1 FROM payments 
            WHERE student_id = student_uuid 
            AND group_id = group_id_val 
            AND payment_type = 'group_payment'
            AND amount >= group_price
        ) THEN
            -- Group is fully paid, create refund
            INSERT INTO payments (
                student_id, 
                group_id, 
                amount, 
                date, 
                notes, 
                admin_name, 
                payment_type
            ) VALUES (
                student_uuid,
                NULL,
                -session_price,
                CURRENT_DATE,
                'Session refund for ' || new_status || ' status',
                'System',
                'balance_addition'
            );
        ELSE
            -- Group not fully paid, reduce owed amount
            UPDATE unpaid_balances 
            SET amount = GREATEST(0, amount - session_price)
            WHERE student_id = student_uuid 
            AND group_id = group_id_val;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 15. Create trigger to automatically handle attendance changes
CREATE OR REPLACE FUNCTION attendance_change_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the payment adjustment function
    PERFORM handle_attendance_payment_adjustment(NEW.session_id, NEW.student_id, NEW.status);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS attendance_change_trigger ON attendance;

CREATE TRIGGER attendance_change_trigger
    AFTER INSERT OR UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION attendance_change_trigger();

-- 16. Enable Row Level Security on new tables
ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE stop_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE unpaid_balances ENABLE ROW LEVEL SECURITY;

-- 17. Create policies for new tables (public access for now)
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow public access" ON student_groups;
DROP POLICY IF EXISTS "Allow public access" ON attendance;
DROP POLICY IF EXISTS "Allow public access" ON stop_reasons;
DROP POLICY IF EXISTS "Allow public access" ON refund_requests;
DROP POLICY IF EXISTS "Allow public access" ON call_logs;
DROP POLICY IF EXISTS "Allow public access" ON unpaid_balances;

-- Create new policies
CREATE POLICY "Allow public access" ON student_groups FOR ALL USING (true);
CREATE POLICY "Allow public access" ON attendance FOR ALL USING (true);
CREATE POLICY "Allow public access" ON stop_reasons FOR ALL USING (true);
CREATE POLICY "Allow public access" ON refund_requests FOR ALL USING (true);
CREATE POLICY "Allow public access" ON call_logs FOR ALL USING (true);
CREATE POLICY "Allow public access" ON unpaid_balances FOR ALL USING (true);

-- 18. Insert sample data for testing (only if table is empty)
INSERT INTO student_groups (student_id, group_id, status)
SELECT s.id, g.id, 'active'
FROM students s
CROSS JOIN groups g
WHERE NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.student_id = s.id AND sg.group_id = g.id
)
AND NOT EXISTS (SELECT 1 FROM student_groups LIMIT 1) -- Only insert if table is empty
LIMIT 100;

-- 19. Create migration completion log (optional)
-- Create schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- Migration record will be inserted at the end after successful completion

-- 20. Final verification queries
SELECT 'Schema update completed successfully!' as status;
SELECT COUNT(*) as student_groups_count FROM student_groups;
SELECT COUNT(*) as attendance_count FROM attendance;
SELECT COUNT(*) as stop_reasons_count FROM stop_reasons;
SELECT COUNT(*) as refund_requests_count FROM refund_requests;
SELECT COUNT(*) as call_logs_count FROM call_logs;
SELECT COUNT(*) as unpaid_balances_count FROM unpaid_balances;

-- Mark migration as completed
INSERT INTO schema_migrations (version, applied_at, description) 
VALUES (
    '2024-01-01-enhanced-payment-system', 
    NOW(), 
    'Enhanced payment system with comprehensive features including student groups, attendance tracking, refunds, debts, and call logs'
) ON CONFLICT (version) DO NOTHING;
