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
    groupId: number; // Changed from string to number
}

export interface WaitingListStudent {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    birthDate?: Date;
    language: string;
    level: string;
    category: string;
    notes?: string;
    createdAt: Date;
}

export interface Session {
    id: string;
    date: Date;
    groupId: number; // Changed from string to number
    attendance: Record<string, boolean>; // studentId -> attended
}

export interface Group {
    id: number; // Changed from string to number
    name: string;
    teacherId: string;
    students: Student[];
    startDate: Date;
    recurringDays: number[]; // 0 = Sunday, 1 = Monday, etc.
    totalSessions: number;
    sessions: Session[];
    createdAt: Date;
    // Additional fields for UI
    language?: string;
    level?: string;
    category?: string;
    price?: number;
}

export interface Payment {
    id: string;
    studentId: string;
    groupId: number; // Changed from string to number
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

// Additional types for better type safety
export interface AttendanceRecord {
    id: string;
    sessionId: string;
    studentId: string;
    attended: boolean;
    createdAt: Date;
}

export interface GroupWithDetails extends Group {
    teacher: Teacher;
    totalStudents: number;
    totalSessionsGenerated: number;
    nextSession?: Date;
} 