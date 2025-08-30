import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Create admin client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, data } = body;

        switch (action) {
            case 'paySalary':
                const { data: salaryData, error } = await supabaseAdmin
                    .from('teacher_salaries')
                    .insert(data)
                    .select()
                    .single();

                if (error) throw error;
                return NextResponse.json({ success: true, data: salaryData });

            case 'getSalaryHistory':
                const { data: historyData, error: historyError } = await supabaseAdmin
                    .from('teacher_salaries')
                    .select(`
            *,
            groups (
              id,
              name
            )
          `)
                    .eq('teacher_id', data.teacherId)
                    .order('payment_date', { ascending: false });

                if (historyError) throw historyError;
                return NextResponse.json({ success: true, data: historyData || [] });

            case 'getUnpaidGroups':
                const unpaidGroups = await calculateUnpaidGroups(data.teacherId);
                return NextResponse.json({ success: true, data: unpaidGroups });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

async function calculateUnpaidGroups(teacherId: string) {
    try {
        console.log('🔄 Using server-side calculation for teacher unpaid groups...');

        // 1. Get all groups for this teacher
        const { data: groups, error: groupsError } = await supabaseAdmin
            .from('groups')
            .select('id, name')
            .eq('teacher_id', teacherId);

        if (groupsError) {
            console.error('❌ Error fetching groups:', groupsError);
            throw groupsError;
        }

        if (!groups || groups.length === 0) {
            console.log('ℹ️ No groups found for teacher');
            return [];
        }

        console.log(`📚 Found ${groups.length} groups for teacher`);

        const unpaidGroups = [];

        // 2. For each group, calculate salary manually
        for (const group of groups) {
            try {
                // Get all sessions for this group
                const { data: sessions, error: sessionsError } = await supabaseAdmin
                    .from('sessions')
                    .select('id, date')
                    .eq('group_id', group.id);

                if (sessionsError) {
                    console.error(`❌ Error fetching sessions for group ${group.id}:`, sessionsError);
                    continue;
                }

                if (!sessions || sessions.length === 0) {
                    console.log(`ℹ️ No sessions found for group ${group.id}`);
                    continue;
                }

                // Get teacher attendance for these sessions
                const { data: attendance, error: attendanceError } = await supabaseAdmin
                    .from('teacher_attendance')
                    .select('session_id, status')
                    .eq('teacher_id', teacherId)
                    .in('session_id', sessions.map(s => s.id));

                if (attendanceError) {
                    console.error(`❌ Error fetching attendance for group ${group.id}:`, attendanceError);
                    continue;
                }

                // Get teacher's price per session
                const { data: teacher, error: teacherError } = await supabaseAdmin
                    .from('teachers')
                    .select('price_per_session')
                    .eq('id', teacherId)
                    .single();

                if (teacherError || !teacher) {
                    console.error(`❌ Error fetching teacher ${teacherId}:`, teacherError);
                    continue;
                }

                const pricePerSession = teacher.price_per_session || 1000;

                // Calculate salary
                const presentSessions = attendance.filter(a => a.status === 'present').length;
                const lateSessions = attendance.filter(a => a.status === 'late').length;
                const absentSessions = attendance.filter(a => a.status === 'absent').length;
                const justifiedSessions = attendance.filter(a => a.status === 'justified').length;

                const calculatedSalary = (presentSessions * pricePerSession) -
                    (lateSessions * 200) -
                    (absentSessions * 500);

                // Check if this group has been paid using admin client
                let existingPayment = null;
                try {
                    const { data: payment, error: paymentError } = await supabaseAdmin
                        .from('teacher_salaries')
                        .select('id')
                        .eq('teacher_id', teacherId)
                        .eq('group_id', group.id)
                        .single();

                    if (paymentError) {
                        if (paymentError.code === 'PGRST116') { // PGRST116 = no rows returned
                            // No payment record found, which is fine
                            existingPayment = null;
                        } else {
                            console.error(`❌ Error checking payment for group ${group.id}:`, paymentError);
                            existingPayment = null;
                        }
                    } else {
                        existingPayment = payment;
                    }
                } catch (error) {
                    console.log(`ℹ️ Could not check payment history for group ${group.id}`);
                }

                // If no existing payment and salary > 0, add to unpaid groups
                if (!existingPayment && calculatedSalary > 0) {
                    unpaidGroups.push({
                        group_id: group.id,
                        group_name: group.name,
                        total_sessions: sessions.length,
                        present_sessions: presentSessions,
                        late_sessions: lateSessions,
                        absent_sessions: absentSessions,
                        justified_sessions: justifiedSessions,
                        calculated_salary: calculatedSalary
                    });
                }
            } catch (groupError) {
                console.error(`❌ Error processing group ${group.id}:`, groupError);
                continue;
            }
        }

        console.log(`✅ Server-side calculation complete. Found ${unpaidGroups.length} unpaid groups`);
        return unpaidGroups;

    } catch (error) {
        console.error('❌ Error calculating teacher unpaid groups:', error);
        throw error;
    }
}
