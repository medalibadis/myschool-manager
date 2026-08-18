import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

export async function POST(request: NextRequest) {
    try {
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

        // 2. Check if requester is Super Admin
        const { data: requesterProfile, error: profileError } = await supabaseAdmin
            .from('admin_profiles')
            .select('role, is_active')
            .eq('id', user.id)
            .single();

        if (profileError || !requesterProfile || requesterProfile.role !== 'SUPER_ADMIN' || !requesterProfile.is_active) {
            return NextResponse.json({ error: 'Forbidden: Super Admin privilege required' }, { status: 403 });
        }

        // 3. Parse target adminId
        const body = await request.json();
        const { adminId } = body;

        if (!adminId) {
            return NextResponse.json({ error: 'adminId is required' }, { status: 400 });
        }

        // 4. List and delete all TOTP factors for the target user
        const { data: factors, error: factorsError } = await supabaseAdmin.auth.admin.mfa.listFactors({
            userId: adminId,
        });

        if (factorsError) {
            return NextResponse.json({ error: factorsError.message }, { status: 500 });
        }

        const totpFactors = factors?.factors || [];
        for (const factor of totpFactors) {
            await supabaseAdmin.auth.admin.mfa.deleteFactor({
                userId: adminId,
                id: factor.id,
            });
        }

        return NextResponse.json({
            success: true,
            message: `MFA factors reset successfully. The admin will be prompted to enroll a new authenticator upon next login.`,
        });
    } catch (error) {
        console.error('API Error in reset-mfa:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown server error' },
            { status: 500 }
        );
    }
}
