import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            return NextResponse.json(
                { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing on server/Netlify.' },
                { status: 500 }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // 1. Verify Super Admin Authorization from Bearer Token
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        // 2. Check if user is Super Admin
        const { data: requesterProfile, error: profileError } = await supabaseAdmin
            .from('admin_profiles')
            .select('role, is_active')
            .eq('id', user.id)
            .single();

        if (profileError || !requesterProfile || requesterProfile.role !== 'SUPER_ADMIN' || !requesterProfile.is_active) {
            return NextResponse.json({ error: 'Forbidden: Super Admin privilege required' }, { status: 403 });
        }

        // 3. Parse Request Body
        const body = await request.json();
        const { email, password, name, phone, role = 'ADMIN', permissions = [] } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
        }

        // 4. Create User in Supabase Auth
        const { data: createdAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email.trim(),
            password: password,
            email_confirm: true,
            user_metadata: { name: name.trim() },
        });

        if (createError || !createdAuthUser.user) {
            return NextResponse.json({ error: createError?.message || 'Failed to create auth user' }, { status: 400 });
        }

        const newUserId = createdAuthUser.user.id;

        // 5. Insert into admin_profiles
        const { error: insertProfileError } = await supabaseAdmin
            .from('admin_profiles')
            .insert({
                id: newUserId,
                name: name.trim(),
                email: email.trim(),
                phone: phone ? phone.trim() : null,
                role: role,
                is_active: true,
            });

        if (insertProfileError) {
            // Rollback auth user creation if profile insert fails
            await supabaseAdmin.auth.admin.deleteUser(newUserId);
            return NextResponse.json({ error: insertProfileError.message }, { status: 500 });
        }

        // 6. Insert permissions if any
        if (permissions.length > 0) {
            const permInserts = permissions.map((p: string) => ({
                admin_id: newUserId,
                permission: p,
                granted_by: user.id,
            }));

            const { error: permError } = await supabaseAdmin
                .from('admin_permissions')
                .insert(permInserts);

            if (permError) {
                console.error('Error inserting permissions for new admin:', permError);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Admin ${name} created successfully.`,
            userId: newUserId,
        });
    } catch (error) {
        console.error('API Error in admin creation:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown server error' },
            { status: 500 }
        );
    }
}
