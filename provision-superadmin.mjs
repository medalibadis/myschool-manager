import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://kfykineemtweunyretmh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeWtpbmVlbXR3ZXVueXJldG1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIyMTY3NCwiZXhwIjoyMDY5Nzk3Njc0fQ.kezFAqh6FiD5H4248Py16D3UgWwX8W1E_8YsZHcv6eA';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function provisionSuperAdmin() {
    const email = 'raouf@myschool.com';
    // Generate a secure random bootstrap password (16+ chars with upper, lower, numbers, symbols)
    const crypto = await import('crypto');
    const securePassword = 'Raouf#' + crypto.randomBytes(8).toString('hex') + '!2026';

    console.log(`Checking if auth user ${email} exists...`);
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
        throw new Error(`Failed to list auth users: ${listError.message}`);
    }

    let existingUser = listData.users.find(u => u.email === email);
    let userId;

    if (!existingUser) {
        console.log(`Creating new Supabase Auth user for ${email}...`);
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: securePassword,
            email_confirm: true,
            user_metadata: { name: 'Raouf' }
        });

        if (createError || !createData.user) {
            throw new Error(`Failed to create Auth user: ${createError?.message}`);
        }
        userId = createData.user.id;
        console.log(`✅ Auth user created with ID: ${userId}`);
    } else {
        userId = existingUser.id;
        console.log(`ℹ️ Existing Auth user found with ID: ${userId}. Updating password...`);
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: securePassword,
            email_confirm: true
        });
        if (updateError) {
            throw new Error(`Failed to update Auth password: ${updateError.message}`);
        }
    }

    // Now check if public.admin_profiles exists to link
    console.log(`Linking user ${userId} to public.admin_profiles as SUPER_ADMIN...`);
    const { data: profileData, error: profileError } = await supabaseAdmin
        .from('admin_profiles')
        .upsert({
            id: userId,
            name: 'Raouf',
            email: email,
            role: 'SUPER_ADMIN',
            is_active: true,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();

    if (profileError) {
        console.warn(`Note on admin_profiles upsert: ${profileError.message}`);
        console.log(`(If admin_profiles does not exist yet, please run setup-production-auth.sql in SQL Editor first.)`);
    } else {
        console.log(`✅ Super Admin profile linked in admin_profiles!`, profileData);
    }

    console.log('\n======================================================');
    console.log('🔑 SUPER ADMIN CREDENTIALS FOR TESTING');
    console.log('======================================================');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${securePassword}`);
    console.log('======================================================\n');
}

provisionSuperAdmin().catch(err => {
    console.error('❌ Provisioning Error:', err);
});
