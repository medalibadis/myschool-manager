import { create } from 'zustand';
import { Group, Teacher, Student, Session, Payment, WaitingListStudent } from '../types';
import { teacherService, groupService, studentService, sessionService, paymentService, waitingListService } from '../lib/supabase-service';

interface MySchoolStore {
    // State
    groups: Group[];
    teachers: Teacher[];
    payments: Payment[];
    waitingList: WaitingListStudent[];
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
    updateAttendance: (sessionId: string, studentId: string, attended: boolean) => Promise<void>;

    fetchPayments: () => Promise<void>;
    addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
    updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
    deletePayment: (id: string) => Promise<void>;

    // Waiting List actions
    fetchWaitingList: () => Promise<void>;
    addToWaitingList: (student: Omit<WaitingListStudent, 'id' | 'createdAt'>) => Promise<void>;
    updateWaitingListStudent: (id: string, student: Partial<WaitingListStudent>) => Promise<void>;
    deleteFromWaitingList: (id: string) => Promise<void>;
    getWaitingListByCriteria: (language?: string, level?: string, category?: string) => Promise<WaitingListStudent[]>;
    moveFromWaitingListToGroup: (waitingListId: string, groupId: number) => Promise<void>;

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

    updateAttendance: async (sessionId, studentId, attended) => {
        set({ loading: true, error: null });
        try {
            await sessionService.updateAttendance(sessionId, studentId, attended);
            set((state) => ({
                groups: state.groups.map((g) => ({
                    ...g,
                    sessions: g.sessions.map((s) =>
                        s.id === sessionId
                            ? {
                                ...s,
                                attendance: {
                                    ...s.attendance,
                                    [studentId]: attended,
                                },
                            }
                            : s
                    ),
                })),
                loading: false,
            }));
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
                totalPaid: 0,
                groupId: groupId,
            };

            console.log('Creating new student:', newStudent);

            await get().addStudentToGroup(groupId, newStudent);
            console.log('Student added to group successfully');

            // Remove from waiting list
            await get().deleteFromWaitingList(waitingListId);
            console.log('Student removed from waiting list successfully');

            set({ loading: false });
        } catch (error) {
            console.error('Error in moveFromWaitingListToGroup:', error);
            set({ error: (error as Error).message, loading: false });
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
        const totalDue = attendedSessions * (student.pricePerSession || 0);
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