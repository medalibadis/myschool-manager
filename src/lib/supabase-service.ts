import { supabase } from './supabase';
import { Teacher, Student, Group, Session, Payment } from '../types';

// Teacher operations
export const teacherService = {
  async getAll(): Promise<Teacher[]> {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(teacher => ({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
    }));
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

    if (error) throw error;
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

    if (error) throw error;
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

    if (error) throw error;
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

    if (error) throw error;
    return data.map(group => ({
      id: group.id,
      name: group.name,
      teacherId: group.teacher_id,
      startDate: new Date(group.start_date),
      recurringDays: group.recurring_days,
      totalSessions: group.total_sessions,
      students: group.students.map((student: any) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        address: student.address,
        birthDate: student.birth_date ? new Date(student.birth_date) : undefined,
        pricePerSession: student.price_per_session,
        totalPaid: student.total_paid,
      })),
      sessions: group.sessions.map((session: any) => ({
        id: session.id,
        date: new Date(session.date),
        groupId: session.group_id,
        attendance: {},
      })),
      createdAt: new Date(group.created_at),
    }));
  },

  async create(group: Omit<Group, 'id' | 'sessions' | 'createdAt'>): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: group.name,
        teacher_id: group.teacherId,
        start_date: group.startDate.toISOString(),
        recurring_days: group.recurringDays,
        total_sessions: group.totalSessions,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      teacherId: data.teacher_id,
      startDate: new Date(data.start_date),
      recurringDays: data.recurring_days,
      totalSessions: data.total_sessions,
      students: [],
      sessions: [],
      createdAt: new Date(data.created_at),
    };
  },

  async update(id: string, group: Partial<Group>): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .update({
        name: group.name,
        teacher_id: group.teacherId,
        start_date: group.startDate?.toISOString(),
        recurring_days: group.recurringDays,
        total_sessions: group.totalSessions,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      teacherId: data.teacher_id,
      startDate: new Date(data.start_date),
      recurringDays: data.recurring_days,
      totalSessions: data.total_sessions,
      students: [],
      sessions: [],
      createdAt: new Date(data.created_at),
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Student operations
export const studentService = {
  async create(groupId: string, student: Omit<Student, 'id'>): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .insert({
        name: student.name,
        email: student.email,
        phone: student.phone,
        address: student.address,
        birth_date: student.birthDate?.toISOString().split('T')[0],
        price_per_session: student.pricePerSession,
        total_paid: student.totalPaid || 0,
        group_id: groupId,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
      pricePerSession: data.price_per_session,
      totalPaid: data.total_paid,
    };
  },

  async update(groupId: string, studentId: string, student: Partial<Student>): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .update({
        name: student.name,
        email: student.email,
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

    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
      pricePerSession: data.price_per_session,
      totalPaid: data.total_paid,
    };
  },

  async delete(groupId: string, studentId: string): Promise<void> {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId)
      .eq('group_id', groupId);

    if (error) throw error;
  },
};

// Session operations
export const sessionService = {
  async generateSessions(groupId: string): Promise<Session[]> {
    // First, get the group to understand the schedule
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) throw groupError;

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
            date: currentDate.toISOString(),
            group_id: groupId,
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

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

    if (error) throw error;
  },
};

// Payment operations
export const paymentService = {
  async getAll(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data.map(payment => ({
      id: payment.id,
      studentId: payment.student_id,
      groupId: payment.group_id,
      amount: payment.amount,
      date: new Date(payment.date),
      notes: payment.notes,
    }));
  },

  async create(payment: Omit<Payment, 'id'>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        student_id: payment.studentId,
        group_id: payment.groupId,
        amount: payment.amount,
        date: payment.date.toISOString(),
        notes: payment.notes,
      })
      .select()
      .single();

    if (error) throw error;
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
        date: payment.date?.toISOString(),
        notes: payment.notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
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

    if (error) throw error;
  },
}; 