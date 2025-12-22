import { supabase } from './supabase';
import { Payment, Student, Group, Session, AttendanceStatus } from '../types';

export interface PaymentAllocation {
    id: string;
    groupId: number | null;
    amount: number;
    notes: string;
    paymentType: 'registration_fee' | 'group_payment' | 'balance_addition' | 'refund' | 'debt_payment';
    originalAmount?: number;
    discount?: number;
}

export interface StudentBalance {
    studentId: string;
    studentName: string;
    totalBalance: number;
    totalPaid: number;
    remainingBalance: number;
    groupBalances: GroupBalance[];
}

export interface GroupBalance {
    groupId: number;
    groupName: string;
    groupFees: number;
    amountPaid: number;
    remainingAmount: number;
    discount?: number;
    isRegistrationFee?: boolean;
    startDate?: string | null;
    status: 'active' | 'inactive' | 'stopped';
    sessionsCount: number;
    attendedSessions: number;
}

export interface RefundRequest {
    studentId: string;
    studentName: string;
    customId?: string;
    balance: number;
    stoppedGroups: Array<{
        id: number;
        name: string;
        refundableAmount: number;
        stopReason: string;
    }>;
    status: 'pending' | 'approved' | 'rejected';
    adminNotes?: string;
}

export interface DebtRecord {
    studentId: string;
    studentName: string;
    customId?: string;
    balance: number;
    inactiveGroups: Array<{
        id: number;
        name: string;
        owedAmount: number;
        stopReason: string;
    }>;
}

export interface CallLogEntry {
    id: string;
    studentId: string;
    studentName: string;
    studentPhone: string;
    groupsWithDebts: Array<{
        id: number;
        name: string;
        remainingAmount: number;
    }>;
    totalRemainingAmount: number;
    notes: string;
    callDate: Date;
    adminName: string;
}

export class PaymentService {
    private static instance: PaymentService;

    static getInstance(): PaymentService {
        if (!PaymentService.instance) {
            PaymentService.instance = new PaymentService();
        }
        return PaymentService.instance;
    }

    // 1. Student Registration Fee Management
    async handleStudentRegistration(studentId: string, isRegistrationFeePaid: boolean, registrationFeeAmount: number = 500): Promise<void> {
        try {
            if (isRegistrationFeePaid) {
                // Generate receipt for paid registration fee
                await this.createPayment({
                    studentId,
                    groupId: undefined,
                    amount: registrationFeeAmount,
                    date: new Date(),
                    notes: 'Registration fee paid',
                    adminName: 'System',
                    paymentType: 'registration_fee',
                    discount: 0,
                    originalAmount: registrationFeeAmount,
                });
            } else {
                // Add to student balance as unpaid
                await this.addToUnpaidBalance(studentId, 'Registration Fee', registrationFeeAmount, 0);
            }
        } catch (error) {
            console.error('Error handling student registration:', error);
            throw new Error(`Failed to handle student registration: ${error}`);
        }
    }

    // 2. Group Enrollment & Fees
    async handleGroupEnrollment(studentId: string, groupId: number, groupName: string, groupPrice: number): Promise<void> {
        try {
            // Add group fee to student's balance
            await this.addToUnpaidBalance(studentId, groupName, groupPrice, groupId);
        } catch (error) {
            console.error('Error handling group enrollment:', error);
            throw new Error(`Failed to handle group enrollment: ${error}`);
        }
    }

    // 3. Deposits & Payments with Priority Allocation
    async processDeposit(
        studentId: string,
        amount: number,
        date: Date,
        notes?: string,
        adminName: string = 'Admin'
    ): Promise<{ depositId: string; allocations: PaymentAllocation[] }> {
        try {
            const allocations: PaymentAllocation[] = [];
            let remainingAmount = amount;

            // Get current student balance
            const balance = await this.getStudentBalance(studentId);

            // Priority 1: Registration Fee (always first)
            const registrationBalance = balance.groupBalances.find(gb => gb.isRegistrationFee);
            if (registrationBalance && registrationBalance.remainingAmount > 0 && remainingAmount > 0) {
                const toPay = Math.min(remainingAmount, registrationBalance.remainingAmount);
                const allocation = await this.allocatePayment(
                    studentId,
                    toPay,
                    date,
                    'Registration fee payment',
                    null,
                    'registration_fee',
                    adminName
                );
                allocations.push(allocation);
                remainingAmount -= toPay;
            }

            // Priority 2: Groups (oldest first)
            const unpaidGroups = balance.groupBalances
                .filter(gb => !gb.isRegistrationFee && gb.remainingAmount > 0)
                .sort((a, b) => {
                    if (a.startDate && b.startDate) {
                        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                    }
                    return a.groupId - b.groupId;
                });

            for (const group of unpaidGroups) {
                if (remainingAmount <= 0) break;

                const toPay = Math.min(remainingAmount, group.remainingAmount);
                const allocation = await this.allocatePayment(
                    studentId,
                    toPay,
                    date,
                    `Group payment: ${group.groupName}`,
                    group.groupId,
                    'group_payment',
                    adminName
                );
                allocations.push(allocation);
                remainingAmount -= toPay;
            }

            // Priority 3: Any remaining amount becomes balance credit
            let depositId = '';
            if (remainingAmount > 0) {
                const creditPayment = await this.createPayment({
                    studentId,
                    groupId: undefined,
                    amount: remainingAmount,
                    date,
                    notes: notes || 'Balance credit deposit',
                    adminName,
                    paymentType: 'balance_addition',
                    discount: 0,
                    originalAmount: remainingAmount,
                });
                depositId = creditPayment.id;
            }

            return { depositId, allocations };
        } catch (error) {
            console.error('Error processing deposit:', error);
            throw new Error(`Failed to process deposit: ${error}`);
        }
    }

    // 4. Attendance & Session Price Adjustment
    async handleAttendanceAdjustment(
        studentId: string,
        groupId: number,
        sessionId: string,
        oldStatus: AttendanceStatus,
        newStatus: AttendanceStatus
    ): Promise<void> {
        console.log('Attendance adjustment skipped - automatic payment adjustments are disabled', {
            studentId,
            groupId,
            sessionId,
            oldStatus,
            newStatus,
        });
        return;
    }

    // 5. Stop Attendance Case
    async handleStopAttendance(
        studentId: string,
        groupId: number,
        stopReason: string,
        adminName: string
    ): Promise<void> {
        try {
            // Update student status for this group to inactive
            await this.updateStudentGroupStatus(studentId, groupId, 'stopped');

            // Get group details
            const group = await this.getGroup(groupId);
            if (!group) return;

            const balance = await this.getStudentBalance(studentId);
            const groupBalance = balance.groupBalances.find(gb => gb.groupId === groupId);

            if (groupBalance) {
                if (groupBalance.remainingAmount <= 0) {
                    // Group was fully paid - calculate refund for remaining sessions
                    const remainingSessions = group.totalSessions - groupBalance.attendedSessions;
                    const refundAmount = remainingSessions * (group.price / group.totalSessions);

                    if (refundAmount > 0) {
                        await this.createPayment({
                            studentId,
                            groupId: undefined,
                            amount: -refundAmount,
                            date: new Date(),
                            notes: `Refund for stopped group: ${group.name} - ${stopReason}`,
                            adminName,
                            paymentType: 'balance_addition',
                            discount: 0,
                            originalAmount: refundAmount,
                        });
                    }
                } else {
                    // Group not fully paid - calculate amount for attended sessions only
                    const attendedSessions = groupBalance.attendedSessions;
                    const owedAmount = attendedSessions * (group.price / group.totalSessions);

                    // Update the owed amount
                    await this.adjustGroupFee(studentId, groupId, owedAmount - groupBalance.groupFees);
                }
            }

            // Log the stop reason
            await this.logStopReason(studentId, groupId, stopReason, adminName);
        } catch (error) {
            console.error('Error handling stop attendance:', error);
            throw new Error(`Failed to handle stop attendance: ${error}`);
        }
    }

    // 6. Refund Management
    async getRefundList(): Promise<RefundRequest[]> {
        try {
            const { data: students, error } = await supabase
                .from('students')
                .select(`
          id,
          name,
          custom_id,
          student_groups!inner(
            group_id,
            status,
            groups(
              id,
              name,
              price,
              total_sessions
            )
          )
        `)
                .eq('student_groups.status', 'stopped');

            if (error) throw error;

            const refundRequests: RefundRequest[] = [];

            for (const student of students || []) {
                const balance = await this.getStudentBalance(student.id);

                // Check if student has no active groups and positive balance
                const hasActiveGroups = student.student_groups.some(sg => sg.status === 'active');

                if (!hasActiveGroups && balance.remainingBalance > 0) {
                    const stoppedGroupsPromises = student.student_groups
                        .filter(sg => sg.status === 'stopped')
                        .map(async (sg) => ({
                            id: sg.group_id,
                            name: sg.groups[0]?.name || 'Unknown Group',
                            refundableAmount: this.calculateRefundableAmount(sg.groups[0], balance),
                            stopReason: await this.getStopReason(student.id, sg.group_id)
                        }));

                    const stoppedGroups = await Promise.all(stoppedGroupsPromises);

                    refundRequests.push({
                        studentId: student.id,
                        studentName: student.name,
                        customId: student.custom_id,
                        balance: balance.remainingBalance,
                        stoppedGroups,
                        status: 'pending'
                    });
                }
            }

            return refundRequests;
        } catch (error) {
            console.error('Error getting refund list:', error);
            throw new Error(`Failed to get refund list: ${error}`);
        }
    }

    async processRefund(
        studentId: string,
        amount: number,
        date: Date,
        notes?: string,
        adminName: string = 'Admin'
    ): Promise<void> {
        try {
            // Create refund payment
            await this.createPayment({
                studentId,
                groupId: undefined,
                amount: -amount, // Negative amount for refund
                date,
                notes: notes || 'Refund processed',
                adminName,
                paymentType: 'balance_addition',
                discount: 0,
                originalAmount: amount,
            });

            // Update refund status
            await this.updateRefundStatus(studentId, 'approved', adminName);
        } catch (error) {
            console.error('Error processing refund:', error);
            throw new Error(`Failed to process refund: ${error}`);
        }
    }

    // 7. Debts Management
    async getDebtsList(): Promise<DebtRecord[]> {
        try {
            const { data: students, error } = await supabase
                .from('students')
                .select(`
          id,
          name,
          custom_id,
          student_groups!inner(
            group_id,
            status,
            groups(
              id,
              name,
              price,
              total_sessions
            )
          )
        `)
                .eq('student_groups.status', 'stopped');

            if (error) throw error;

            const debtRecords: DebtRecord[] = [];

            for (const student of students || []) {
                const balance = await this.getStudentBalance(student.id);

                // Check if student has no active groups and negative balance
                const hasActiveGroups = student.student_groups.some(sg => sg.status === 'active');

                if (!hasActiveGroups && balance.remainingBalance < 0) {
                    const inactiveGroupsPromises = student.student_groups
                        .filter(sg => sg.status === 'stopped')
                        .map(async (sg) => ({
                            id: sg.group_id,
                            name: sg.groups[0]?.name || 'Unknown Group',
                            owedAmount: this.calculateOwedAmount(sg.groups[0], balance),
                            stopReason: await this.getStopReason(student.id, sg.group_id)
                        }));

                    const inactiveGroups = await Promise.all(inactiveGroupsPromises);

                    debtRecords.push({
                        studentId: student.id,
                        studentName: student.name,
                        customId: student.custom_id,
                        balance: balance.remainingBalance,
                        inactiveGroups
                    });
                }
            }

            return debtRecords;
        } catch (error) {
            console.error('Error getting debts list:', error);
            throw new Error(`Failed to get debts list: ${error}`);
        }
    }

    async processDebtPayment(
        studentId: string,
        amount: number,
        date: Date,
        notes?: string,
        adminName: string = 'Admin'
    ): Promise<void> {
        try {
            await this.createPayment({
                studentId,
                groupId: undefined,
                amount,
                date,
                notes: notes || 'Debt payment received',
                adminName,
                paymentType: 'balance_addition',
                discount: 0,
                originalAmount: amount,
            });
        } catch (error) {
            console.error('Error processing debt payment:', error);
            throw new Error(`Failed to process debt payment: ${error}`);
        }
    }

    // 8. Call Log Management
    async createCallLog(callLog: Omit<CallLogEntry, 'id'>): Promise<CallLogEntry> {
        try {
            const { data, error } = await supabase
                .from('call_logs')
                .insert({
                    student_id: callLog.studentId,
                    student_name: callLog.studentName,
                    student_phone: callLog.studentPhone,
                    groups_with_debts: callLog.groupsWithDebts,
                    total_remaining_amount: callLog.totalRemainingAmount,
                    notes: callLog.notes,
                    call_date: callLog.callDate.toISOString(),
                    admin_name: callLog.adminName,
                })
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                studentId: data.student_id,
                studentName: data.student_name,
                studentPhone: data.student_phone,
                groupsWithDebts: data.groups_with_debts,
                totalRemainingAmount: data.total_remaining_amount,
                notes: data.notes,
                callDate: new Date(data.call_date),
                adminName: data.admin_name,
            };
        } catch (error) {
            console.error('Error creating call log:', error);
            throw new Error(`Failed to create call log: ${error}`);
        }
    }

    // Utility methods
    private async addToUnpaidBalance(studentId: string, description: string, amount: number, groupId: number): Promise<void> {
        try {
            // Insert into unpaid_balances table
            const { error } = await supabase
                .from('unpaid_balances')
                .insert({
                    student_id: studentId,
                    group_id: groupId === 0 ? null : groupId,
                    description,
                    amount,
                    is_registration_fee: groupId === 0,
                    status: 'unpaid'
                });

            if (error) throw error;
            console.log(`Added ${description} (${amount}) to unpaid balance for student ${studentId}`);
        } catch (error) {
            console.error('Error adding to unpaid balance:', error);
            throw new Error(`Failed to add to unpaid balance: ${error}`);
        }
    }

    private async allocatePayment(
        studentId: string,
        amount: number,
        date: Date,
        notes: string,
        groupId: number | null,
        paymentType: string,
        adminName: string
    ): Promise<PaymentAllocation> {
        const payment = await this.createPayment({
            studentId,
            groupId: groupId || undefined,
            amount,
            date,
            notes,
            adminName,
            paymentType: paymentType as any,
            discount: 0,
            originalAmount: amount,
        });

        return {
            id: payment.id,
            groupId: payment.groupId || null,
            amount: payment.amount,
            notes: payment.notes || '',
            paymentType: payment.paymentType as any,
            originalAmount: payment.originalAmount,
            discount: payment.discount,
        };
    }

    private async createPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
        const { data, error } = await supabase
            .from('payments')
            .insert({
                student_id: payment.studentId,
                group_id: payment.groupId,
                amount: payment.amount,
                date: payment.date.toISOString().split('T')[0],
                notes: payment.notes,
                admin_name: payment.adminName,
                discount: payment.discount || 0,
                original_amount: payment.originalAmount || payment.amount,
                payment_type: payment.paymentType || 'group_payment',
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            studentId: data.student_id,
            groupId: data.group_id,
            amount: data.amount,
            date: new Date(data.date),
            notes: data.notes,
            adminName: data.admin_name,
            discount: data.discount || 0,
            originalAmount: data.original_amount || data.amount,
            paymentType: data.payment_type as any,
        };
    }

    private async getGroup(groupId: number): Promise<any> {
        const { data, error } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single();

        if (error) throw error;
        return data;
    }

    private async adjustGroupFee(studentId: string, groupId: number, adjustment: number): Promise<void> {
        try {
            // Update the unpaid balance for this group
            // First get current amount
            const { data: currentBalance, error: fetchError } = await supabase
                .from('unpaid_balances')
                .select('amount')
                .eq('student_id', studentId)
                .eq('group_id', groupId)
                .single();

            if (fetchError) throw fetchError;

            const newAmount = Math.max(0, (currentBalance?.amount || 0) + adjustment);

            const { error } = await supabase
                .from('unpaid_balances')
                .update({
                    amount: newAmount,
                    updated_at: new Date().toISOString()
                })
                .eq('student_id', studentId)
                .eq('group_id', groupId);

            if (error) throw error;
            console.log(`Adjusted group fee for student ${studentId}, group ${groupId} by ${adjustment}`);
        } catch (error) {
            console.error('Error adjusting group fee:', error);
            throw new Error(`Failed to adjust group fee: ${error}`);
        }
    }

    private async updateStudentGroupStatus(studentId: string, groupId: number, status: string): Promise<void> {
        const { error } = await supabase
            .from('student_groups')
            .update({ status })
            .eq('student_id', studentId)
            .eq('group_id', groupId);

        if (error) throw error;
    }

    private async logStopReason(studentId: string, groupId: number, reason: string, adminName: string): Promise<void> {
        try {
            // Insert into stop_reasons table
            const { error } = await supabase
                .from('stop_reasons')
                .insert({
                    student_id: studentId,
                    group_id: groupId,
                    reason,
                    admin_name: adminName
                });

            if (error) throw error;
            console.log(`Logged stop reason for student ${studentId}, group ${groupId}: ${reason}`);
        } catch (error) {
            console.error('Error logging stop reason:', error);
            throw new Error(`Failed to log stop reason: ${error}`);
        }
    }

    async getStopReason(studentId: string, groupId: number): Promise<string> {
        try {
            const { data, error } = await supabase
                .from('stop_reasons')
                .select('reason')
                .eq('student_id', studentId)
                .eq('group_id', groupId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) return 'Student stopped attending';
            return data?.reason || 'Student stopped attending';
        } catch (error) {
            console.error('Error getting stop reason:', error);
            return 'Student stopped attending';
        }
    }

    private calculateRefundableAmount(group: any, balance: StudentBalance): number {
        try {
            const groupBalance = balance.groupBalances.find(gb => gb.groupId === group.id);
            if (!groupBalance) return 0;

            // Calculate based on remaining sessions and amount paid
            const sessionPrice = group.price / group.total_sessions;
            const remainingSessions = group.total_sessions - (groupBalance.attendedSessions || 0);
            const refundAmount = remainingSessions * sessionPrice;

            // Don't refund more than what was paid
            return Math.min(refundAmount, groupBalance.amountPaid);
        } catch (error) {
            console.error('Error calculating refundable amount:', error);
            return 0;
        }
    }

    private calculateOwedAmount(group: any, balance: StudentBalance): number {
        try {
            const groupBalance = balance.groupBalances.find(gb => gb.groupId === group.id);
            if (!groupBalance) return 0;

            // Calculate based on attended sessions only
            const sessionPrice = group.price / group.total_sessions;
            return (groupBalance.attendedSessions || 0) * sessionPrice;
        } catch (error) {
            console.error('Error calculating owed amount:', error);
            return 0;
        }
    }

    private async updateRefundStatus(studentId: string, status: string, adminName: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('refund_requests')
                .update({
                    status,
                    processed_by: adminName,
                    processed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('student_id', studentId);

            if (error) throw error;
            console.log(`Updated refund status for student ${studentId} to ${status}`);
        } catch (error) {
            console.error('Error updating refund status:', error);
            throw new Error(`Failed to update refund status: ${error}`);
        }
    }

    // Public method to get student balance (existing functionality)
    async getStudentBalance(studentId: string): Promise<StudentBalance> {
        try {
            // Get student information
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('id, name, custom_id, default_discount')
                .eq('id', studentId)
                .single();

            if (studentError) throw studentError;

            // Get student's groups and their fees
            const { data: studentGroups, error: groupsError } = await supabase
                .from('student_groups')
                .select(`
          group_id,
          status,
          enrollment_date,
          group_discount,
          groups (
            id,
            name,
            price,
            total_sessions,
            start_date
          )
        `)
                .eq('student_id', studentId)
                .in('status', ['active', 'stopped']);

            if (groupsError) throw groupsError;

            // Get all payments for this student
            const { data: payments, error: paymentsError } = await supabase
                .from('payments')
                .select('*')
                .eq('student_id', studentId);

            if (paymentsError) throw paymentsError;

            // --- 1. Calculate Initial Debts (Costs) ---
            const debts: {
                id: string; // 'reg' or group_id
                name: string;
                amount: number;
                date: number; // timestamp for sorting
                groupId: number;
                isRegistration: boolean;
                discount: number;
                originalAmountProcessed: number;
            }[] = [];

            // Add Registration Fee Debt
            // Default 500, but checking if there's a custom logic might be needed later
            // For now, assuming 500 is the standard registration fee
            debts.push({
                id: 'reg',
                name: 'Registration Fee',
                amount: 500,
                date: 0, // Priority 0 (Oldest)
                groupId: 0,
                isRegistration: true,
                discount: 0,
                originalAmountProcessed: 0, // Placeholder
            });

            // Add Group Debts
            for (const sg of studentGroups || []) {
                const group = sg.groups[0];
                if (!group) continue;

                // Apply Discount Logic
                // Priority: Group Specific Discount > Student Default Discount
                let applicableDiscount = 0;
                if (sg.group_discount !== null && sg.group_discount !== undefined) {
                    applicableDiscount = sg.group_discount;
                } else if (student.default_discount) {
                    applicableDiscount = student.default_discount;
                }

                const basePrice = group.price || 0;
                const discountedPrice = applicableDiscount > 0
                    ? basePrice * (1 - applicableDiscount / 100)
                    : basePrice;

                // Normalize price (round to 2 decimals)
                const finalPrice = Math.max(0, Math.round(discountedPrice * 100) / 100);

                debts.push({
                    id: String(group.id),
                    name: group.name,
                    amount: finalPrice,
                    date: group.start_date ? new Date(group.start_date).getTime() : new Date().getTime(),
                    groupId: group.id,
                    isRegistration: false,
                    discount: applicableDiscount,
                    originalAmountProcessed: 0,
                });
            }

            // Sort debts by date (Registration first, then by group start date)
            debts.sort((a, b) => a.date - b.date);

            // --- 2. Calculate Total Paid (Pool of Money) ---
            // We sum ALL payments relative to this student
            const totalPaid = payments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0;

            // --- 3. Virtual Allocation Logic ---
            // We flow the Total Paid amount into the debts one by one
            let remainingMoney = totalPaid;
            const groupBalances: GroupBalance[] = [];
            let totalBalanceCalculated = 0;

            for (const debt of debts) {
                totalBalanceCalculated += debt.amount;

                // How much of the remaining money can cover this debt?
                const amountAllocated = Math.min(remainingMoney, debt.amount);
                remainingMoney -= amountAllocated;

                const remainingDebt = Math.max(0, debt.amount - amountAllocated);

                // Find the original student_group status if it's a group
                const status = debt.isRegistration
                    ? 'active'
                    : (studentGroups?.find((sg: any) => sg.group_id === debt.groupId)?.status || 'active');

                groupBalances.push({
                    groupId: debt.groupId,
                    groupName: debt.name,
                    groupFees: debt.amount, // This is the DISCOUNTED price, the effective fee
                    amountPaid: amountAllocated,
                    remainingAmount: remainingDebt,
                    discount: debt.discount,
                    isRegistrationFee: debt.isRegistration,
                    status: status as any,
                    startDate: debt.isRegistration ? null : (studentGroups?.find((sg: any) => sg.group_id === debt.groupId)?.enrollment_date),
                    sessionsCount: 0, // Placeholder
                    attendedSessions: 0, // Placeholder
                });
            }

            // If there is still money left after covering all debts, it's a credit
            // We don't have a "Credit Item" in groupBalances typically, but the Global Balance will reflect it
            const globalRemainingBalance = totalBalanceCalculated - totalPaid;

            return {
                studentId: student.id,
                studentName: student.name,
                totalBalance: totalBalanceCalculated,
                totalPaid,
                remainingBalance: globalRemainingBalance,
                groupBalances,
            };

        } catch (error) {
            console.error('Error getting student balance:', error);
            throw new Error(`Failed to get student balance: ${error}`);
        }
    }
}

export const paymentService = PaymentService.getInstance();

// Utility function to populate unpaid balances for existing students
export async function populateExistingUnpaidBalances(): Promise<void> {
    try {
        console.log('🔄 Starting to populate unpaid balances for existing students...');

        // Get all students who are in groups but don't have unpaid balance records
        const { data: existingStudents, error: studentsError } = await supabase
            .from('student_groups')
            .select(`
        student_id,
        group_id,
        status,
        enrollment_date,
        groups (
          id,
          name,
          price
        )
      `)
            .eq('status', 'active');

        if (studentsError) throw studentsError;

        console.log(`Found ${existingStudents?.length || 0} active student-group enrollments`);

        let processedCount = 0;
        let errorCount = 0;

        for (const enrollment of existingStudents || []) {
            try {
                // Check if unpaid balance already exists for this student-group combination
                const { data: existingBalance, error: balanceCheckError } = await supabase
                    .from('unpaid_balances')
                    .select('id')
                    .eq('student_id', enrollment.student_id)
                    .eq('group_id', enrollment.group_id)
                    .single();

                if (balanceCheckError && balanceCheckError.code !== 'PGRST116') {
                    // PGRST116 means "no rows returned", which is expected
                    console.warn(`Error checking existing balance for student ${enrollment.student_id}:`, balanceCheckError);
                    continue;
                }

                if (existingBalance) {
                    console.log(`Unpaid balance already exists for student ${enrollment.student_id} in group ${enrollment.group_id}`);
                    continue;
                }

                // Add group fee to unpaid balance
                await paymentService.handleGroupEnrollment(
                    enrollment.student_id,
                    enrollment.group_id,
                    enrollment.groups[0]?.name || 'Unknown Group',
                    enrollment.groups[0]?.price || 0
                );

                processedCount++;
                console.log(`✅ Added unpaid balance for student ${enrollment.student_id} in group ${enrollment.group_id}`);
            } catch (error) {
                console.error(`❌ Failed to process student ${enrollment.student_id} in group ${enrollment.group_id}:`, error);
                errorCount++;
            }
        }

        console.log(`🎉 Population complete! Processed: ${processedCount}, Errors: ${errorCount}`);
    } catch (error) {
        console.error('❌ Failed to populate existing unpaid balances:', error);
        throw error;
    }
}
