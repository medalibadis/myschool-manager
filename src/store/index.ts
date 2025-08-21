import { create } from 'zustand';
import { Group, Teacher, Student, Session, Payment, WaitingListStudent, CallLog } from '../types';
import { teacherService, groupService, studentService, sessionService, paymentService, waitingListService, callLogService } from '../lib/supabase-service';
// import { populateExistingUnpaidBalances } from '../lib/payment-service';

interface MySchoolStore {
    // State
    groups: Group[];
    teachers: Teacher[];
    payments: Payment[];
    waitingList: WaitingListStudent[];
    callLogs: (CallLog & { studentName?: string; studentPhone?: string })[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchTeachers: () => Promise<void>;
    addTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>;
    updateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>;
    deleteTeacher: (id: string) => Promise<void>;

    fetchGroups: () => Promise<void>;
    addGroup: (group: Omit<Group, 'id' | 'sessions' | 'createdAt'>) => Promise<void>;
    updateGroup: (id: number, group: Partial<Group>) => Promise<void>;
    deleteGroup: (id: number) => Promise<void>;

    addStudentToGroup: (groupId: number, student: Omit<Student, 'id'>) => Promise<void>;
    updateStudent: (groupId: number, studentId: string, student: Partial<Student>) => Promise<void>;
    removeStudentFromGroup: (groupId: number, studentId: string) => Promise<void>;

    generateSessions: (groupId: number) => Promise<void>;
    updateAttendance: (sessionId: string, studentId: string, status: string) => Promise<void>;
    updateAttendanceBulk: (groupId: number, updates: Array<{ sessionId: string; studentId: string; status: string }>) => Promise<void>;

    // Freeze and reschedule functionality
    freezeGroup: (groupId: number) => Promise<void>;
    unfreezeGroup: (groupId: number, unfreezeDate: Date) => Promise<void>;
    rescheduleSession: (sessionId: string, newDate: Date) => Promise<void>;

    fetchPayments: () => Promise<void>;
    // populateExistingUnpaidBalances: () => Promise<void>;
    addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
    updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
    deletePayment: (id: string) => Promise<void>;

    // New payment system methods
    getStudentBalance: (studentId: string) => Promise<{
        totalBalance: number;
        totalPaid: number;
        remainingBalance: number;
        groupBalances: Array<{
            groupId: number;
            groupName: string;
            groupFees: number;
            amountPaid: number;
            remainingAmount: number;
            discount?: number;
            isRegistrationFee?: boolean;
            startDate?: string | null;
        }>;
    }>;
    getRecentPayments: (limit: number) => Promise<Array<Payment & {
        studentName: string;
        groupName: string;
    }>>;
    depositAndAllocate: (studentId: string, amount: number, date: Date, notes?: string) => Promise<{ depositId: string; allocations: any[] }>;

    // Refund and Debts functionality
    // getRefundList: () => Promise<Array<{
    //     studentId: string;
    //     studentName: string;
    //     customId?: string;
    //     balance: number;
    //     groups: Array<{ id: number; name: string; status: string }>;
    // }>>;
    // getDebtsList: () => Promise<Array<{
    //     studentId: string;
    //     studentName: string;
    //     customId?: string;
    //     balance: number;
    //     groups: Array<{ id: number; name: string; status: string }>;
    // }>>;
    // processRefund: (studentId: string, amount: number, date: Date, notes?: string) => Promise<void>;
    // processDebtPayment: (studentId: string, amount: number, date: Date, notes?: string) => Promise<void>;
    // refreshAllStudentsForDebtsAndRefunds: () => Promise<{
    //     refundsCount: number;
    //     debtsCount: number;
    //     processedStudents: number;
    //     errors: string[];
    // }>;

    // New attendance-based payment calculations
    calculateAttendanceBasedPayments: () => Promise<{
        refunds: Array<{
            studentId: string;
            studentName: string;
            customId?: string;
            balance: number;
            groups: Array<{ id: number; name: string; status: string }>;
        }>;
        debts: Array<{
            studentId: string;
            studentName: string;
            customId?: string;
            balance: number;
            groups: Array<{ id: number; name: string; status: string }>;
        }>;
    }>;
    processAutomaticRefund: (studentId: string, amount: number, notes?: string) => Promise<void>;
    processAutomaticDebtPayment: (studentId: string, amount: number, notes?: string) => Promise<void>;

    // Waiting List actions
    fetchWaitingList: () => Promise<void>;
    addToWaitingList: (student: Omit<WaitingListStudent, 'id' | 'createdAt'>) => Promise<void>;
    updateWaitingListStudent: (id: string, student: Partial<WaitingListStudent>) => Promise<void>;
    deleteFromWaitingList: (id: string) => Promise<void>;
    getWaitingListByCriteria: (language?: string, level?: string, category?: string) => Promise<WaitingListStudent[]>;
    moveFromWaitingListToGroup: (waitingListId: string, groupId: number) => Promise<void>;
    getSuggestedGroups: () => Promise<Array<{
        groupName: string;
        language: string;
        level: string;
        category: string;
        studentCount: number;
        students: WaitingListStudent[];
    }>>;

    // Call Log actions
    fetchCallLogs: () => Promise<void>;
    addCallLog: (callLog: Omit<CallLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateCallLog: (id: string, callLog: Partial<CallLog>) => Promise<void>;
    deleteCallLog: (id: string) => Promise<void>;
    getLastPaymentCallNote: (studentId: string) => Promise<string | null>;

    // Computed
    getGroupById: (id: number) => Group | undefined;
    getTeacherById: (id: string) => Teacher | undefined;
    getStudentById: (groupId: number, studentId: string) => Student | undefined;
    getSessionsByGroup: (groupId: number) => Session[];
    getPaymentsByStudent: (studentId: string) => Payment[];
    getStudentStats: (groupId: number, studentId: string) => {
        totalSessions: number;
        attendedSessions: number;
        totalDue: number;
        totalPaid: number;
        remainingBalance: number;
    };
}

export const useMySchoolStore = create<MySchoolStore>((set, get) => ({
    // Initial state
    groups: [],
    teachers: [],
    payments: [],
    waitingList: [],
    callLogs: [],
    loading: false,
    error: null,

    // Teacher actions
    fetchTeachers: async () => {
        set({ loading: true, error: null });
        try {
            const teachers = await teacherService.getAll();
            set({ teachers, loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    addTeacher: async (teacher) => {
        set({ loading: true, error: null });
        try {
            const newTeacher = await teacherService.create(teacher);
            set((state) => ({
                teachers: [newTeacher, ...state.teachers],
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    updateTeacher: async (id, teacher) => {
        set({ loading: true, error: null });
        try {
            const updatedTeacher = await teacherService.update(id, teacher);
            set((state) => ({
                teachers: state.teachers.map((t) =>
                    t.id === id ? updatedTeacher : t
                ),
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    deleteTeacher: async (id) => {
        set({ loading: true, error: null });
        try {
            await teacherService.delete(id);
            set((state) => ({
                teachers: state.teachers.filter((t) => t.id !== id),
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    // Group actions
    fetchGroups: async () => {
        set({ loading: true, error: null });
        try {
            const groups = await groupService.getAll();
            set({ groups, loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    addGroup: async (group) => {
        set({ loading: true, error: null });
        try {
            const newGroup = await groupService.create(group);
            set((state) => ({
                groups: [newGroup, ...state.groups],
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    updateGroup: async (id, group) => {
        set({ loading: true, error: null });
        try {
            const updatedGroup = await groupService.update(id, group);
            set((state) => ({
                groups: state.groups.map((g) =>
                    g.id === id ? updatedGroup : g
                ),
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    deleteGroup: async (id) => {
        set({ loading: true, error: null });
        try {
            await groupService.delete(id);
            set((state) => ({
                groups: state.groups.filter((g) => g.id !== id),
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    // Student actions
    addStudentToGroup: async (groupId, student) => {
        set({ loading: true, error: null });
        try {
            console.log('Starting addStudentToGroup:', { groupId, student });
            const newStudent = await studentService.create(groupId, student);
            console.log('Student created in database:', newStudent);

            // 🆕 Auto-generate receipt if registration fee is paid
            if (student.registrationFeePaid && student.registrationFeeAmount) {
                try {
                    console.log('🆕 Auto-generating receipt for paid registration fee...');
                    console.log(`🆕 Student: ${student.name}, Amount: $${student.registrationFeeAmount}`);

                    // Import supabase for receipt creation
                    const { supabase } = await import('../lib/supabase');

                    // Create receipt for registration fee (no payment record to avoid duplication)
                    const { error: receiptError } = await supabase
                        .from('receipts')
                        .insert({
                            payment_id: null, // No payment record yet - will be created when payment is processed
                            student_id: newStudent.id,
                            student_name: newStudent.name,
                            receipt_text: `RECEIPT
Registration Fee Payment
Student: ${newStudent.name}
Amount: $${student.registrationFeeAmount}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
Status: PAID
Source: Students Page
Note: Receipt generated automatically - payment will be processed separately
Thank you for your payment!`,
                            amount: student.registrationFeeAmount,
                            payment_type: 'registration_fee',
                            group_name: 'Registration Fee',
                            created_at: new Date().toISOString()
                        });

                    if (receiptError) {
                        console.warn('⚠️ Could not create receipt:', receiptError);
                    } else {
                        console.log('✅ Receipt generated successfully for registration fee');
                        console.log('📝 Note: Payment record will be created when payment is processed to avoid duplication');
                    }
                } catch (receiptError) {
                    console.warn('⚠️ Receipt generation failed:', receiptError);
                }
            }

            set((state) => ({
                groups: state.groups.map((g) =>
                    g.id === groupId
                        ? { ...g, students: [...g.students, newStudent] }
                        : g
                ),
                loading: false,
            }));
            console.log('Student added to store state');
        } catch (error) {
            console.error('Error in addStudentToGroup:', error);
            set({ error: (error as Error).message, loading: false });
        }
    },

    updateStudent: async (groupId, studentId, student) => {
        set({ loading: true, error: null });
        try {
            const updatedStudent = await studentService.update(groupId, studentId, student);
            set((state) => ({
                groups: state.groups.map((g) =>
                    g.id === groupId
                        ? {
                            ...g,
                            students: g.students.map((s) =>
                                s.id === studentId ? updatedStudent : s
                            ),
                        }
                        : g
                ),
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    removeStudentFromGroup: async (groupId, studentId) => {
        set({ loading: true, error: null });
        try {
            await studentService.delete(groupId, studentId);
            set((state) => ({
                groups: state.groups.map((g) =>
                    g.id === groupId
                        ? {
                            ...g,
                            students: g.students.filter((s) => s.id !== studentId),
                        }
                        : g
                ),
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    // Session actions
    generateSessions: async (groupId) => {
        set({ loading: true, error: null });
        try {
            const sessions = await sessionService.generateSessions(groupId);
            set((state) => ({
                groups: state.groups.map((g) =>
                    g.id === groupId ? { ...g, sessions } : g
                ),
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    updateAttendance: async (sessionId, studentId, status) => {
        set({ loading: true, error: null });
        try {
            await sessionService.updateAttendance(sessionId, studentId, status);
            // Refresh groups data to get updated attendance
            await get().fetchGroups();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    updateAttendanceBulk: async (groupId, updates) => {
        set({ loading: true, error: null });
        try {
            console.log('=== STORE: Starting bulk attendance update ===');
            await sessionService.updateAttendanceBulk(groupId, updates);

            console.log('=== STORE: Refreshing groups data ===');
            await get().fetchGroups();
            console.log('=== STORE: Groups data refreshed successfully ===');

            set({ loading: false });
        } catch (error) {
            console.error('=== STORE: Error in bulk attendance update ===', error);
            set({ error: (error as Error).message, loading: false });
        }
    },

    // Freeze and reschedule functionality
    freezeGroup: async (groupId) => {
        set({ loading: true, error: null });
        try {
            await groupService.freezeGroup(groupId);
            await get().fetchGroups(); // Refresh groups to show frozen status
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    unfreezeGroup: async (groupId, unfreezeDate) => {
        set({ loading: true, error: null });
        try {
            await groupService.unfreezeGroup(groupId, unfreezeDate);
            await get().fetchGroups(); // Refresh groups to show un-frozen status
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    rescheduleSession: async (sessionId, newDate) => {
        set({ loading: true, error: null });
        try {
            await groupService.rescheduleSession(sessionId, newDate);
            await get().fetchGroups(); // Refresh groups to show updated session date
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    // Payment actions
    fetchPayments: async () => {
        set({ loading: true, error: null });
        try {
            const payments = await paymentService.getAll();
            set({ payments, loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    // Populate unpaid balances for existing students
    populateExistingUnpaidBalances: async () => {
        set({ loading: true, error: null });
        try {
            // await populateExistingUnpaidBalances();
            // Refresh groups to show updated payment statuses
            await get().fetchGroups();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    addPayment: async (payment) => {
        set({ loading: true, error: null });
        try {
            const newPayment = await paymentService.create(payment);
            set((state) => ({
                payments: [newPayment, ...state.payments],
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    updatePayment: async (id, payment) => {
        set({ loading: true, error: null });
        try {
            const updatedPayment = await paymentService.update(id, payment);
            set((state) => ({
                payments: state.payments.map((p) =>
                    p.id === id ? updatedPayment : p
                ),
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    deletePayment: async (id) => {
        set({ loading: true, error: null });
        try {
            await paymentService.delete(id);
            set((state) => ({
                payments: state.payments.filter((p) => p.id !== id),
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    // New payment system methods
    getStudentBalance: async (studentId: string) => {
        set({ loading: true, error: null });
        try {
            // const balance = await paymentService.getStudentBalance(studentId);
            set({ loading: false });
            // return balance;
            return {
                totalBalance: 0,
                totalPaid: 0,
                remainingBalance: 0,
                groupBalances: []
            };
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    getRecentPayments: async (limit: number = 50) => {
        set({ loading: true, error: null });
        try {
            // const recentPayments = await paymentService.getRecentPayments(limit);
            set({ loading: false });
            // return recentPayments;
            return [];
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    depositAndAllocate: async (studentId: string, amount: number, date: Date, notes?: string) => {
        set({ loading: true, error: null });
        try {
            // const result = await paymentService.depositAndAllocate({ studentId, amount, date, notes, adminName: 'Dalila' });
            // Refresh payments list
            // TEMPORARILY DISABLED: This was causing blocking issues
            // const payments = await paymentService.getAll();
            set({ loading: false });
            // return result; // { depositId, allocations }
            return { depositId: '', allocations: [] };
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    // Waiting List actions
    fetchWaitingList: async () => {
        set({ loading: true, error: null });
        try {
            const waitingList = await waitingListService.getAll();
            set({ waitingList, loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    addToWaitingList: async (student) => {
        set({ loading: true, error: null });
        try {
            const newStudent = await waitingListService.create(student);
            set((state) => ({
                waitingList: [newStudent, ...state.waitingList],
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    updateWaitingListStudent: async (id, student) => {
        set({ loading: true, error: null });
        try {
            const updatedStudent = await waitingListService.update(id, student);
            set((state) => ({
                waitingList: state.waitingList.map((s) =>
                    s.id === id ? updatedStudent : s
                ),
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    deleteFromWaitingList: async (id) => {
        set({ loading: true, error: null });
        try {
            await waitingListService.delete(id);
            set((state) => ({
                waitingList: state.waitingList.filter((s) => s.id !== id),
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    getWaitingListByCriteria: async (language, level, category) => {
        set({ loading: true, error: null });
        try {
            console.log('getWaitingListByCriteria called with:', { language, level, category });
            const filteredStudents = await waitingListService.getByCriteria(language, level, category);
            console.log('Filtered students returned:', filteredStudents);
            // Update the store's waitingList state with the filtered results
            set({ waitingList: filteredStudents, loading: false });
            console.log('Updated store waitingList state:', filteredStudents);
            return filteredStudents;
        } catch (error) {
            console.error('Error in getWaitingListByCriteria:', error);
            set({ error: (error as Error).message, loading: false });
            return [];
        }
    },

    moveFromWaitingListToGroup: async (waitingListId, groupId) => {
        set({ loading: true, error: null });
        try {
            console.log('Starting moveFromWaitingListToGroup:', { waitingListId, groupId });
            console.log('Current waiting list in store:', get().waitingList);

            const waitingListStudent = get().waitingList.find(s => s.id === waitingListId);
            if (!waitingListStudent) {
                console.error('Student not found in waiting list. Available students:', get().waitingList.map(s => ({ id: s.id, name: s.name })));
                throw new Error('Student not found in waiting list');
            }

            console.log('Found waiting list student:', waitingListStudent);

            // Create student in the group
            const newStudent: Omit<Student, 'id'> = {
                name: waitingListStudent.name,
                email: waitingListStudent.email,
                phone: waitingListStudent.phone,
                address: waitingListStudent.address,
                birthDate: waitingListStudent.birthDate,
                totalPaid: 0, // Start with 0 total paid
                groupId: groupId,
                // 🆕 PRESERVE registration fee status from waiting list
                registrationFeePaid: waitingListStudent.registrationFeePaid || false,
                registrationFeeAmount: waitingListStudent.registrationFeeAmount || 500,
            };

            console.log('Creating new student:', newStudent);
            console.log('🆕 Registration fee status preserved from waiting list:');
            console.log(`   - registrationFeePaid: ${newStudent.registrationFeePaid}`);
            console.log(`   - registrationFeeAmount: ${newStudent.registrationFeeAmount}`);
            if (newStudent.registrationFeePaid && newStudent.registrationFeeAmount) {
                console.log('✅ Auto-receipt will be generated for this registration fee');
            }

            await get().addStudentToGroup(groupId, newStudent);
            console.log('Student added to group successfully');
            console.log('🚨 FIX: Student should now appear in unpaid group fee list');

            // Remove from waiting list
            await get().deleteFromWaitingList(waitingListId);
            console.log('Student removed from waiting list successfully');

            set({ loading: false });
        } catch (error) {
            console.error('Error in moveFromWaitingListToGroup:', error);
            set({ error: (error as Error).message, loading: false });
        }
    },

    getSuggestedGroups: async () => {
        set({ loading: true, error: null });
        try {
            const suggestedGroups = await waitingListService.getSuggestedGroups();
            set({ loading: false });
            return suggestedGroups;
        } catch (error) {
            console.error('Error getting suggested groups:', error);
            set({ error: (error as Error).message, loading: false });
            return [];
        }
    },

    // Call Log actions
    fetchCallLogs: async () => {
        set({ loading: true, error: null });
        try {
            const callLogs = await callLogService.getAll();
            set({ callLogs, loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    addCallLog: async (callLog) => {
        set({ loading: true, error: null });
        try {
            console.log('Attempting to create call log with data:', callLog);
            const newCallLog = await callLogService.create(callLog);
            set((state) => ({
                callLogs: [newCallLog, ...state.callLogs],
                loading: false,
            }));
        } catch (error) {
            console.error('Error in addCallLog store function:', error);
            console.error('Call log data that failed:', callLog);
            set({ error: (error as Error).message, loading: false });
        }
    },

    updateCallLog: async (id, callLog) => {
        set({ loading: true, error: null });
        try {
            const updatedCallLog = await callLogService.update(id, callLog);
            set((state) => ({
                callLogs: state.callLogs.map((c) =>
                    c.id === id ? updatedCallLog : c
                ),
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    deleteCallLog: async (id) => {
        set({ loading: true, error: null });
        try {
            await callLogService.delete(id);
            set((state) => ({
                callLogs: state.callLogs.filter((c) => c.id !== id),
                loading: false,
            }));
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    getLastPaymentCallNote: async (studentId: string) => {
        set({ loading: true, error: null });
        try {
            const lastCallLog = await callLogService.getLastPaymentCallNote(studentId);
            set({ loading: false });
            return lastCallLog;
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    // Refund and Debts functionality
    getRefundList: async () => {
        set({ loading: true, error: null });
        try {
            // This will be implemented in the supabase service
            // const refundList = await paymentService.getRefundList();
            set({ loading: false });
            // return refundList;
            return [];
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    getDebtsList: async () => {
        set({ loading: true, error: null });
        try {
            // This will be implemented in the supabase service
            // const debtsList = await paymentService.getDebtsList();
            set({ loading: false });
            // return debtsList;
            return [];
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    processRefund: async (studentId: string, amount: number, date: Date, notes?: string) => {
        set({ loading: true, error: null });
        try {
            // await paymentService.processRefund(studentId, amount, date, notes);
            // Refresh payments after refund
            await get().fetchPayments();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    processDebtPayment: async (studentId: string, amount: number, date: Date, notes?: string) => {
        set({ loading: true, error: null });
        try {
            // await paymentService.processDebtPayment(studentId, amount, date, notes);
            // Refresh payments after debt payment
            await get().fetchPayments();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    refreshAllStudentsForDebtsAndRefunds: async () => {
        set({ loading: true, error: null });
        try {
            // const result = await paymentService.refreshAllStudentsForDebtsAndRefunds();
            set({ loading: false });
            // return result;
            return { refundsCount: 0, debtsCount: 0, processedStudents: 0, errors: [] };
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    // New attendance-based payment calculations
    calculateAttendanceBasedPayments: async () => {
        set({ loading: true, error: null });
        try {
            // const { refunds, debts } = await paymentService.calculateAttendanceBasedPayments();
            set({ loading: false });
            // return { refunds, debts };
            return { refunds: [], debts: [] };
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    processAutomaticRefund: async (studentId: string, amount: number, notes?: string) => {
        set({ loading: true, error: null });
        try {
            // await paymentService.processAutomaticRefund(studentId, amount, notes);
            // Refresh payments after automatic refund
            await get().fetchPayments();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    processAutomaticDebtPayment: async (studentId: string, amount: number, notes?: string) => {
        set({ loading: true, error: null });
        try {
            // await paymentService.processAutomaticDebtPayment(studentId, amount, notes);
            // Refresh payments after automatic debt payment
            await get().fetchPayments();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    // Computed getters
    getGroupById: (id) => {
        return get().groups.find((g) => g.id === id);
    },

    getTeacherById: (id) => {
        return get().teachers.find((t) => t.id === id);
    },

    getStudentById: (groupId, studentId) => {
        const group = get().getGroupById(groupId);
        return group?.students.find((s) => s.id === studentId);
    },

    getSessionsByGroup: (groupId) => {
        const group = get().getGroupById(groupId);
        return group?.sessions || [];
    },

    getPaymentsByStudent: (studentId) => {
        return get().payments.filter((p) => p.studentId === studentId);
    },

    getStudentStats: (groupId, studentId) => {
        const group = get().getGroupById(groupId);
        const student = get().getStudentById(groupId, studentId);
        const sessions = get().getSessionsByGroup(groupId);
        const payments = get().getPaymentsByStudent(studentId);

        if (!group || !student) {
            return {
                totalSessions: 0,
                attendedSessions: 0,
                totalDue: 0,
                totalPaid: 0,
                remainingBalance: 0,
            };
        }

        const totalSessions = sessions.length;
        const attendedSessions = sessions.filter(
            (s) => s.attendance[studentId]
        ).length;
        const totalDue = attendedSessions * (student.courseFee || 0);
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const remainingBalance = totalDue - totalPaid;

        return {
            totalSessions,
            attendedSessions,
            totalDue,
            totalPaid,
            remainingBalance,
        };
    },
})
);