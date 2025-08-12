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
          id: number;
          name: string;
          teacher_id: string;
          start_date: string;
          recurring_days: number[];
          total_sessions: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          teacher_id: string;
          start_date: string;
          recurring_days: number[];
          total_sessions: number;
          created_at?: string;
        };
        Update: {
          id?: number;
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
          second_phone?: string;
          parent_name?: string;
          registration_fee_paid: boolean;
          registration_fee_amount: number;
          registration_fee_group_id?: number;
          default_discount?: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string;
          address?: string;
          birth_date?: string;
          second_phone?: string;
          parent_name?: string;
          registration_fee_paid?: boolean;
          registration_fee_amount?: number;
          registration_fee_group_id?: number;
          default_discount?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          address?: string;
          birth_date?: string;
          second_phone?: string;
          parent_name?: string;
          registration_fee_paid?: boolean;
          registration_fee_amount?: number;
          registration_fee_group_id?: number;
          default_discount?: number;
          created_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          date: string;
          group_id: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          group_id: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          group_id?: number;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          student_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          student_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          student_id: string;
          group_id?: number;
          amount: number;
          date: string;
          notes?: string;
          admin_name?: string;
          payment_type?: string;
          discount?: number;
          original_amount?: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          group_id?: number;
          amount: number;
          date: string;
          notes?: string;
          admin_name?: string;
          payment_type?: string;
          discount?: number;
          original_amount?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          group_id?: number;
          amount?: number;
          date?: string;
          notes?: string;
          admin_name?: string;
          payment_type?: string;
          discount?: number;
          original_amount?: number;
          created_at?: string;
        };
      };
    };
  };
} 