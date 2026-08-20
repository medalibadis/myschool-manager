import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfykineemtweunyretmh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeWtpbmVlbXR3ZXVueXJldG1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIyMTY3NCwiZXhwIjoyMDY5Nzk3Njc0fQ.kezFAqh6FiD5H4248Py16D3UgWwX8W1E_8YsZHcv6eA';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const ALL_PERMISSIONS = [
    'students.view', 'students.create', 'students.edit', 'students.delete',
    'groups.view', 'groups.create', 'groups.edit', 'groups.delete',
    'attendance.view', 'attendance.edit',
    'payments.view', 'payments.create', 'payments.edit', 'payments.delete',
    'teachers.view', 'teachers.create', 'teachers.edit', 'teachers.delete',
    'salary.manage', 'waiting_list.manage', 'call_logs.manage'
];

async function createAdminUser(name, email, password, permissions = ALL_PERMISSIONS) {
    console.log(`\nCreating Admin: ${name} (${email})...`);

    // 1. Check existing Auth user
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    let existingUser = listData?.users?.find(u => u.email === email);
    let userId;

    if (existingUser) {
        userId = existingUser.id;
        console.log(`Existing Auth user found (${userId}). Updating password...`);
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password,
            email_confirm: true,
            user_metadata: { name }
        });
        if (updateError) throw updateError;
    } else {
        console.log(`Creating new Auth user...`);
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        });
        if (createError) throw createError;
        userId = createData.user.id;
    }

    // 2. Upsert admin_profiles
    console.log(`Upserting admin profile...`);
    const { error: profileError } = await supabaseAdmin
        .from('admin_profiles')
        .upsert({
            id: userId,
            name,
            email,
            role: 'ADMIN',
            is_active: true,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

    if (profileError) throw profileError;

    // 3. Delete old permissions and insert new ones
    console.log(`Assigning permissions...`);
    await supabaseAdmin.from('admin_permissions').delete().eq('admin_id', userId);

    if (permissions.length > 0) {
        const permInserts = permissions.map(p => ({
            admin_id: userId,
            permission: p
        }));
        const { error: permError } = await supabaseAdmin.from('admin_permissions').insert(permInserts);
        if (permError) throw permError;
    }

    console.log(`\n✅ Admin created successfully!`);
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role:     ADMIN`);
    console.log(`Permissions: ${permissions.length} granted`);
}

const targetEmail = process.argv[2] || 'yakoub@mychool.com';
const targetPass = process.argv[3] || 'Yakoub#2026!Admin';
const targetName = process.argv[4] || 'yaakoub dou';

createAdminUser(targetName, targetEmail, targetPass).catch(err => {
    console.error('❌ Error creating admin:', err);
});
