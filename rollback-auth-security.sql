-- EMERGENCY ROLLBACK SCRIPT: Restores open access for testing if needed
-- Run this in Supabase SQL Editor only if you need to rollback the security lockdown

DO $$
BEGIN
    -- Drop custom security policies
    DROP POLICY IF EXISTS "students_select" ON public.students;
    DROP POLICY IF EXISTS "students_insert" ON public.students;
    DROP POLICY IF EXISTS "students_update" ON public.students;
    DROP POLICY IF EXISTS "students_delete" ON public.students;

    DROP POLICY IF EXISTS "groups_select" ON public.groups;
    DROP POLICY IF EXISTS "groups_insert" ON public.groups;
    DROP POLICY IF EXISTS "groups_update" ON public.groups;
    DROP POLICY IF EXISTS "groups_delete" ON public.groups;

    DROP POLICY IF EXISTS "sessions_select" ON public.sessions;
    DROP POLICY IF EXISTS "sessions_insert" ON public.sessions;
    DROP POLICY IF EXISTS "sessions_update" ON public.sessions;
    DROP POLICY IF EXISTS "sessions_delete" ON public.sessions;

    DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
    DROP POLICY IF EXISTS "attendance_insert" ON public.attendance;
    DROP POLICY IF EXISTS "attendance_update" ON public.attendance;
    DROP POLICY IF EXISTS "attendance_delete" ON public.attendance;

    DROP POLICY IF EXISTS "payments_select" ON public.payments;
    DROP POLICY IF EXISTS "payments_insert" ON public.payments;
    DROP POLICY IF EXISTS "payments_update" ON public.payments;
    DROP POLICY IF EXISTS "payments_delete" ON public.payments;

    DROP POLICY IF EXISTS "teachers_select" ON public.teachers;
    DROP POLICY IF EXISTS "teachers_insert" ON public.teachers;
    DROP POLICY IF EXISTS "teachers_update" ON public.teachers;
    DROP POLICY IF EXISTS "teachers_delete" ON public.teachers;

    -- Re-add open policies
    CREATE POLICY "Allow public read access" ON public.teachers FOR SELECT USING (true);
    CREATE POLICY "Allow public insert access" ON public.teachers FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update access" ON public.teachers FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete access" ON public.teachers FOR DELETE USING (true);

    CREATE POLICY "Allow public read access" ON public.groups FOR SELECT USING (true);
    CREATE POLICY "Allow public insert access" ON public.groups FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update access" ON public.groups FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete access" ON public.groups FOR DELETE USING (true);

    CREATE POLICY "Allow public read access" ON public.students FOR SELECT USING (true);
    CREATE POLICY "Allow public insert access" ON public.students FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update access" ON public.students FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete access" ON public.students FOR DELETE USING (true);

    CREATE POLICY "Allow public read access" ON public.sessions FOR SELECT USING (true);
    CREATE POLICY "Allow public insert access" ON public.sessions FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update access" ON public.sessions FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete access" ON public.sessions FOR DELETE USING (true);

    CREATE POLICY "Allow public read access" ON public.attendance FOR SELECT USING (true);
    CREATE POLICY "Allow public insert access" ON public.attendance FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update access" ON public.attendance FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete access" ON public.attendance FOR DELETE USING (true);

    CREATE POLICY "Allow public read access" ON public.payments FOR SELECT USING (true);
    CREATE POLICY "Allow public insert access" ON public.payments FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update access" ON public.payments FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete access" ON public.payments FOR DELETE USING (true);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
