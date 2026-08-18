-- Production Security & Row Level Security (RLS) Setup for MySchool Manager
-- Run this script in your Supabase SQL Editor

-- ============================================================================
-- 1. ADMIN PROFILES & PERMISSIONS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('SUPER_ADMIN', 'ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admin_profiles(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES public.admin_profiles(id),
    UNIQUE(admin_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_admin_profiles_role ON public.admin_profiles(role);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_is_active ON public.admin_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_lookup ON public.admin_permissions(admin_id, permission);

-- ============================================================================
-- 2. SECURITY DEFINER HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function: Check if current authenticated user is an active Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid()
          AND role = 'SUPER_ADMIN'
          AND is_active = true
    );
$$;

-- Function: Check if current authenticated user is an active Admin or Super Admin
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid()
          AND is_active = true
    );
$$;

-- Function: Check if current user has a specific granular permission
CREATE OR REPLACE FUNCTION public.has_permission(p_permission VARCHAR)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT public.is_super_admin() OR EXISTS (
        SELECT 1 FROM public.admin_permissions ap
        JOIN public.admin_profiles p ON p.id = ap.admin_id
        WHERE ap.admin_id = auth.uid()
          AND ap.permission = p_permission
          AND p.is_active = true
    );
$$;

-- ============================================================================
-- 3. DROP INSECURE PUBLIC (USING TRUE) POLICIES
-- ============================================================================

DO $$
BEGIN
    -- Drop old public policies if they exist
    DROP POLICY IF EXISTS "Allow public read access" ON public.teachers;
    DROP POLICY IF EXISTS "Allow public insert access" ON public.teachers;
    DROP POLICY IF EXISTS "Allow public update access" ON public.teachers;
    DROP POLICY IF EXISTS "Allow public delete access" ON public.teachers;

    DROP POLICY IF EXISTS "Allow public read access" ON public.groups;
    DROP POLICY IF EXISTS "Allow public insert access" ON public.groups;
    DROP POLICY IF EXISTS "Allow public update access" ON public.groups;
    DROP POLICY IF EXISTS "Allow public delete access" ON public.groups;

    DROP POLICY IF EXISTS "Allow public read access" ON public.students;
    DROP POLICY IF EXISTS "Allow public insert access" ON public.students;
    DROP POLICY IF EXISTS "Allow public update access" ON public.students;
    DROP POLICY IF EXISTS "Allow public delete access" ON public.students;

    DROP POLICY IF EXISTS "Allow public read access" ON public.sessions;
    DROP POLICY IF EXISTS "Allow public insert access" ON public.sessions;
    DROP POLICY IF EXISTS "Allow public update access" ON public.sessions;
    DROP POLICY IF EXISTS "Allow public delete access" ON public.sessions;

    DROP POLICY IF EXISTS "Allow public read access" ON public.attendance;
    DROP POLICY IF EXISTS "Allow public insert access" ON public.attendance;
    DROP POLICY IF EXISTS "Allow public update access" ON public.attendance;
    DROP POLICY IF EXISTS "Allow public delete access" ON public.attendance;

    DROP POLICY IF EXISTS "Allow public read access" ON public.payments;
    DROP POLICY IF EXISTS "Allow public insert access" ON public.payments;
    DROP POLICY IF EXISTS "Allow public update access" ON public.payments;
    DROP POLICY IF EXISTS "Allow public delete access" ON public.payments;

    -- Drop test policies on admins if existing
    DROP POLICY IF EXISTS "Allow all access for testing" ON public.admins;
    DROP POLICY IF EXISTS "Allow all access for testing" ON public.admin_sessions;
    DROP POLICY IF EXISTS "Allow all access for testing" ON public.receipts;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 4. HARDENED RLS POLICIES FOR EVERY SENSITIVE TABLE
-- ============================================================================

-- Table: admin_profiles
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read profiles" ON public.admin_profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_super_admin());
CREATE POLICY "Super Admins manage profiles" ON public.admin_profiles
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Table: admin_permissions
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read own permissions" ON public.admin_permissions
    FOR SELECT TO authenticated
    USING (admin_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "Super Admins manage permissions" ON public.admin_permissions
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Table: students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_select" ON public.students FOR SELECT TO authenticated USING (public.has_permission('students.view'));
CREATE POLICY "students_insert" ON public.students FOR INSERT TO authenticated WITH CHECK (public.has_permission('students.create'));
CREATE POLICY "students_update" ON public.students FOR UPDATE TO authenticated USING (public.has_permission('students.edit')) WITH CHECK (public.has_permission('students.edit'));
CREATE POLICY "students_delete" ON public.students FOR DELETE TO authenticated USING (public.has_permission('students.delete'));

-- Table: student_groups
ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_groups_select" ON public.student_groups FOR SELECT TO authenticated USING (public.has_permission('students.view') OR public.has_permission('groups.view'));
CREATE POLICY "student_groups_insert" ON public.student_groups FOR INSERT TO authenticated WITH CHECK (public.has_permission('students.create') OR public.has_permission('groups.edit'));
CREATE POLICY "student_groups_update" ON public.student_groups FOR UPDATE TO authenticated USING (public.has_permission('students.edit') OR public.has_permission('groups.edit')) WITH CHECK (public.has_permission('students.edit') OR public.has_permission('groups.edit'));
CREATE POLICY "student_groups_delete" ON public.student_groups FOR DELETE TO authenticated USING (public.has_permission('students.delete') OR public.has_permission('groups.edit'));

-- Table: groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groups_select" ON public.groups FOR SELECT TO authenticated USING (public.has_permission('groups.view'));
CREATE POLICY "groups_insert" ON public.groups FOR INSERT TO authenticated WITH CHECK (public.has_permission('groups.create'));
CREATE POLICY "groups_update" ON public.groups FOR UPDATE TO authenticated USING (public.has_permission('groups.edit')) WITH CHECK (public.has_permission('groups.edit'));
CREATE POLICY "groups_delete" ON public.groups FOR DELETE TO authenticated USING (public.has_permission('groups.delete'));

-- Table: sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select" ON public.sessions FOR SELECT TO authenticated USING (public.has_permission('groups.view') OR public.has_permission('attendance.view'));
CREATE POLICY "sessions_insert" ON public.sessions FOR INSERT TO authenticated WITH CHECK (public.has_permission('groups.edit') OR public.has_permission('groups.create'));
CREATE POLICY "sessions_update" ON public.sessions FOR UPDATE TO authenticated USING (public.has_permission('groups.edit')) WITH CHECK (public.has_permission('groups.edit'));
CREATE POLICY "sessions_delete" ON public.sessions FOR DELETE TO authenticated USING (public.has_permission('groups.delete'));

-- Table: attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_select" ON public.attendance FOR SELECT TO authenticated USING (public.has_permission('attendance.view'));
CREATE POLICY "attendance_insert" ON public.attendance FOR INSERT TO authenticated WITH CHECK (public.has_permission('attendance.edit'));
CREATE POLICY "attendance_update" ON public.attendance FOR UPDATE TO authenticated USING (public.has_permission('attendance.edit')) WITH CHECK (public.has_permission('attendance.edit'));
CREATE POLICY "attendance_delete" ON public.attendance FOR DELETE TO authenticated USING (public.has_permission('attendance.edit'));

-- Table: payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated USING (public.has_permission('payments.view'));
CREATE POLICY "payments_insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.has_permission('payments.create'));
CREATE POLICY "payments_update" ON public.payments FOR UPDATE TO authenticated USING (public.has_permission('payments.edit'));
CREATE POLICY "payments_delete" ON public.payments FOR DELETE TO authenticated USING (public.has_permission('payments.delete'));

-- Table: receipts
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'receipts') THEN
        ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "receipts_select" ON public.receipts;
        DROP POLICY IF EXISTS "receipts_insert" ON public.receipts;
        CREATE POLICY "receipts_select" ON public.receipts FOR SELECT TO authenticated USING (public.has_permission('payments.view'));
        CREATE POLICY "receipts_insert" ON public.receipts FOR INSERT TO authenticated WITH CHECK (public.has_permission('payments.create'));
    END IF;
END $$;

-- Table: teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers_select" ON public.teachers FOR SELECT TO authenticated USING (public.has_permission('teachers.view'));
CREATE POLICY "teachers_insert" ON public.teachers FOR INSERT TO authenticated WITH CHECK (public.has_permission('teachers.create'));
CREATE POLICY "teachers_update" ON public.teachers FOR UPDATE TO authenticated USING (public.has_permission('teachers.edit'));
CREATE POLICY "teachers_delete" ON public.teachers FOR DELETE TO authenticated USING (public.has_permission('teachers.delete'));

-- Table: teacher_salaries, teacher_attendance, teacher_covering (if created)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teacher_salaries') THEN
        ALTER TABLE public.teacher_salaries ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "teacher_salaries_all" ON public.teacher_salaries;
        CREATE POLICY "teacher_salaries_all" ON public.teacher_salaries FOR ALL TO authenticated 
            USING (public.has_permission('salary.manage')) 
            WITH CHECK (public.has_permission('salary.manage'));
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teacher_attendance') THEN
        ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "teacher_attendance_all" ON public.teacher_attendance;
        CREATE POLICY "teacher_attendance_all" ON public.teacher_attendance FOR ALL TO authenticated 
            USING (public.has_permission('attendance.view') OR public.has_permission('salary.manage')) 
            WITH CHECK (public.has_permission('attendance.edit') OR public.has_permission('salary.manage'));
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teacher_covering') THEN
        ALTER TABLE public.teacher_covering ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "teacher_covering_all" ON public.teacher_covering;
        CREATE POLICY "teacher_covering_all" ON public.teacher_covering FOR ALL TO authenticated 
            USING (public.has_permission('teachers.view') OR public.has_permission('salary.manage')) 
            WITH CHECK (public.has_permission('teachers.edit') OR public.has_permission('salary.manage'));
    END IF;
END $$;

-- Table: waiting_list (if created)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'waiting_list') THEN
        ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "waiting_list_all" ON public.waiting_list;
        CREATE POLICY "waiting_list_all" ON public.waiting_list FOR ALL TO authenticated 
            USING (public.has_permission('waiting_list.manage')) 
            WITH CHECK (public.has_permission('waiting_list.manage'));
    END IF;
END $$;

-- Table: call_logs (if created)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'call_logs') THEN
        ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "call_logs_all" ON public.call_logs;
        CREATE POLICY "call_logs_all" ON public.call_logs FOR ALL TO authenticated 
            USING (public.has_permission('call_logs.manage')) 
            WITH CHECK (public.has_permission('call_logs.manage'));
    END IF;
END $$;

-- ============================================================================
-- 5. INITIAL SUPER ADMIN BOOTSTRAP SNIPPET
-- ============================================================================
-- After creating your Super Admin user in Supabase Dashboard -> Authentication -> Users (e.g. raouf@myschool.com):
-- Run the following query to link them to admin_profiles:
--
-- INSERT INTO public.admin_profiles (id, name, email, role, is_active)
-- SELECT id, COALESCE(raw_user_meta_data->>'name', 'Super Admin'), email, 'SUPER_ADMIN', true
-- FROM auth.users
-- WHERE email = 'raouf@myschool.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'SUPER_ADMIN', is_active = true;

