import { supabase } from './supabase';
import { Teacher, Student, Group, Session, Payment, WaitingListStudent } from '../types';

// Teacher operations
export const teacherService = {
  async getAll(): Promise<Teacher[]> {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching teachers:', error);
      throw new Error(`Failed to fetch teachers: ${error.message}`);
    }

    return data?.map(teacher => ({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
    })) || [];
  },

  async create(teacher: Omit<Teacher, 'id'>): Promise<Teacher> {
    const { data, error } = await supabase
      .from('teachers')
      .insert({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating teacher:', error);
      throw new Error(`Failed to create teacher: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
    };
  },

  async update(id: string, teacher: Partial<Teacher>): Promise<Teacher> {
    const { data, error } = await supabase
      .from('teachers')
      .update({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating teacher:', error);
      throw new Error(`Failed to update teacher: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting teacher:', error);
      throw new Error(`Failed to delete teacher: ${error.message}`);
    }
  },
};

// Group operations
export const groupService = {
  async getAll(): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        teachers (id, name, email, phone),
        students (id, name, email, phone, address, birth_date, price_per_session, total_paid),
        sessions (id, date)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching groups:', error);
      throw new Error(`Failed to fetch groups: ${error.message}`);
    }

    return data?.map(group => ({
      id: group.id,
      name: group.name,
      teacherId: group.teacher_id,
      startDate: new Date(group.start_date),
      recurringDays: group.recurring_days,
      totalSessions: group.total_sessions,
      language: group.language,
      level: group.level,
      category: group.category,
      price: group.price,
      students: group.students?.map((student: any) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        address: student.address,
        birthDate: student.birth_date ? new Date(student.birth_date) : undefined,
        pricePerSession: student.price_per_session,
        totalPaid: student.total_paid,
        groupId: group.id,
      })) || [],
      sessions: group.sessions?.map((session: any) => ({
        id: session.id,
        date: new Date(session.date),
        groupId: session.group_id,
        attendance: {},
      })) || [],
      createdAt: new Date(group.created_at),
    })) || [];
  },

  async create(group: Omit<Group, 'id' | 'sessions' | 'createdAt'>): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: group.name,
        teacher_id: group.teacherId,
        start_date: group.startDate.toISOString().split('T')[0],
        recurring_days: group.recurringDays,
        total_sessions: group.totalSessions,
        language: group.language,
        level: group.level,
        category: group.category,
        price: group.price,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating group:', error);
      throw new Error(`Failed to create group: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      teacherId: data.teacher_id,
      startDate: new Date(data.start_date),
      recurringDays: data.recurring_days,
      totalSessions: data.total_sessions,
      language: data.language,
      level: data.level,
      category: data.category,
      price: data.price,
      students: [],
      sessions: [],
      createdAt: new Date(data.created_at),
    };
  },

  async update(id: number, group: Partial<Group>): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .update({
        name: group.name,
        teacher_id: group.teacherId,
        start_date: group.startDate?.toISOString().split('T')[0],
        recurring_days: group.recurringDays,
        total_sessions: group.totalSessions,
        language: group.language,
        level: group.level,
        category: group.category,
        price: group.price,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating group:', error);
      throw new Error(`Failed to update group: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      teacherId: data.teacher_id,
      startDate: new Date(data.start_date),
      recurringDays: data.recurring_days,
      totalSessions: data.total_sessions,
      language: data.language,
      level: data.level,
      category: data.category,
      price: data.price,
      students: [],
      sessions: [],
      createdAt: new Date(data.created_at),
    };
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting group:', error);
      throw new Error(`Failed to delete group: ${error.message}`);
    }
  },
};

// Student operations
export const studentService = {
  async create(groupId: number, student: Omit<Student, 'id'>): Promise<Student> {
    // Handle empty email values - convert empty strings to null
    const emailValue = student.email && student.email.trim() !== '' ? student.email : null;
    
    const { data, error } = await supabase
      .from('students')
      .insert({
        name: student.name,
        email: emailValue,
        phone: student.phone,
        address: student.address,
        birth_date: student.birthDate?.toISOString().split('T')[0],
        price_per_session: student.pricePerSession,
        total_paid: student.totalPaid || 0,
        group_id: groupId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating student:', error);
      throw new Error(`Failed to create student: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
      pricePerSession: data.price_per_session,
      totalPaid: data.total_paid,
      groupId: data.group_id,
    };
  },

  async update(groupId: number, studentId: string, student: Partial<Student>): Promise<Student> {
    // Handle empty email values - convert empty strings to null
    const emailValue = student.email && student.email.trim() !== '' ? student.email : null;
    
    const { data, error } = await supabase
      .from('students')
      .update({
        name: student.name,
        email: emailValue,
        phone: student.phone,
        address: student.address,
        birth_date: student.birthDate?.toISOString().split('T')[0],
        price_per_session: student.pricePerSession,
        total_paid: student.totalPaid,
      })
      .eq('id', studentId)
      .eq('group_id', groupId)
      .select()
      .single();

    if (error) {
      console.error('Error updating student:', error);
      throw new Error(`Failed to update student: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
      pricePerSession: data.price_per_session,
      totalPaid: data.total_paid,
      groupId: data.group_id,
    };
  },

  async delete(groupId: number, studentId: string): Promise<void> {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId)
      .eq('group_id', groupId);

    if (error) {
      console.error('Error deleting student:', error);
      throw new Error(`Failed to delete student: ${error.message}`);
    }
  },
};

// Session operations
export const sessionService = {
  async generateSessions(groupId: number): Promise<Session[]> {
    // First, get the group to understand the schedule
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) {
      console.error('Error fetching group for session generation:', groupError);
      throw new Error(`Failed to fetch group: ${groupError.message}`);
    }

    const sessions: Session[] = [];
    let currentDate = new Date(group.start_date);
    let sessionCount = 0;

    // Generate sessions based on recurring days
    while (sessionCount < group.total_sessions) {
      const dayOfWeek = currentDate.getDay();
      if (group.recurring_days.includes(dayOfWeek)) {
        const { data: session, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            date: currentDate.toISOString().split('T')[0],
            group_id: groupId,
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error creating session:', sessionError);
          throw new Error(`Failed to create session: ${sessionError.message}`);
        }

        sessions.push({
          id: session.id,
          date: new Date(session.date),
          groupId: session.group_id,
          attendance: {},
        });
        sessionCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return sessions;
  },

  async updateAttendance(sessionId: string, studentId: string, attended: boolean): Promise<void> {
    const { error } = await supabase
      .from('attendance')
      .upsert({
        session_id: sessionId,
        student_id: studentId,
        attended,
      });

    if (error) {
      console.error('Error updating attendance:', error);
      throw new Error(`Failed to update attendance: ${error.message}`);
    }
  },
};

// Payment operations
export const paymentService = {
  async getAll(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      throw new Error(`Failed to fetch payments: ${error.message}`);
    }

    return data?.map(payment => ({
      id: payment.id,
      studentId: payment.student_id,
      groupId: payment.group_id,
      amount: payment.amount,
      date: new Date(payment.date),
      notes: payment.notes,
    })) || [];
  },

  async create(payment: Omit<Payment, 'id'>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        student_id: payment.studentId,
        group_id: payment.groupId,
        amount: payment.amount,
        date: payment.date.toISOString().split('T')[0],
        notes: payment.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      throw new Error(`Failed to create payment: ${error.message}`);
    }

    return {
      id: data.id,
      studentId: data.student_id,
      groupId: data.group_id,
      amount: data.amount,
      date: new Date(data.date),
      notes: data.notes,
    };
  },

  async update(id: string, payment: Partial<Payment>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update({
        student_id: payment.studentId,
        group_id: payment.groupId,
        amount: payment.amount,
        date: payment.date?.toISOString().split('T')[0],
        notes: payment.notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment:', error);
      throw new Error(`Failed to update payment: ${error.message}`);
    }

    return {
      id: data.id,
      studentId: data.student_id,
      groupId: data.group_id,
      amount: data.amount,
      date: new Date(data.date),
      notes: data.notes,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting payment:', error);
      throw new Error(`Failed to delete payment: ${error.message}`);
    }
  },
};

// Waiting List operations
export const waitingListService = {
  async getAll(): Promise<WaitingListStudent[]> {
    const { data, error } = await supabase
      .from('waiting_list')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching waiting list:', error);
      throw new Error(`Failed to fetch waiting list: ${error.message}`);
    }

    return data?.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      address: student.address,
      birthDate: student.birth_date ? new Date(student.birth_date) : undefined,
      language: student.language,
      level: student.level,
      category: student.category,
      notes: student.notes,
      createdAt: new Date(student.created_at),
    })) || [];
  },

  async create(student: Omit<WaitingListStudent, 'id' | 'createdAt'>): Promise<WaitingListStudent> {
    // Handle empty email values - convert empty strings to null
    const emailValue = student.email && student.email.trim() !== '' ? student.email : null;
    
    const { data, error } = await supabase
      .from('waiting_list')
      .insert({
        name: student.name,
        email: emailValue,
        phone: student.phone,
        address: student.address,
        birth_date: student.birthDate,
        language: student.language,
        level: student.level,
        category: student.category,
        notes: student.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating waiting list student:', error);
      throw new Error(`Failed to create waiting list student: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
      language: data.language,
      level: data.level,
      category: data.category,
      notes: data.notes,
      createdAt: new Date(data.created_at),
    };
  },

  async update(id: string, student: Partial<WaitingListStudent>): Promise<WaitingListStudent> {
    // Handle empty email values - convert empty strings to null
    const emailValue = student.email && student.email.trim() !== '' ? student.email : null;
    
    const { data, error } = await supabase
      .from('waiting_list')
      .update({
        name: student.name,
        email: emailValue,
        phone: student.phone,
        address: student.address,
        birth_date: student.birthDate,
        language: student.language,
        level: student.level,
        category: student.category,
        notes: student.notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating waiting list student:', error);
      throw new Error(`Failed to update waiting list student: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
      language: data.language,
      level: data.level,
      category: data.category,
      notes: data.notes,
      createdAt: new Date(data.created_at),
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('waiting_list')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting waiting list student:', error);
      throw new Error(`Failed to delete waiting list student: ${error.message}`);
    }
  },

  async getByCriteria(language?: string, level?: string, category?: string): Promise<WaitingListStudent[]> {
    let query = supabase
      .from('waiting_list')
      .select('*');

    if (language) query = query.eq('language', language);
    if (level) query = query.eq('level', level);
    if (category) query = query.eq('category', category);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching waiting list by criteria:', error);
      throw new Error(`Failed to fetch waiting list by criteria: ${error.message}`);
    }

    return data?.map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      birthDate: item.birth_date ? new Date(item.birth_date) : undefined,
      language: item.language,
      level: item.level,
      category: item.category,
      notes: item.notes,
      createdAt: new Date(item.created_at),
    })) || [];
  },
}; 