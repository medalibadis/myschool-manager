import { Payment, Student, Group, AttendanceStatus } from '../types';
import { PaymentAllocation, StudentBalance, GroupBalance } from '../lib/payment-service';

// Utility functions for the enhanced payment system

/**
 * Receipt Generation Utilities
 */
export class ReceiptGenerator {
    /**
     * Generate a receipt for a payment
     */
    static generateReceipt(payment: Payment, student: Student, group?: Group): string {
        const receiptNumber = `RCP-${payment.id.substring(0, 8).toUpperCase()}`;
        const date = new Date(payment.date).toLocaleDateString();
        const time = new Date(payment.date).toLocaleTimeString();

        let receipt = `
╔══════════════════════════════════════════════════════════════╗
║                        PAYMENT RECEIPT                      ║
╠══════════════════════════════════════════════════════════════╣
║ Receipt #: ${receiptNumber.padEnd(47)} ║
║ Date: ${date.padEnd(52)} ║
║ Time: ${time.padEnd(52)} ║
╠══════════════════════════════════════════════════════════════╣
║ STUDENT INFORMATION                                         ║
║ Name: ${student.name.padEnd(52)} ║
║ ID: ${(student.custom_id || student.id).padEnd(54)} ║
║ Email: ${(student.email || '').padEnd(51)} ║
║ Phone: ${(student.phone || '').padEnd(51)} ║
╠══════════════════════════════════════════════════════════════╣
║ PAYMENT DETAILS                                             ║
║ Type: ${this.getPaymentTypeDisplay(payment).padEnd(52)} ║`;

        if (group) {
            receipt += `
║ Group: ${group.name.padEnd(52)} ║
║ Group ID: #${group.id.toString().padEnd(49)} ║`;
        }

        receipt += `
║ Amount: ${this.formatCurrency(payment.amount).padEnd(51)} ║`;

        if (payment.discount && payment.discount > 0) {
            const discountAmount = (payment.originalAmount || payment.amount) - payment.amount;
            receipt += `
║ Discount: ${payment.discount}% (${this.formatCurrency(discountAmount).padEnd(35)}) ║
║ Original Amount: ${this.formatCurrency(payment.originalAmount || payment.amount).padEnd(42)} ║`;
        }

        if (payment.notes) {
            receipt += `
╠══════════════════════════════════════════════════════════════╣
║ NOTES                                                        ║
║ ${this.wrapText(payment.notes, 58).padEnd(58)} ║`;
        }

        receipt += `
╠══════════════════════════════════════════════════════════════╣
║ Processed By: ${(payment.adminName || 'Admin').padEnd(47)} ║
║                                                              ║
║ Thank you for your payment!                                 ║
╚══════════════════════════════════════════════════════════════╝
    `;

        return receipt;
    }

    /**
     * Generate an allocation summary receipt
     */
    static generateAllocationReceipt(
        student: Student,
        depositAmount: number,
        allocations: PaymentAllocation[],
        depositId: string
    ): string {
        const receiptNumber = `ALLOC-${depositId.substring(0, 8).toUpperCase()}`;
        const date = new Date().toLocaleDateString();
        const time = new Date().toLocaleTimeString();

        let receipt = `
╔══════════════════════════════════════════════════════════════╗
║                   PAYMENT ALLOCATION RECEIPT                ║
╠══════════════════════════════════════════════════════════════╣
║ Receipt #: ${receiptNumber.padEnd(47)} ║
║ Date: ${date.padEnd(52)} ║
║ Time: ${time.padEnd(52)} ║
╠══════════════════════════════════════════════════════════════╣
║ STUDENT INFORMATION                                         ║
║ Name: ${student.name.padEnd(52)} ║
║ ID: ${(student.custom_id || student.id).padEnd(54)} ║
╠══════════════════════════════════════════════════════════════╣
║ DEPOSIT DETAILS                                             ║
║ Total Deposit: ${this.formatCurrency(depositAmount).padEnd(44)} ║
║ Deposit ID: ${depositId.padEnd(49)} ║
╠══════════════════════════════════════════════════════════════╣
║ ALLOCATIONS                                                 ║`;

        allocations.forEach((allocation, index) => {
            const allocationText = `${index + 1}. ${allocation.notes} - ${this.formatCurrency(allocation.amount)}`;
            receipt += `
║ ${this.wrapText(allocationText, 58).padEnd(58)} ║`;
        });

        const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
        const remainingBalance = depositAmount - totalAllocated;

        receipt += `
╠══════════════════════════════════════════════════════════════╣
║ SUMMARY                                                     ║
║ Total Allocated: ${this.formatCurrency(totalAllocated).padEnd(44)} ║
║ Remaining Balance: ${this.formatCurrency(remainingBalance).padEnd(42)} ║
╠══════════════════════════════════════════════════════════════╣
║ Processed By: Admin                                         ║
║                                                              ║
║ Allocation completed successfully!                           ║
╚══════════════════════════════════════════════════════════════╝
    `;

        return receipt;
    }

    private static getPaymentTypeDisplay(payment: Payment): string {
        if (!payment.groupId && payment.notes?.toLowerCase().includes('registration fee')) {
            return '🎓 Registration Fee';
        } else if (payment.groupId && payment.paymentType === 'group_payment') {
            return '👥 Group Fee';
        } else if (payment.amount < 0) {
            return '↩️ Refund';
        } else if (payment.paymentType === 'balance_addition' && payment.notes?.toLowerCase().includes('debt')) {
            return '💰 Debt Payment';
        } else if (payment.paymentType === 'balance_addition') {
            return '➕ Balance Addition';
        }
        return 'Payment';
    }

    private static formatCurrency(amount: number): string {
        return `$${Math.abs(amount).toFixed(2)}`;
    }

    private static wrapText(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
}

/**
 * Balance Calculation Utilities
 */
export class BalanceCalculator {
    /**
     * Calculate session price for a group
     */
    static calculateSessionPrice(group: Group): number {
        if (!group.price || !group.totalSessions || group.totalSessions === 0) {
            return 0;
        }
        return group.price / group.totalSessions;
    }

    /**
     * Calculate refund amount for stopped group
     */
    static calculateRefundAmount(
        group: Group,
        attendedSessions: number,
        totalPaid: number
    ): number {
        const sessionPrice = this.calculateSessionPrice(group);
        const remainingSessions = group.totalSessions - attendedSessions;
        const refundAmount = remainingSessions * sessionPrice;

        // Don't refund more than what was paid
        return Math.min(refundAmount, totalPaid);
    }

    /**
     * Calculate owed amount for attended sessions only
     */
    static calculateOwedAmount(
        group: Group,
        attendedSessions: number
    ): number {
        const sessionPrice = this.calculateSessionPrice(group);
        return attendedSessions * sessionPrice;
    }

    /**
     * Apply discount to amount
     */
    static applyDiscount(amount: number, discountPercentage: number): number {
        if (discountPercentage <= 0 || discountPercentage >= 100) {
            return amount;
        }
        return amount * (1 - discountPercentage / 100);
    }

    /**
     * Calculate total balance including all fees and payments
     */
    static calculateTotalBalance(
        registrationFee: number,
        groupFees: number[],
        totalPaid: number,
        totalRefunds: number
    ): number {
        const totalFees = registrationFee + groupFees.reduce((sum, fee) => sum + fee, 0);
        return totalFees - totalPaid + totalRefunds;
    }
}

/**
 * Refund Validation Utilities
 */
export class RefundValidator {
    /**
     * Validate if a student is eligible for refund
     */
    static isEligibleForRefund(
        studentBalance: StudentBalance,
        hasActiveGroups: boolean
    ): boolean {
        return !hasActiveGroups && studentBalance.remainingBalance > 0;
    }

    /**
     * Validate refund amount
     */
    static validateRefundAmount(
        requestedAmount: number,
        availableBalance: number
    ): { isValid: boolean; error?: string } {
        if (requestedAmount <= 0) {
            return { isValid: false, error: 'Refund amount must be greater than zero' };
        }

        if (requestedAmount > availableBalance) {
            return {
                isValid: false,
                error: `Refund amount (${requestedAmount}) exceeds available balance (${availableBalance})`
            };
        }

        return { isValid: true };
    }

    /**
     * Get refund reason based on stopped groups
     */
    static getRefundReason(stoppedGroups: Array<{ name: string; stopReason: string }>): string {
        if (stoppedGroups.length === 0) return 'No specific reason provided';

        const reasons = stoppedGroups.map(sg => `${sg.name}: ${sg.stopReason}`);
        return reasons.join('; ');
    }
}

/**
 * Debt Management Utilities
 */
export class DebtManager {
    /**
     * Check if student has outstanding debts
     */
    static hasOutstandingDebts(
        studentBalance: StudentBalance,
        hasActiveGroups: boolean
    ): boolean {
        return !hasActiveGroups && studentBalance.remainingBalance < 0;
    }

    /**
     * Calculate debt priority (which debts to pay first)
     */
    static calculateDebtPriority(
        groupBalances: GroupBalance[]
    ): GroupBalance[] {
        return groupBalances
            .filter(gb => gb.remainingAmount > 0)
            .sort((a, b) => {
                // Registration fee first
                if (a.isRegistrationFee) return -1;
                if (b.isRegistrationFee) return 1;

                // Then by start date (oldest first)
                if (a.startDate && b.startDate) {
                    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                }

                // Finally by group ID
                return a.groupId - b.groupId;
            });
    }

    /**
     * Calculate minimum payment to clear debt
     */
    static calculateMinimumPayment(groupBalances: GroupBalance[]): number {
        return groupBalances
            .filter(gb => gb.remainingAmount > 0)
            .reduce((sum, gb) => sum + gb.remainingAmount, 0);
    }
}

/**
 * Attendance Payment Adjustment Utilities
 */
export class AttendancePaymentAdjuster {
    /**
     * Check if attendance status requires payment adjustment
     */
    static requiresPaymentAdjustment(status: AttendanceStatus): boolean {
        return ['justified', 'change', 'new'].includes(status);
    }

    /**
     * Calculate payment adjustment for attendance status
     */
    static calculatePaymentAdjustment(
        group: Group,
        status: AttendanceStatus
    ): number {
        if (!this.requiresPaymentAdjustment(status)) {
            return 0;
        }

        const sessionPrice = BalanceCalculator.calculateSessionPrice(group);

        switch (status) {
            case 'justified':
                return -sessionPrice; // Refund full session price
            case 'change':
                return -sessionPrice * 0.5; // Refund half session price
            case 'new':
                return -sessionPrice; // Refund full session price
            default:
                return 0;
        }
    }

    /**
     * Get adjustment description for receipt
     */
    static getAdjustmentDescription(
        status: AttendanceStatus,
        groupName: string,
        amount: number
    ): string {
        const action = amount < 0 ? 'Refund' : 'Additional charge';
        const reason = this.getStatusReason(status);

        return `${action} for ${reason} - Group: ${groupName}`;
    }

    private static getStatusReason(status: AttendanceStatus): string {
        switch (status) {
            case 'justified': return 'justified absence';
            case 'change': return 'schedule change';
            case 'new': return 'new student enrollment';
            default: return 'attendance adjustment';
        }
    }
}

/**
 * Payment Priority Utilities
 */
export class PaymentPriorityManager {
    /**
     * Sort unpaid items by priority
     */
    static sortByPriority(
        groupBalances: GroupBalance[]
    ): GroupBalance[] {
        return groupBalances
            .filter(gb => gb.remainingAmount > 0)
            .sort((a, b) => {
                // Priority 1: Registration fee (always first)
                if (a.isRegistrationFee) return -1;
                if (b.isRegistrationFee) return 1;

                // Priority 2: Groups by start date (oldest first)
                if (a.startDate && b.startDate) {
                    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                }

                // Priority 3: Groups by ID (fallback)
                return a.groupId - b.groupId;
            });
    }

    /**
     * Allocate payment amount to unpaid items by priority
     */
    static allocatePaymentByPriority(
        amount: number,
        unpaidItems: GroupBalance[]
    ): Array<{ item: GroupBalance; allocated: number; remaining: number }> {
        const sortedItems = this.sortByPriority(unpaidItems);
        const allocations: Array<{ item: GroupBalance; allocated: number; remaining: number }> = [];
        let remainingAmount = amount;

        for (const item of sortedItems) {
            if (remainingAmount <= 0) break;

            const toAllocate = Math.min(remainingAmount, item.remainingAmount);
            const remainingAfterAllocation = item.remainingAmount - toAllocate;

            allocations.push({
                item,
                allocated: toAllocate,
                remaining: remainingAfterAllocation
            });

            remainingAmount -= toAllocate;
        }

        return allocations;
    }
}

/**
 * Call Log Utilities
 */
export class CallLogManager {
    /**
     * Format groups with debts for call log
     */
    static formatGroupsWithDebts(
        groupBalances: GroupBalance[]
    ): Array<{ id: number; name: string; remainingAmount: number }> {
        return groupBalances
            .filter(gb => gb.remainingAmount > 0)
            .map(gb => ({
                id: gb.groupId,
                name: gb.groupName,
                remainingAmount: gb.remainingAmount
            }));
    }

    /**
     * Calculate total remaining amount for call log
     */
    static calculateTotalRemainingAmount(
        groupBalances: GroupBalance[]
    ): number {
        return groupBalances
            .filter(gb => gb.remainingAmount > 0)
            .reduce((sum, gb) => sum + gb.remainingAmount, 0);
    }

    /**
     * Generate call log summary
     */
    static generateCallLogSummary(
        student: Student,
        groupBalances: GroupBalance[],
        totalRemaining: number
    ): string {
        const unpaidGroups = groupBalances.filter(gb => gb.remainingAmount > 0);

        let summary = `Call Summary for ${student.name} (${student.custom_id || student.id})\n`;
        summary += `Total Outstanding: $${totalRemaining.toFixed(2)}\n\n`;
        summary += `Unpaid Items:\n`;

        unpaidGroups.forEach((gb, index) => {
            const itemType = gb.isRegistrationFee ? 'Registration Fee' : gb.groupName;
            summary += `${index + 1}. ${itemType}: $${gb.remainingAmount.toFixed(2)}\n`;
        });

        return summary;
    }
}

/**
 * Export all utilities
 * Note: Classes are already exported when declared above
 */
// export {
//     ReceiptGenerator,
//     BalanceCalculator,
//     RefundValidator,
//     DebtManager,
//     AttendancePaymentAdjuster,
//     PaymentPriorityManager,
//     CallLogManager
// };
