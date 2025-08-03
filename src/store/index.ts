import { create } from 'zustand';
import { Group, Teacher, Student, Session, Payment } from '../types';
import { teacherService, groupService, studentService, sessionService, paymentService } from '../lib/supabase-service';

interface MySchoolStore {
    // State
    groups: Group[];
    teachers: Teacher[];
    payments: Payment[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchTeachers: () => Promise<void>;
    addTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>;
    updateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>;
    deleteTeacher: (id: string) => Promise<void>;

    fetchGroups: () => Promise<void>;
    addGroup: (group: Omit<Group, 'id' | 'sessions' | 'createdAt'>) => Promise<void>;
    updateGroup: (id: string, group: Partial<Group>) => Promise<void>;
    deleteGroup: (id: string) => Promise<void>;

    addStudentToGroup: (groupId: string, student: Omit<Student, 'id'>) => Promise<void>;
    updateStudent: (groupId: string, studentId: string, student: Partial<Student>) => Promise<void>;
    removeStudentFromGroup: (groupId: string, studentId: string) => Promise<void>;

    generateSessions: (groupId: string) => Promise<void>;
    updateAttendance: (sessionId: string, studentId: string, attended: boolean) => Promise<void>;

    fetchPayments: () => Promise<void>;
    addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
    updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
    deletePayment: (id: string) => Promise<void>;

    // Computed
    getGroupById: (id: string) => Group | undefined;
    getTeacherById: (id: string) => Teacher | undefined;
    getStudentById: (groupId: string, studentId: string) => Student | undefined;
    getSessionsByGroup: (groupId: string) => Session[];
    getPaymentsByStudent: (studentId: string) => Payment[];
    getStudentStats: (groupId: string, studentId: string) => {
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
                    const newStudent = await studentService.create(groupId, student);
                    set((state) => ({
                        groups: state.groups.map((g) =>
                            g.id === groupId
                                ? { ...g, students: [...g.students, newStudent] }
                                : g
                        ),
                        loading: false,
                    }));
                } catch (error) {
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