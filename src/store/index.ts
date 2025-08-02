import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Group, Teacher, Student, Session, Payment } from '../types';
import { addDays, getDay } from 'date-fns';

interface MySchoolStore {
    // State
    groups: Group[];
    teachers: Teacher[];
    payments: Payment[];

    // Actions
    addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
    updateTeacher: (id: string, teacher: Partial<Teacher>) => void;
    deleteTeacher: (id: string) => void;

    addGroup: (group: Omit<Group, 'id' | 'sessions' | 'createdAt'>) => void;
    updateGroup: (id: string, group: Partial<Group>) => void;
    deleteGroup: (id: string) => void;

    addStudentToGroup: (groupId: string, student: Omit<Student, 'id'>) => void;
    updateStudent: (groupId: string, studentId: string, student: Partial<Student>) => void;
    removeStudentFromGroup: (groupId: string, studentId: string) => void;

    generateSessions: (groupId: string) => void;
    updateAttendance: (sessionId: string, studentId: string, attended: boolean) => void;

    addPayment: (payment: Omit<Payment, 'id'>) => void;
    updatePayment: (id: string, payment: Partial<Payment>) => void;
    deletePayment: (id: string) => void;

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

export const useMySchoolStore = create<MySchoolStore>()(
    persist(
        (set, get) => ({
            // Initial state
            groups: [],
            teachers: [],
            payments: [],

            // Teacher actions
            addTeacher: (teacher) => {
                const newTeacher: Teacher = {
                    ...teacher,
                    id: crypto.randomUUID(),
                };
                set((state) => ({
                    teachers: [...state.teachers, newTeacher],
                }));
            },

            updateTeacher: (id, teacher) => {
                set((state) => ({
                    teachers: state.teachers.map((t) =>
                        t.id === id ? { ...t, ...teacher } : t
                    ),
                }));
            },

            deleteTeacher: (id) => {
                set((state) => ({
                    teachers: state.teachers.filter((t) => t.id !== id),
                }));
            },

            // Group actions
            addGroup: (group) => {
                const newGroup: Group = {
                    ...group,
                    id: crypto.randomUUID(),
                    sessions: [],
                    createdAt: new Date(),
                };
                set((state) => ({
                    groups: [...state.groups, newGroup],
                }));
            },

            updateGroup: (id, group) => {
                set((state) => ({
                    groups: state.groups.map((g) =>
                        g.id === id ? { ...g, ...group } : g
                    ),
                }));
            },

            deleteGroup: (id) => {
                set((state) => ({
                    groups: state.groups.filter((g) => g.id !== id),
                }));
            },

            // Student actions
            addStudentToGroup: (groupId, student) => {
                const newStudent: Student = {
                    ...student,
                    id: crypto.randomUUID(),
                };
                set((state) => ({
                    groups: state.groups.map((g) =>
                        g.id === groupId
                            ? { ...g, students: [...g.students, newStudent] }
                            : g
                    ),
                }));
            },

            updateStudent: (groupId, studentId, student) => {
                set((state) => ({
                    groups: state.groups.map((g) =>
                        g.id === groupId
                            ? {
                                ...g,
                                students: g.students.map((s) =>
                                    s.id === studentId ? { ...s, ...student } : s
                                ),
                            }
                            : g
                    ),
                }));
            },

            removeStudentFromGroup: (groupId, studentId) => {
                set((state) => ({
                    groups: state.groups.map((g) =>
                        g.id === groupId
                            ? {
                                ...g,
                                students: g.students.filter((s) => s.id !== studentId),
                            }
                            : g
                    ),
                }));
            },

            // Session actions
            generateSessions: (groupId) => {
                const group = get().getGroupById(groupId);
                if (!group) return;

                const sessions: Session[] = [];
                let currentDate = new Date(group.startDate);
                let sessionCount = 0;

                while (sessionCount < group.totalSessions) {
                    const dayOfWeek = getDay(currentDate);
                    if (group.recurringDays.includes(dayOfWeek)) {
                        sessions.push({
                            id: crypto.randomUUID(),
                            date: new Date(currentDate),
                            groupId,
                            attendance: {},
                        });
                        sessionCount++;
                    }
                    currentDate = addDays(currentDate, 1);
                }

                set((state) => ({
                    groups: state.groups.map((g) =>
                        g.id === groupId ? { ...g, sessions } : g
                    ),
                }));
            },

            updateAttendance: (sessionId, studentId, attended) => {
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
                }));
            },

            // Payment actions
            addPayment: (payment) => {
                const newPayment: Payment = {
                    ...payment,
                    id: crypto.randomUUID(),
                };
                set((state) => ({
                    payments: [...state.payments, newPayment],
                }));
            },

            updatePayment: (id, payment) => {
                set((state) => ({
                    payments: state.payments.map((p) =>
                        p.id === id ? { ...p, ...payment } : p
                    ),
                }));
            },

            deletePayment: (id) => {
                set((state) => ({
                    payments: state.payments.filter((p) => p.id !== id),
                }));
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
        }),
        {
            name: 'myschool-store',
        }
    )
); 