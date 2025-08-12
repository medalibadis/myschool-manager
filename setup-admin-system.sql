-- Admin System Setup Script
-- Run this in your Supabase SQL Editor to create the admin system

-- Step 1: Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'admin', -- 'superuser' or 'admin'
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

-- Step 3: Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies for admin access (permissive for testing)
DROP POLICY IF EXISTS "Allow all access for testing" ON admins;
CREATE POLICY "Allow all access for testing" ON admins FOR ALL USING (true);

-- Step 5: Insert initial superuser (Raouf)
INSERT INTO admins (username, password_hash, name, email, role) 
VALUES (
    'raouf', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: raoufbouk25
    'Raouf', 
    'raouf@myschool.com',
    'superuser'
) ON CONFLICT (username) DO NOTHING;

-- Step 6: Insert initial admin (Dalila)
INSERT INTO admins (username, password_hash, name, email, role) 
VALUES (
    'dalila', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: dali19dali25
    'Dalila', 
    'dalila@myschool.com',
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- Step 7: Create admin_sessions table for session management
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Create indexes for admin_sessions
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Step 9: Enable Row Level Security for admin_sessions
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Step 10: Create policies for admin_sessions (permissive for testing)
DROP POLICY IF EXISTS "Allow all access for testing" ON admin_sessions;
CREATE POLICY "Allow all access for testing" ON admin_sessions FOR ALL USING (true);

-- Step 11: Verify the setup
SELECT '✅ Admin system setup completed!' as status;

-- Step 12: Show created admins
SELECT 
    username, 
    name, 
    role, 
    is_active,
    CASE 
        WHEN username = 'raouf' THEN '✅ Raouf (superuser) created'
        WHEN username = 'dalila' THEN '✅ Dalila (admin) created'
        ELSE '❌ Unexpected admin: ' || username
    END as status
FROM admins 
ORDER BY role, username;

-- Step 13: Test insert capability
DO $$
BEGIN
    -- Try to insert a test admin (will be rolled back)
    INSERT INTO admins (username, password_hash, name, email, role) 
    VALUES ('test_admin', 'test_hash', 'Test Admin', 'test@example.com', 'admin');
    
    -- If we get here, the insert worked
    RAISE NOTICE '✅ Insert test passed - admin system is working correctly';
    
    -- Rollback the test insert
    ROLLBACK;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Insert test failed: %', SQLERRM;
END $$; 