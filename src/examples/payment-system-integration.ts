// Enhanced Payment System Integration Examples
// This file demonstrates how to use the enhanced payment system in various scenarios

import { paymentService } from '../lib/payment-service';
import {
    ReceiptGenerator,
    BalanceCalculator,
    RefundValidator,
    DebtManager,
    AttendancePaymentAdjuster,
    PaymentPriorityManager,
    CallLogManager
} from '../utils/paymentUtils';

// Example 1: Complete Student Registration Flow
export async function exampleStudentRegistration() {
    console.log('=== Student Registration Example ===');

    try {
        // 1. Handle student registration with unpaid registration fee
        await paymentService.handleStudentRegistration(
            'student-123',
            false, // registration fee not paid
            500    // $500 registration fee
        );
        console.log('✅ Student registration processed - registration fee added to unpaid balance');

        // 2. Add student to a group (automatically adds group fee)
        await paymentService.handleGroupEnrollment(
            'student-123',
            1,           // group ID
            'English A1', // group name
            300          // $300 group fee
        );
        console.log('✅ Group enrollment processed - group fee added to unpaid balance');

        // 3. Process a deposit that covers both fees
        const depositResult = await paymentService.processDeposit(
            'student-123',
            800,        // $800 deposit
            new Date(),
            'Monthly payment covering registration and group fees',
            'Admin User'
        );

        console.log('✅ Deposit processed successfully');
        console.log('Allocations:', depositResult.allocations);
        console.log('Deposit ID:', depositResult.depositId);

        // 4. Generate receipt for the allocation
        const receipt = ReceiptGenerator.generateAllocationReceipt(
            { id: 'student-123', name: 'John Doe', custom_id: 'ST0001' } as any,
            800,
            depositResult.allocations,
            depositResult.depositId
        );
        console.log('Receipt generated:', receipt);

    } catch (error) {
        console.error('❌ Error in student registration example:', error);
    }
}

// Example 2: Attendance-Based Payment Adjustments
export async function exampleAttendanceAdjustments() {
    console.log('=== Attendance Adjustments Example ===');

    try {
        // 1. Handle justified absence (student gets refund for session)
        await paymentService.handleAttendanceAdjustment(
            'student-123',
            1,           // group ID
            'session-456', // session ID
            'present',   // old status
            'justified'  // new status
        );
        console.log('✅ Attendance adjustment processed - session refund calculated');

        // 2. Calculate session price for the group
        const group = { price: 300, totalSessions: 10 } as any;
        const sessionPrice = BalanceCalculator.calculateSessionPrice(group);
        console.log(`Session price: $${sessionPrice.toFixed(2)}`);

        // 3. Calculate payment adjustment
        const adjustment = AttendancePaymentAdjuster.calculatePaymentAdjustment(
            group,
            'justified'
        );
        console.log(`Payment adjustment: $${adjustment.toFixed(2)} (negative = refund)`);

    } catch (error) {
        console.error('❌ Error in attendance adjustments example:', error);
    }
}

// Example 3: Stop Attendance and Refund Processing
export async function exampleStopAttendance() {
    console.log('=== Stop Attendance Example ===');

    try {
        // 1. Handle student stopping attendance
        await paymentService.handleStopAttendance(
            'student-123',
            1,           // group ID
            'Student moved to another city', // reason
            'Admin User'
        );
        console.log('✅ Stop attendance processed - student marked as inactive');

        // 2. Check if student is eligible for refund
        const balance = await paymentService.getStudentBalance('student-123');
        const hasActiveGroups = false; // Assume no active groups

        const isEligible = RefundValidator.isEligibleForRefund(balance, hasActiveGroups);
        console.log(`Student eligible for refund: ${isEligible}`);

        if (isEligible) {
            // 3. Get refund list
            const refundList = await paymentService.getRefundList();
            const studentRefund = refundList.find(r => r.studentId === 'student-123');

            if (studentRefund) {
                console.log('✅ Student found in refund list');
                console.log('Refund amount:', studentRefund.balance);
                console.log('Stopped groups:', studentRefund.stoppedGroups);

                // 4. Process refund
                await paymentService.processRefund(
                    'student-123',
                    studentRefund.balance,
                    new Date(),
                    'Refund for stopped attendance',
                    'Admin User'
                );
                console.log('✅ Refund processed successfully');
            }
        }

    } catch (error) {
        console.error('❌ Error in stop attendance example:', error);
    }
}

// Example 4: Debt Management and Call Logging
export async function exampleDebtManagement() {
    console.log('=== Debt Management Example ===');

    try {
        // 1. Get debts list
        const debtsList = await paymentService.getDebtsList();
        console.log(`Found ${debtsList.length} students with debts`);

        if (debtsList.length > 0) {
            const debtStudent = debtsList[0];
            console.log('Processing debt for:', debtStudent.studentName);

            // 2. Check if student has outstanding debts
            const balance = await paymentService.getStudentBalance(debtStudent.studentId);
            const hasActiveGroups = false;

            const hasDebts = DebtManager.hasOutstandingDebts(balance, hasActiveGroups);
            console.log(`Student has outstanding debts: ${hasDebts}`);

            if (hasDebts) {
                // 3. Calculate debt priority
                const priorityDebts = DebtManager.calculateDebtPriority(balance.groupBalances);
                console.log('Debt priority order:', priorityDebts.map(d => d.groupName));

                // 4. Calculate minimum payment to clear debt
                const minPayment = DebtManager.calculateMinimumPayment(balance.groupBalances);
                console.log(`Minimum payment to clear debt: $${minPayment.toFixed(2)}`);

                // 5. Create call log for debt collection
                const callLog = await paymentService.createCallLog({
                    studentId: debtStudent.studentId,
                    studentName: debtStudent.studentName,
                    studentPhone: '+1234567890',
                    groupsWithDebts: CallLogManager.formatGroupsWithDebts(balance.groupBalances),
                    totalRemainingAmount: CallLogManager.calculateTotalRemainingAmount(balance.groupBalances),
                    notes: 'Follow-up call for outstanding debt',
                    callDate: new Date(),
                    adminName: 'Admin User'
                });

                console.log('✅ Call log created:', callLog.id);

                // 6. Generate call log summary
                const summary = CallLogManager.generateCallLogSummary(
                    { name: debtStudent.studentName, custom_id: debtStudent.customId } as any,
                    balance.groupBalances,
                    CallLogManager.calculateTotalRemainingAmount(balance.groupBalances)
                );
                console.log('Call summary:', summary);
            }
        }

    } catch (error) {
        console.error('❌ Error in debt management example:', error);
    }
}

// Example 5: Payment Priority Management
export async function examplePaymentPriority() {
    console.log('=== Payment Priority Management Example ===');

    try {
        // 1. Get student balance with multiple unpaid items
        const balance = await paymentService.getStudentBalance('student-123');

        // 2. Sort unpaid items by priority
        const sortedItems = PaymentPriorityManager.sortByPriority(balance.groupBalances);
        console.log('Unpaid items sorted by priority:');
        sortedItems.forEach((item, index) => {
            console.log(`${index + 1}. ${item.groupName}: $${item.remainingAmount.toFixed(2)}`);
        });

        // 3. Allocate payment amount by priority
        const paymentAmount = 400; // $400 payment
        const allocations = PaymentPriorityManager.allocatePaymentByPriority(
            paymentAmount,
            balance.groupBalances
        );

        console.log(`Payment allocation for $${paymentAmount}:`);
        allocations.forEach((allocation, index) => {
            console.log(`${index + 1}. ${allocation.item.groupName}: $${allocation.allocated.toFixed(2)} allocated, $${allocation.remaining.toFixed(2)} remaining`);
        });

    } catch (error) {
        console.error('❌ Error in payment priority example:', error);
    }
}

// Example 6: Receipt Generation
export async function exampleReceiptGeneration() {
    console.log('=== Receipt Generation Example ===');

    try {
        // 1. Generate payment receipt
        const payment = {
            id: 'payment-789',
            studentId: 'student-123',
            groupId: 1,
            amount: 300,
            date: new Date(),
            notes: 'Group fee payment',
            adminName: 'Admin User',
            discount: 10,
            originalAmount: 333.33,
            paymentType: 'group_payment'
        } as any;

        const student = {
            id: 'student-123',
            name: 'John Doe',
            custom_id: 'ST0001',
            email: 'john@example.com',
            phone: '+1234567890'
        } as any;

        const group = {
            id: 1,
            name: 'English A1'
        } as any;

        const receipt = ReceiptGenerator.generateReceipt(payment, student, group);
        console.log('Payment receipt generated:');
        console.log(receipt);

    } catch (error) {
        console.error('❌ Error in receipt generation example:', error);
    }
}

// Example 7: Complete Payment Workflow
export async function exampleCompleteWorkflow() {
    console.log('=== Complete Payment Workflow Example ===');

    try {
        const studentId = 'student-456';
        const groupId = 2;

        // 1. Student registration
        await paymentService.handleStudentRegistration(studentId, false, 500);
        console.log('Step 1: Student registered with unpaid registration fee');

        // 2. Group enrollment
        await paymentService.handleGroupEnrollment(studentId, groupId, 'French B1', 400);
        console.log('Step 2: Student enrolled in group with unpaid fee');

        // 3. Process partial payment
        const partialPayment = await paymentService.processDeposit(
            studentId,
            600, // $600 payment (covers registration fee + partial group fee)
            new Date(),
            'Partial payment',
            'Admin User'
        );
        console.log('Step 3: Partial payment processed');
        console.log('Allocations:', partialPayment.allocations);

        // 4. Check remaining balance
        const balance = await paymentService.getStudentBalance(studentId);
        console.log('Step 4: Current balance checked');
        console.log('Remaining balance:', balance.remainingBalance);

        // 5. Process remaining payment
        if (balance.remainingBalance > 0) {
            const finalPayment = await paymentService.processDeposit(
                studentId,
                balance.remainingBalance,
                new Date(),
                'Final payment to clear balance',
                'Admin User'
            );
            console.log('Step 5: Final payment processed');
            console.log('Allocations:', finalPayment.allocations);
        }

        // 6. Verify final balance
        const finalBalance = await paymentService.getStudentBalance(studentId);
        console.log('Step 6: Final balance verified');
        console.log('Final balance:', finalBalance.remainingBalance);

        console.log('✅ Complete payment workflow executed successfully');

    } catch (error) {
        console.error('❌ Error in complete workflow example:', error);
    }
}

// Main function to run all examples
export async function runAllExamples() {
    console.log('🚀 Starting Enhanced Payment System Examples\n');

    try {
        await exampleStudentRegistration();
        console.log('\n' + '='.repeat(50) + '\n');

        await exampleAttendanceAdjustments();
        console.log('\n' + '='.repeat(50) + '\n');

        await exampleStopAttendance();
        console.log('\n' + '='.repeat(50) + '\n');

        await exampleDebtManagement();
        console.log('\n' + '='.repeat(50) + '\n');

        await examplePaymentPriority();
        console.log('\n' + '='.repeat(50) + '\n');

        await exampleReceiptGeneration();
        console.log('\n' + '='.repeat(50) + '\n');

        await exampleCompleteWorkflow();

        console.log('\n🎉 All examples completed successfully!');

    } catch (error) {
        console.error('\n💥 Error running examples:', error);
    }
}

// Export individual examples for selective testing
// Note: Functions are already exported when declared above
// export {
//     exampleStudentRegistration,
//     exampleAttendanceAdjustments,
//     exampleStopAttendance,
//     exampleDebtManagement,
//     examplePaymentPriority,
//     exampleReceiptGeneration,
//     exampleCompleteWorkflow
// };
