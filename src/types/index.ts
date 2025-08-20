export interface Teacher {
    id: string;
    custom_id?: string; // T01, T02, etc.
    name: string;
    email: string;
    phone?: string;
}

export interface Admin {
    id: string;
    username: string;
    name: string;
    email?: string;
    phone?: string;
    role: 'superuser' | 'admin';
    isActive: boolean;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
    password_hash?: string;
}

export interface AdminSession {
    id: string;
    adminId: string;
    sessionToken: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface Student {
    id: string;
    custom_id?: string; // ST0001, ST0002, etc.
    name: string;
    email: string;
    phone?: string;
    address?: string;
    birthDate?: Date;
    courseFee?: number; // Changed from pricePerSession to courseFee
    totalPaid: number;
    groupId: number; // Changed from string to number
    parentName?: string;
    secondPhone?: string;
    // New fields for payment system
    defaultDiscount?: number; // Default discount percentage for the student
    balance?: number; // Current balance (total owed - total paid)
    // Registration fee
    registrationFeePaid?: boolean;
    registrationFeeAmount?: number;
}

export interface WaitingListStudent {
    id: string;
    custom_id?: string; // Add custom_id property
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
    parentName?: string;
    secondPhone?: string;
    customLanguage?: string;
    customLevel?: string;
    customCategory?: string;
    status?: 'pending' | 'coming' | 'not_coming';
    // New fields for payment system
    defaultDiscount?: number; // Default discount percentage for the student
    // Registration fee fields
    registrationFeePaid?: boolean;
    registrationFeeAmount?: number;
    callLogs?: Array<{
        id: string;
        status: 'pending' | 'coming' | 'not_coming';
        notes?: string;
        createdAt: Date;
    }>;
}

export interface CallLog {
    id: string;
    studentId: string | null;
    studentName?: string; // Student name for display purposes
    studentPhone?: string; // Student phone for display purposes
    callDate: Date;
    callType: 'registration' | 'attendance' | 'payment' | 'activity' | 'other';
    status: 'pending' | 'coming' | 'not_coming';
    notes?: string;
    adminName?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type AttendanceStatus = 'default' | 'present' | 'absent' | 'justified' | 'change' | 'stop' | 'new' | 'too_late';

export interface Session {
    id: string;
    date: Date;
    groupId: number; // Changed from string to number
    attendance: Record<string, AttendanceStatus>; // studentId -> attendance status
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
    price?: number; // Course fees for the entire group
    // Duration fields
    startTime?: string; // Format: "HH:MM" (24-hour)
    endTime?: string; // Format: "HH:MM" (24-hour)
    // Custom fields for "other" options
    customLanguage?: string;
    customLevel?: string;
    customCategory?: string;
    // Progress tracking
    progress?: {
        totalSessions: number;
        completedSessions: number;
        progressPercentage: number;
    };
    // New fields for sessions and recurring days
    sessionsNumber?: number;
    // Freeze functionality
    isFrozen?: boolean;
    freezeDate?: Date;
    unfreezeDate?: Date;
}

export interface Payment {
    id: string;
    studentId: string;
    groupId?: number; // Optional - null for balance additions
    amount: number; // Positive for payments, negative for balance additions
    date: Date;
    notes?: string;
    // New fields for payment system
    adminName?: string; // Admin who processed the payment
    discount?: number; // Discount applied to this payment
    originalAmount?: number; // Original amount before discount
    paymentType?: 'group_payment' | 'balance_addition' | 'registration_fee'; // Type of payment
}

// New interface for student balance
export interface StudentBalance {
    studentId: string;
    studentName: string;
    totalBalance: number; // Total amount owed
    totalPaid: number; // Total amount paid
    remainingBalance: number; // Total balance - total paid
    groupBalances: GroupBalance[]; // Balance breakdown by group
}

// New interface for group balance
export interface GroupBalance {
    groupId: number;
    groupName: string;
    groupFees: number; // Total fees for this group
    amountPaid: number; // Amount paid for this group
    remainingAmount: number; // Remaining amount for this group
    discount?: number; // Default discount for this student in this group
    isRegistrationFee?: boolean; // Whether this is a registration fee
    startDate?: string | null; // Start date for proper ordering
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