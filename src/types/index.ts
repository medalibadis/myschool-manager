export interface Teacher {
    id: string;
    name: string;
    email: string;
    phone?: string;
}

export interface Student {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    birthDate?: Date;
    pricePerSession?: number;
    totalPaid: number;
}

export interface Session {
    id: string;
    date: Date;
    groupId: string;
    attendance: Record<string, boolean>; // studentId -> attended
}

export interface Group {
    id: string;
    name: string;
    teacherId: string;
    students: Student[];
    startDate: Date;
    recurringDays: number[]; // 0 = Sunday, 1 = Monday, etc.
    totalSessions: number;
    sessions: Session[];
    createdAt: Date;
}

export interface Payment {
    id: string;
    studentId: string;
    groupId: string;
    amount: number;
    date: Date;
    notes?: string;
}

export interface AppState {
    groups: Group[];
    teachers: Teacher[];
    currentGroup: Group | null;
    currentStudent: Student | null;
}

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; 