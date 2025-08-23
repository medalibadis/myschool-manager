-- Create refund_requests table for approval workflow
CREATE TABLE IF NOT EXISTS refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    student_name TEXT NOT NULL,
    student_custom_id TEXT,
    requested_amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    stopped_groups JSONB NOT NULL, -- Array of {groupId, groupName, stopReason}
    admin_name TEXT NOT NULL DEFAULT 'Admin',
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    superadmin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT,
    
    -- Add foreign key constraint
    CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_refund_requests_student_id ON refund_requests (student_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests (status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON refund_requests (created_at);

-- Add RLS policies
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON refund_requests
FOR ALL TO authenticated USING (true);

-- Allow read for anonymous users  
CREATE POLICY "Allow read for anonymous" ON refund_requests
FOR SELECT TO anon USING (true);

COMMIT;
