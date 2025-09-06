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

            // Even if teacher has no groups, check for covering sessions
            const { data: coveringSessions, error: coveringError } = await supabaseAdmin
                .from('teacher_covering')
                .select('id, group_id, groups!teacher_covering_group_id_fkey(id, name)')
                .eq('covering_teacher_id', teacherId);

            if (coveringError) {
                console.error(`❌ Error fetching covering sessions for teacher with no groups:`, coveringError);
                return [];
            }

            if (coveringSessions && coveringSessions.length > 0) {
                console.log(`🎯 Teacher has no groups but has ${coveringSessions.length} covering sessions`);

                // Get teacher's price per session
                const { data: teacher, error: teacherError } = await supabaseAdmin
                    .from('teachers')
                    .select('price_per_session')
                    .eq('id', teacherId)
                    .single();

                if (!teacherError && teacher) {
                    const pricePerSession = teacher.price_per_session || 1000;

                    // Group covering sessions by group_id
                    const coveringByGroup: { [key: number]: any[] } = coveringSessions.reduce((acc, cs) => {
                        if (!acc[cs.group_id]) {
                            acc[cs.group_id] = [];
                        }
                        acc[cs.group_id].push(cs);
                        return acc;
                    }, {} as { [key: number]: any[] });

                    const unpaidGroups = [];

                    // Create entries for each group with covering sessions
                    for (const [groupId, sessions] of Object.entries(coveringByGroup)) {
                        const groupIdNum = parseInt(groupId);
                        const coveringCount = sessions.length;
                        const coveringSalary = coveringCount * pricePerSession;

                        console.log(`📊 Covering Group ${groupId} salary calculation:`);
                        console.log(`  - Covering sessions: ${coveringCount}`);
                        console.log(`  - Price per session: ${pricePerSession}`);
                        console.log(`  - Covering salary: ${coveringSalary} DA`);

                        unpaidGroups.push({
                            group_id: groupIdNum,
                            group_name: `🔄 COVERING: ${(sessions[0].groups as any)?.name || `Group ${groupId}`} (${coveringCount} sessions)`,
                            total_sessions: 0,
                            present_sessions: 0,
                            late_sessions: 0,
                            absent_sessions: 0,
                            justified_sessions: 0,
                            covering_sessions: coveringCount,
                            calculated_salary: coveringSalary
                        });
                    }

                    console.log(`✅ Found ${unpaidGroups.length} unpaid covering groups`);
                    return unpaidGroups;
                }
            }

            return [];
        }

        console.log(`📚 Found ${groups.length} groups for teacher`);

        // Debug: Check if there are ANY covering records in the database
        const { data: allCoveringRecords, error: allCoveringRecordsError } = await supabaseAdmin
            .from('teacher_covering')
            .select('id, covering_teacher_id, group_id')
            .limit(10);

        if (allCoveringRecordsError) {
            console.error(`❌ Error checking all covering records:`, allCoveringRecordsError);
        } else {
            console.log(`🔍 Total covering records in database: ${allCoveringRecords?.length || 0}`);
            if (allCoveringRecords && allCoveringRecords.length > 0) {
                console.log(`📋 Sample covering records:`, allCoveringRecords);
            }
        }

        // Get all covering sessions for this teacher once (for debugging)
        const { data: allCoveringSessions, error: allCoveringError } = await supabaseAdmin
            .from('teacher_covering')
            .select('id, group_id, groups!teacher_covering_group_id_fkey(id, name)')
            .eq('covering_teacher_id', teacherId);

        if (allCoveringError) {
            console.error(`❌ Error fetching all covering sessions for teacher ${teacherId}:`, allCoveringError);
        } else {
            console.log(`🎯 Teacher ${teacherId} has ${allCoveringSessions?.length || 0} total covering sessions`);
            if (allCoveringSessions && allCoveringSessions.length > 0) {
                console.log(`📋 Covering sessions details:`, allCoveringSessions.map(cs => ({
                    id: cs.id,
                    group_id: cs.group_id,
                    group_name: (cs.groups as any)?.name || 'Unknown'
                })));
            }
        }

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

                // Count covering sessions for this specific group (use already fetched data)
                const coveringSessionsCount = allCoveringSessions?.filter(cs => cs.group_id === group.id).length || 0;

                // Calculate salary components
                const presentSessions = attendance.filter(a => a.status === 'present').length;
                const lateSessions = attendance.filter(a => a.status === 'late').length;
                const absentSessions = attendance.filter(a => a.status === 'absent').length;
                const justifiedSessions = attendance.filter(a => a.status === 'justified').length;

                console.log(`📊 Group ${group.id} salary calculation:`);
                console.log(`  - Present sessions: ${presentSessions}`);
                console.log(`  - Covering sessions: ${coveringSessionsCount}`);
                console.log(`  - Price per session: ${pricePerSession}`);
                console.log(`  - Covering sessions total: ${coveringSessionsCount * pricePerSession} DA`);

                // Include covering sessions in salary calculation
                const calculatedSalary = (presentSessions * pricePerSession) +
                    (coveringSessionsCount * pricePerSession) - // Add covering sessions
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
                        covering_sessions: coveringSessionsCount,
                        calculated_salary: calculatedSalary
                    });
                }
            } catch (groupError) {
                console.error(`❌ Error processing group ${group.id}:`, groupError);
                continue;
            }
        }

        // 3. Add covering sessions as separate entries if they don't belong to teacher's groups
        if (allCoveringSessions && allCoveringSessions.length > 0) {
            const teacherGroupIds = groups.map(g => g.id);
            const coveringSessionsForOtherGroups = allCoveringSessions.filter(cs => !teacherGroupIds.includes(cs.group_id));

            if (coveringSessionsForOtherGroups.length > 0) {
                console.log(`🎯 Found ${coveringSessionsForOtherGroups.length} covering sessions for other groups`);

                // Get teacher's price per session
                const { data: teacher, error: teacherError } = await supabaseAdmin
                    .from('teachers')
                    .select('price_per_session')
                    .eq('id', teacherId)
                    .single();

                if (!teacherError && teacher) {
                    const pricePerSession = teacher.price_per_session || 1000;

                    // Group covering sessions by group_id
                    const coveringByGroup: { [key: number]: any[] } = coveringSessionsForOtherGroups.reduce((acc, cs) => {
                        if (!acc[cs.group_id]) {
                            acc[cs.group_id] = [];
                        }
                        acc[cs.group_id].push(cs);
                        return acc;
                    }, {} as { [key: number]: any[] });

                    // Create entries for each group with covering sessions
                    for (const [groupId, sessions] of Object.entries(coveringByGroup)) {
                        const groupIdNum = parseInt(groupId);
                        const coveringCount = sessions.length;
                        const coveringSalary = coveringCount * pricePerSession;

                        console.log(`📊 Covering Group ${groupId} salary calculation:`);
                        console.log(`  - Covering sessions: ${coveringCount}`);
                        console.log(`  - Price per session: ${pricePerSession}`);
                        console.log(`  - Covering salary: ${coveringSalary} DA`);

                        unpaidGroups.push({
                            group_id: groupIdNum,
                            group_name: `🔄 COVERING: ${(sessions[0].groups as any)?.name || `Group ${groupId}`} (${coveringCount} sessions)`,
                            total_sessions: 0, // Not applicable for covering
                            present_sessions: 0,
                            late_sessions: 0,
                            absent_sessions: 0,
                            justified_sessions: 0,
                            covering_sessions: coveringCount,
                            calculated_salary: coveringSalary
                        });
                    }
                }
            }
        }

        console.log(`✅ Server-side calculation complete. Found ${unpaidGroups.length} unpaid groups`);
        return unpaidGroups;

    } catch (error) {
        console.error('❌ Error calculating teacher unpaid groups:', error);
        throw error;
    }
}
