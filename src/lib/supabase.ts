import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      teachers: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          created_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          teacher_id: string;
          start_date: string;
          recurring_days: number[];
          total_sessions: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          teacher_id: string;
          start_date: string;
          recurring_days: number[];
          total_sessions: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          teacher_id?: string;
          start_date?: string;
          recurring_days?: number[];
          total_sessions?: number;
          created_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone?: string;
          address?: string;
          birth_date?: string;
          price_per_session?: number;
          total_paid: number;
          group_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string;
          address?: string;
          birth_date?: string;
          price_per_session?: number;
          total_paid?: number;
          group_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          address?: string;
          birth_date?: string;
          price_per_session?: number;
          total_paid?: number;
          group_id?: string;
          created_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          date: string;
          group_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          group_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          group_id?: string;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          attended: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          student_id: string;
          attended: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          student_id?: string;
          attended?: boolean;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          student_id: string;
          group_id: string;
          amount: number;
          date: string;
          notes?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          group_id: string;
          amount: number;
          date: string;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          group_id?: string;
          amount?: number;
          date?: string;
          notes?: string;
          created_at?: string;
        };
      };
    };
  };
} 