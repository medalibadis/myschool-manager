import { supabase } from './supabase';

export interface AttendancePaymentAdjustment {
    studentId: string;
    groupId: number;
    sessionId: string;
    sessionDate: string;
    attendanceStatus: string;
    sessionAmount: number;
    adjustmentType: 'refund' | 'debt_reduction';
    notes: string;
}

export const attendancePaymentService = {
    /**
     * Process attendance-based payment adjustments
     * Called when attendance status changes to justify/change/new
     */
    async processAttendanceAdjustment(
        sessionId: string,
        studentId: string,
        newStatus: string
    ): Promise<AttendancePaymentAdjustment | null> {
        try {
            // Only process specific attendance statuses
            if (!['justified', 'change', 'new'].includes(newStatus)) {
                return null;
            }

            console.log(`🔄 Processing attendance adjustment for session ${sessionId}, student ${studentId}, status: ${newStatus}`);

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

            console.log('📋 Raw session data:', JSON.stringify(sessionData, null, 2));

            // Check if groups data exists and is properly structured
            if (!sessionData.groups) {
                console.error('❌ No groups data found in session response');
                return null;
            }

            const groupsArray = Array.isArray(sessionData.groups) ? sessionData.groups : [sessionData.groups];
            if (groupsArray.length === 0) {
                console.error('❌ Groups array is empty');
                return null;
            }

            const group = groupsArray[0] as { id: number; name: string; total_sessions: number };

            // Validate group data
            if (!group || typeof group.total_sessions === 'undefined') {
                console.error('❌ Invalid group data:', group);
                return null;
            }

            // Get student's price per session from students table
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('price_per_session')
                .eq('id', studentId)
                .single();

            if (studentError || !studentData) {
                console.error('Error fetching student data:', studentError);
                return null;
            }

            // Calculate session amount based on group price / total sessions
            // First, get the group price from the database
            console.log(`🔍 Querying student_groups for student ${studentId} and group ${group.id}`);
            const { data: groupData, error: groupError } = await supabase
                .from('student_groups')
                .select(`
                    groups!inner(
                        id,
                        name,
                        price,
                        total_sessions
                    )
                `)
                .eq('student_id', studentId)
                .eq('group_id', group.id)
                .single();

            console.log('📋 Student-group query result:', { groupData, groupError });

            let sessionAmount = 0;
            let groupPrice = 0;

            if (groupData && groupData.groups && typeof groupData.groups === 'object') {
                const groupInfo = Array.isArray(groupData.groups) ? groupData.groups[0] : groupData.groups;
                if (groupInfo.price && groupInfo.total_sessions) {
                    groupPrice = Number(groupInfo.price);
                    sessionAmount = groupPrice / Number(groupInfo.total_sessions);
                    console.log(`💰 Using group-based calculation: Group price $${groupPrice} ÷ ${groupInfo.total_sessions} sessions = $${sessionAmount} per session`);
                }
            }

            // If student_groups query failed, try getting group price directly
            if (sessionAmount === 0) {
                console.log(`🔄 Trying direct group query for group ${group.id}`);
                const { data: directGroupData, error: directGroupError } = await supabase
                    .from('groups')
                    .select('id, name, price, total_sessions')
                    .eq('id', group.id)
                    .single();

                if (directGroupData && directGroupData.price && directGroupData.total_sessions) {
                    groupPrice = Number(directGroupData.price);
                    sessionAmount = groupPrice / Number(directGroupData.total_sessions);
                    console.log(`💰 Using direct group query: Group price $${groupPrice} ÷ ${directGroupData.total_sessions} sessions = $${sessionAmount} per session`);
                }
            }

            // Final fallback to student's price per session if group price not available
            if (sessionAmount === 0) {
                sessionAmount = Number(studentData.price_per_session) || 0;
                groupPrice = sessionAmount * group.total_sessions;
                console.log(`💰 Using student-based fallback: $${sessionAmount} per session × ${group.total_sessions} sessions = $${groupPrice} total`);
            }

            if (sessionAmount === 0) {
                console.warn(`⚠️ Cannot calculate session amount. Student ${studentId} has no price_per_session and group has no price set.`);
                return null;
            }

            console.log(`📊 Session details: Group ${group.name}, Sessions: ${group.total_sessions}, Student Session Amount: $${sessionAmount}`);

            // Check if student has paid for this group (including attendance credits)
            const { data: payments, error: paymentsError } = await supabase
                .from('payments')
                .select('amount, payment_type')
                .eq('student_id', studentId)
                .eq('group_id', group.id)
                .in('payment_type', ['group_payment', 'attendance_credit']);

            if (paymentsError) {
                console.error('Error checking payments:', paymentsError);
                return null;
            }

            const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
            const isGroupPaid = totalPaid >= groupPrice;

            console.log(`💰 Payment status: Total paid: $${totalPaid}, Group price: $${groupPrice}, Is paid: ${isGroupPaid}`);
            console.log(`🔍 Payment details:`, payments?.map(p => ({ type: p.payment_type, amount: p.amount })));

            let adjustment: AttendancePaymentAdjustment;

            // Create a payment record to reflect the attendance adjustment
            const adjustmentNote = `Attendance adjustment: ${newStatus} session on ${sessionData.date}`;

            if (isGroupPaid) {
                // Group is paid - create a credit balance that can be used for other groups
                console.log(`✅ Group is fully paid. Creating credit balance of $${sessionAmount}`);

                const { data: creditPayment, error: creditError } = await supabase
                    .from('payments')
                    .insert({
                        student_id: studentId,
                        group_id: null, // Credit not tied to specific group
                        amount: sessionAmount,
                        date: new Date().toISOString().split('T')[0],
                        payment_type: 'balance_credit',
                        notes: adjustmentNote,
                        admin_name: 'System - Attendance Adjustment'
                    })
                    .select()
                    .single();

                if (creditError) {
                    console.error('Error creating credit payment:', creditError);
                    return null;
                }

                adjustment = {
                    studentId,
                    groupId: group.id,
                    sessionId,
                    sessionDate: sessionData.date,
                    attendanceStatus: newStatus,
                    sessionAmount,
                    adjustmentType: 'refund',
                    notes: `Credit balance created: $${sessionAmount}`
                };
            } else {
                // Group is not paid - reduce the debt for this group
                console.log(`💳 Group is not fully paid. Reducing debt by $${sessionAmount}`);

                const { data: debtReduction, error: debtError } = await supabase
                    .from('payments')
                    .insert({
                        student_id: studentId,
                        group_id: group.id,
                        amount: sessionAmount,
                        date: new Date().toISOString().split('T')[0],
                        payment_type: 'attendance_credit',
                        notes: adjustmentNote,
                        admin_name: 'System - Attendance Adjustment'
                    })
                    .select()
                    .single();

                if (debtError) {
                    console.error('Error creating debt reduction payment:', debtError);
                    return null;
                }

                adjustment = {
                    studentId,
                    groupId: group.id,
                    sessionId,
                    sessionDate: sessionData.date,
                    attendanceStatus: newStatus,
                    sessionAmount,
                    adjustmentType: 'debt_reduction',
                    notes: `Group debt reduced by: $${sessionAmount}`
                };
            }

            return adjustment;
        } catch (error) {
            console.error('Error processing attendance adjustment:', error);
            return null;
        }
    },

    /**
     * Process refund for paid groups
     */
    async processRefund(
        studentId: string,
        groupId: number,
        sessionId: string,
        sessionDate: string,
        status: string,
        sessionAmount: number
    ): Promise<AttendancePaymentAdjustment> {
        try {
            console.log(`💸 Processing refund for paid group: $${sessionAmount}`);

            // Create refund payment record
            const { data: refundPayment, error: paymentError } = await supabase
                .from('payments')
                .insert({
                    student_id: studentId,
                    group_id: groupId,
                    amount: sessionAmount, // Positive amount (credit to balance)
                    date: new Date().toISOString().split('T')[0],
                    notes: `Attendance refund: ${status} status for session on ${sessionDate}`,
                    admin_name: 'System',
                    payment_type: 'balance_addition',
                    discount: 0,
                    original_amount: sessionAmount
                })
                .select()
                .single();

            if (paymentError) {
                console.error('Error creating refund payment:', paymentError);
                throw paymentError;
            }

            // Create receipt for the refund
            const { error: receiptError } = await supabase
                .from('receipts')
                .insert({
                    payment_id: refundPayment.id,
                    student_id: studentId,
                    student_name: '', // Will be filled by trigger or query
                    receipt_text: `ATTENDANCE REFUND RECEIPT
Session Date: ${sessionDate}
Status: ${status.toUpperCase()}
Refund Amount: $${sessionAmount}
Reason: Student attendance status changed to ${status}
This amount has been added to your balance as credit.
Generated automatically by the system.`,
                    amount: sessionAmount,
                    payment_type: 'attendance_refund',
                    group_name: '', // Will be filled by trigger or query
                    created_at: new Date().toISOString()
                });

            if (receiptError) {
                console.warn('Could not create refund receipt:', receiptError);
            }

            console.log(`✅ Refund processed successfully: $${sessionAmount} added to balance`);

            return {
                studentId,
                groupId,
                sessionId,
                sessionDate,
                attendanceStatus: status,
                sessionAmount,
                adjustmentType: 'refund',
                notes: `Refunded $${sessionAmount} for ${status} status - added to positive balance`
            };
        } catch (error) {
            console.error('Error processing refund:', error);
            throw error;
        }
    },

    /**
     * Process debt reduction for unpaid groups
     */
    async processDebtReduction(
        studentId: string,
        groupId: number,
        sessionId: string,
        sessionDate: string,
        status: string,
        sessionAmount: number
    ): Promise<AttendancePaymentAdjustment> {
        try {
            console.log(`💳 Processing debt reduction for unpaid group: $${sessionAmount}`);

            // Create negative payment record (reduces debt)
            const { data: debtReduction, error: paymentError } = await supabase
                .from('payments')
                .insert({
                    student_id: studentId,
                    group_id: groupId,
                    amount: -sessionAmount, // Negative amount (reduces debt)
                    date: new Date().toISOString().split('T')[0],
                    notes: `Attendance adjustment: ${status} status for session on ${sessionDate} - reduces unpaid group fee`,
                    admin_name: 'System',
                    payment_type: 'group_payment',
                    discount: 0,
                    original_amount: sessionAmount
                })
                .select()
                .single();

            if (paymentError) {
                console.error('Error creating debt reduction payment:', paymentError);
                throw paymentError;
            }

            // Create receipt for the debt reduction
            const { error: receiptError } = await supabase
                .from('receipts')
                .insert({
                    payment_id: debtReduction.id,
                    student_id: studentId,
                    student_name: '', // Will be filled by trigger or query
                    receipt_text: `ATTENDANCE ADJUSTMENT RECEIPT
Session Date: ${sessionDate}
Status: ${status.toUpperCase()}
Reduction Amount: $${sessionAmount}
Reason: Student attendance status changed to ${status}
This amount has been deducted from your unpaid group fee.
Generated automatically by the system.`,
                    amount: sessionAmount,
                    payment_type: 'attendance_adjustment',
                    group_name: '', // Will be filled by trigger or query
                    created_at: new Date().toISOString()
                });

            if (receiptError) {
                console.warn('Could not create debt reduction receipt:', receiptError);
            }

            console.log(`✅ Debt reduction processed successfully: $${sessionAmount} deducted from unpaid fee`);

            return {
                studentId,
                groupId,
                sessionId,
                sessionDate,
                attendanceStatus: status,
                sessionAmount,
                adjustmentType: 'debt_reduction',
                notes: `Reduced unpaid fee by $${sessionAmount} for ${status} status`
            };
        } catch (error) {
            console.error('Error processing debt reduction:', error);
            throw error;
        }
    },

    /**
     * Get attendance adjustment history for a student
     */
    async getAttendanceAdjustmentHistory(studentId: string): Promise<AttendancePaymentAdjustment[]> {
        try {
            const { data: payments, error } = await supabase
                .from('payments')
                .select(`
          id,
          amount,
          notes,
          date,
          group_id,
          payment_type
        `)
                .eq('student_id', studentId)
                .in('payment_type', ['balance_addition', 'group_payment'])
                .ilike('notes', '%Attendance%')
                .order('date', { ascending: false });

            if (error) {
                console.error('Error fetching attendance adjustment history:', error);
                return [];
            }

            return payments?.map(payment => ({
                studentId,
                groupId: payment.group_id || 0,
                sessionId: '', // Not stored in payments table
                sessionDate: payment.date,
                attendanceStatus: this.extractStatusFromNotes(payment.notes),
                sessionAmount: Math.abs(payment.amount),
                adjustmentType: payment.payment_type === 'balance_addition' ? 'refund' : 'debt_reduction',
                notes: payment.notes
            })) || [];
        } catch (error) {
            console.error('Error getting attendance adjustment history:', error);
            return [];
        }
    },

    /**
     * Extract attendance status from payment notes
     */
    extractStatusFromNotes(notes: string): string {
        if (notes.includes('justify')) return 'justified';
        if (notes.includes('change')) return 'change';
        if (notes.includes('new')) return 'new';
        return 'unknown';
    }
};
