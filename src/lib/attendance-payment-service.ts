import { supabase } from './supabase';

export interface AttendancePaymentAdjustment {
    studentId: string;
    groupId: number;
    sessionId: string;
    sessionDate: string;
    attendanceStatus: string;
    sessionAmount?: number;
    adjustmentAmount?: number;
    adjustmentType?: 'refund' | 'debt_reduction';
    paymentType?: string;
    notes: string;
    attendedSessions?: number;
    stoppedSessions?: number;
}

export const attendancePaymentService = {
    /**
     * Process attendance adjustment when status changes affect payment
     */
    async processAttendanceAdjustment(
        sessionId: string,
        studentId: string,
        newStatus: string
    ): Promise<AttendancePaymentAdjustment | null> {
        try {
            console.log(`🛑 Processing attendance adjustment for session ${sessionId}, student ${studentId}, status: ${newStatus}`);

            // For stop status, use special stop logic
            if (newStatus === 'stop') {
                return await this.processStopAdjustment(sessionId, studentId);
            }

            // Check if this status requires financial adjustment
            if (!['justified', 'new', 'change'].includes(newStatus)) {
                console.log(`ℹ️ Status '${newStatus}' does not require financial adjustment`);
                return null;
            }

            console.log(`✅ Status '${newStatus}' requires financial adjustment. Starting payment processing...`);

            // Get session and group details
            const { data: sessionData, error: sessionError } = await supabase
                .from('sessions')
                .select(`
                    id,
                    date,
                    group_id,
                    groups!inner(
                        id,
                        name,
                        total_sessions
                    )
                `)
                .eq('id', sessionId)
                .single();

            if (sessionError || !sessionData) {
                console.error('Error fetching session data:', sessionError);
                return null;
            }

            const group = Array.isArray(sessionData.groups) ? sessionData.groups[0] : sessionData.groups;
            const groupId = group.id;
            const groupName = group.name;
            const totalSessions = group.total_sessions;
            const sessionDate = sessionData.date;

            console.log(`📍 Session details: ${groupName} (${groupId}), Date: ${sessionDate}, Total sessions: ${totalSessions}`);

            // Get group pricing from student_groups table
            const { data: studentGroupData, error: studentGroupError } = await supabase
                .from('student_groups')
                .select(`
                    groups!inner(
                        price
                    )
                `)
                .eq('student_id', studentId)
                .eq('group_id', groupId)
                .single();

            if (studentGroupError || !studentGroupData) {
                console.error('Error fetching student group data:', studentGroupError);
                return null;
            }

            const groupPriceData = Array.isArray(studentGroupData.groups) ? studentGroupData.groups[0] : studentGroupData.groups;
            const groupPrice = groupPriceData.price;
            const sessionAmount = groupPrice / totalSessions;

            console.log(`💰 Group price: ${groupPrice}, Session amount: ${sessionAmount}`);

            // Check if group is already fully paid
            const { data: payments, error: paymentsError } = await supabase
                .from('payments')
                .select('amount')
                .eq('student_id', studentId)
                .eq('group_id', groupId);

            if (paymentsError) {
                console.error('Error fetching payments:', paymentsError);
                return null;
            }

            const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
            const isGroupPaid = totalPaid >= groupPrice;

            console.log(`💳 Payment status: Total paid: ${totalPaid}, Group price: ${groupPrice}, Is fully paid: ${isGroupPaid}`);

            let paymentType: string;
            let paymentAmount: number;
            let paymentNotes: string;

            if (isGroupPaid) {
                // Group is fully paid - add session amount to student balance
                paymentType = 'balance_credit';
                paymentAmount = sessionAmount;
                paymentNotes = `Attendance adjustment: ${newStatus} status for session on ${sessionDate} - added to positive balance`;
                console.log(`💳 Group fully paid. Adding ${sessionAmount} to student balance for ${newStatus} status`);
            } else {
                // Group not fully paid - reduce debt by session amount
                paymentType = 'attendance_credit';
                paymentAmount = sessionAmount;
                paymentNotes = `Attendance adjustment: ${newStatus} status for session on ${sessionDate} - reduces unpaid group fee`;
                console.log(`💳 Group not fully paid. Reducing debt by ${sessionAmount} for ${newStatus} status`);
            }

            // Create the payment record
            const { data: payment, error: paymentError } = await supabase
                .from('payments')
                .insert({
                    student_id: studentId,
                    group_id: groupId,
                    amount: paymentAmount,
                    payment_type: paymentType,
                    date: new Date().toISOString().split('T')[0],
                    notes: paymentNotes,
                    admin_name: 'System'
                })
                .select()
                .single();

            if (paymentError) {
                console.error('Error creating payment adjustment:', paymentError);
                return null;
            }

            console.log(`✅ Payment adjustment created: ${paymentType} of ${paymentAmount} for ${newStatus} status`);

            return {
                studentId,
                groupId,
                sessionId,
                sessionDate,
                attendanceStatus: newStatus,
                sessionAmount,
                adjustmentType: isGroupPaid ? 'refund' : 'debt_reduction',
                notes: paymentNotes
            };

        } catch (error) {
            console.error('Error processing attendance adjustment:', error);
            return null;
        }
    },

    /**
     * Process stop adjustment with comprehensive balance recalculation
     */
    async processStopAdjustment(sessionId: string, studentId: string): Promise<AttendancePaymentAdjustment | null> {
        try {
            console.log(`🛑 Processing STOP adjustment for session ${sessionId}, student ${studentId}`);

            // Get session details
            const { data: sessionData, error: sessionError } = await supabase
                .from('sessions')
                .select('date, group_id')
                .eq('id', sessionId)
                .single();

            if (sessionError || !sessionData) {
                console.error('Error fetching session for stop adjustment:', sessionError);
                return null;
            }

            const { date: stopDate, group_id: groupId } = sessionData;
            console.log(`📊 Stop analysis: Group ${groupId}, Stop date: ${stopDate}`);

            // Get group details
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .select('total_sessions')
                .eq('id', groupId)
                .single();

            if (groupError || !groupData) {
                console.error('Error fetching group for stop adjustment:', groupError);
                return null;
            }

            const totalSessions = groupData.total_sessions;

            // Get all sessions for this group
            const { data: allSessions, error: sessionsError } = await supabase
                .from('sessions')
                .select('id, date')
                .eq('group_id', groupId)
                .order('date', { ascending: true });

            if (sessionsError || !allSessions) {
                console.error('Error fetching all sessions for stop calculation:', sessionsError);
                return null;
            }

            // 🎯 YOUR SIMPLE LOGIC: Count only obligatory vs free sessions
            // Get attendance records to determine which sessions are obligatory
            const { data: attendanceRecords, error: attendanceError } = await supabase
                .from('attendance')
                .select('session_id, status')
                .eq('student_id', studentId)
                .in('session_id', allSessions.map(s => s.id));

            if (attendanceError) {
                console.error('Error fetching attendance records:', attendanceError);
                return null;
            }

            // Count by payment obligation
            let obligatorySessions = 0; // present, absent, too_late = MUST PAY
            let freeSessions = 0; // justified, change, new, stop = NOT COUNTED

            for (const session of allSessions) {
                const attendance = attendanceRecords?.find(a => a.session_id === session.id);
                const status = attendance?.status || 'default';

                if (['present', 'absent', 'too_late'].includes(status)) {
                    obligatorySessions++; // MUST PAY
                } else {
                    freeSessions++; // NOT COUNTED
                }
            }

            console.log(`📈 Session breakdown: Total=${totalSessions}, Obligatory=${obligatorySessions}, Free=${freeSessions}`);

            // Get group price and calculate per-session amount
            const { data: studentGroupData, error: studentGroupError } = await supabase
                .from('student_groups')
                .select(`
                    groups!inner(
                        price
                    )
                `)
                .eq('student_id', studentId)
                .eq('group_id', groupId)
                .single();

            if (studentGroupError || !studentGroupData) {
                console.error('Error fetching group pricing:', studentGroupError);
                return null;
            }

            const groupPriceInfo = Array.isArray(studentGroupData.groups) ? studentGroupData.groups[0] : studentGroupData.groups;
            const fullGroupPrice = groupPriceInfo.price;
            const pricePerSession = fullGroupPrice / totalSessions;

            // Calculate based on simple logic
            const actualGroupFee = obligatorySessions * pricePerSession; // Only charge for obligatory sessions
            const freeAmount = freeSessions * pricePerSession; // Amount not charged

            console.log(`💰 Simple calculation: Must pay=${actualGroupFee}, Free=${freeAmount}, Full=${fullGroupPrice}`);

            // Check current payment status for this group
            const { data: payments, error: paymentsError } = await supabase
                .from('payments')
                .select('*')
                .eq('student_id', studentId)
                .eq('group_id', groupId);

            if (paymentsError) {
                console.error('Error fetching payments for stop calculation:', paymentsError);
                return null;
            }

            const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

            console.log(`🔍 Payment status: Paid=${totalPaid}, Should pay=${actualGroupFee}`);

            let paymentType: string;
            let paymentAmount: number;
            let paymentNotes: string;

            if (totalPaid > actualGroupFee) {
                // Student OVERPAID - refund the excess
                paymentType = 'balance_credit';
                paymentAmount = totalPaid - actualGroupFee;
                paymentNotes = `Stop refund: Overpaid ${paymentAmount} DA (paid ${totalPaid}, should pay ${actualGroupFee} for ${obligatorySessions} obligatory sessions)`;
                console.log(`💳 Student OVERPAID. Refunding excess ${paymentAmount} DA`);
            } else {
                // Student owes money or paid exactly right - reduce debt by free sessions amount
                const freeAmount = freeSessions * pricePerSession;
                paymentType = 'attendance_credit';
                paymentAmount = freeAmount;
                paymentNotes = `Stop credit: Reducing debt by ${freeAmount} DA for ${freeSessions} free sessions (stopped)`;
                console.log(`💳 Student debt reduced by ${freeAmount} DA for ${freeSessions} free sessions`);
            }

            // Create the payment record
            const { error: insertError } = await supabase
                .from('payments')
                .insert({
                    student_id: studentId,
                    group_id: groupId,
                    amount: paymentAmount,
                    payment_type: paymentType,
                    date: stopDate,  // ✅ FIX: Add the missing date field
                    notes: paymentNotes,
                    admin_name: 'System'
                });

            if (insertError) {
                console.error('Error creating stop payment adjustment:', insertError);
                return null;
            }

            console.log(`✅ Stop adjustment created: ${paymentType} of ${paymentAmount} DA`);

            return {
                studentId,
                groupId,
                sessionId,
                sessionDate: stopDate,
                attendanceStatus: 'stop',
                adjustmentAmount: paymentAmount,
                paymentType,
                notes: paymentNotes,
                attendedSessions: obligatorySessions,
                stoppedSessions: freeSessions
            };

        } catch (error) {
            console.error('Error in processStopAdjustment:', error);
            return null;
        }
    }
};