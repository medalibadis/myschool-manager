-- ============================================================
-- INSERT GROUP 3002: English A2 Teens
-- Teacher ID: T21 | Price: 6000 DA | Start Date: 2026-06-28
-- Days: Sunday (0), Tuesday (2), Thursday (4) | Total Sessions: 12
-- All 12 completed sessions
-- ============================================================

DO $$
DECLARE
    v_teacher_id UUID;
    v_group_id INTEGER := 3002;
    
    -- Session UUIDs (12 total sessions)
    s1 UUID; s2 UUID; s3 UUID; s4 UUID; s5 UUID; s6 UUID; 
    s7 UUID; s8 UUID; s9 UUID; s10 UUID; s11 UUID; s12 UUID;
    
    -- Student UUID helper
    v_student_id UUID;
BEGIN
    -- 1. Find Teacher by custom_id 'T21' or fallback to first teacher
    SELECT id INTO v_teacher_id FROM teachers WHERE custom_id = 'T21' OR id::text = 'T21' LIMIT 1;
    
    IF v_teacher_id IS NULL THEN
        SELECT id INTO v_teacher_id FROM teachers LIMIT 1;
    END IF;
    
    IF v_teacher_id IS NULL THEN
        RAISE EXCEPTION 'No teacher found in teachers table! Please add at least one teacher first.';
    END IF;

    -- 2. Insert or Update Group 3002
    INSERT INTO groups (
        id, name, teacher_id, start_date, recurring_days, total_sessions, price, 
        language, level, category, start_time, end_time
    ) VALUES (
        v_group_id, 'English A2 Teens', v_teacher_id, '2026-06-28', ARRAY[0, 2, 4], 12, 6000.00,
        'English', 'A2', 'Teenagers', '14:00:00', '16:00:00'
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        teacher_id = EXCLUDED.teacher_id,
        start_date = EXCLUDED.start_date,
        recurring_days = EXCLUDED.recurring_days,
        total_sessions = EXCLUDED.total_sessions,
        price = EXCLUDED.price,
        language = EXCLUDED.language,
        level = EXCLUDED.level,
        category = EXCLUDED.category;

    -- Update sequence so future SERIAL auto-increments start after 3002
    PERFORM setval('groups_id_seq', GREATEST(3002, (SELECT MAX(id) FROM groups)));

    -- 3. Insert All 12 Sessions with session_number (Idempotent ON CONFLICT)
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-06-28', 1)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s1;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-06-30', 2)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s2;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-02', 3)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s3;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-05', 4)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s4;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-07', 5)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s5;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-09', 6)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s6;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-14', 7)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s7;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-16', 8)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s8;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-19', 9)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s9;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-21', 10) ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s10;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-23', 11) ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s11;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-26', 12) ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s12;

    -- ============================================================
    -- 4. INSERT STUDENTS, ENROLLMENTS, REGISTRATION FEE & ATTENDANCE
    -- ============================================================

    -- Student 1: الاء صوالح محمد3
    SELECT id INTO v_student_id FROM students WHERE name = 'الاء صوالح محمد3' AND phone = '0561181084' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('الاء صوالح محمد3', '0561181084', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;
    
    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 2: حسام سليماني1
    SELECT id INTO v_student_id FROM students WHERE name = 'حسام سليماني1' AND phone = '0662045564' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('حسام سليماني1', '0662045564', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 3: محمد الصالح سليماني1
    SELECT id INTO v_student_id FROM students WHERE name = 'محمد الصالح سليماني1' AND phone = '0662045564' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('محمد الصالح سليماني1', '0662045564', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 4: أويس شريفي
    SELECT id INTO v_student_id FROM students WHERE name = 'أويس شريفي' AND phone = '0660878888' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('أويس شريفي', '0660878888', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 5: راما ناوي
    SELECT id INTO v_student_id FROM students WHERE name = 'راما ناوي' AND phone = '0662163003' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('راما ناوي', '0662163003', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'change') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'change') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'change') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 6: عدنان برناوي
    SELECT id INTO v_student_id FROM students WHERE name = 'عدنان برناوي' AND phone = '0672516670' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('عدنان برناوي', '0672516670', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'change') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'change') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'change') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 7: اميمة غميمة
    SELECT id INTO v_student_id FROM students WHERE name = 'اميمة غميمة' AND phone = '0669395935' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid) VALUES ('اميمة غميمة', '0669395935', '0664545853', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 8: الطاهر صبتي
    SELECT id INTO v_student_id FROM students WHERE name = 'الطاهر صبتي' AND phone = '0669656620' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('الطاهر صبتي', '0669656620', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 9: مسعودة بكار
    SELECT id INTO v_student_id FROM students WHERE name = 'مسعودة بكار' AND phone = '0663523121' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid) VALUES ('مسعودة بكار', '0663523121', '0663523120', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 10: عبد الرحمان بن حسين
    SELECT id INTO v_student_id FROM students WHERE name = 'عبد الرحمان بن حسين' AND phone = '0657642992' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('عبد الرحمان بن حسين', '0657642992', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 11: عماد بكوش
    SELECT id INTO v_student_id FROM students WHERE name = 'عماد بكوش' AND phone = '0672141268' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('عماد بكوش', '0672141268', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 12: رتاج غريسي
    SELECT id INTO v_student_id FROM students WHERE name = 'رتاج غريسي' AND phone = '0666071070' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid) VALUES ('رتاج غريسي', '0666071070', '0664600415', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 13: حسام عروة
    SELECT id INTO v_student_id FROM students WHERE name = 'حسام عروة' AND phone = '0662998050' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('حسام عروة', '0662998050', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'change')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'change') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'change') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'change') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 14: مصعب حميدي
    SELECT id INTO v_student_id FROM students WHERE name = 'مصعب حميدي' AND phone = '0664660145' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('مصعب حميدي', '0664660145', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'stop')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'stop')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'stop')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 15: رحيمة دحده
    SELECT id INTO v_student_id FROM students WHERE name = 'رحيمة دحده' AND phone = '0780142222' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('رحيمة دحده', '0780142222', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'stop')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'stop')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'stop')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 16: اسماء دحده
    SELECT id INTO v_student_id FROM students WHERE name = 'اسماء دحده' AND phone = '0780142222' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('اسماء دحده', '0780142222', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'stop')    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'stop')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'stop')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'stop')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 17: محمد يعقوب
    SELECT id INTO v_student_id FROM students WHERE name = 'محمد يعقوب' AND phone = '0563447201' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('محمد يعقوب', '0563447201', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'absent') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'absent') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'absent') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 18: اريج تامة
    SELECT id INTO v_student_id FROM students WHERE name = 'اريج تامة' AND phone = '0697665939' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('اريج تامة', '0697665939', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 19: فاطمة الزهراء بوراس1
    SELECT id INTO v_student_id FROM students WHERE name = 'فاطمة الزهراء بوراس1' AND phone = '0666543423' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid) VALUES ('فاطمة الزهراء بوراس1', '0666543423', '0697747494', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 20: جنان الفردوس شكمبو
    SELECT id INTO v_student_id FROM students WHERE name = 'جنان الفردوس شكمبو' AND phone = '0664663376' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('جنان الفردوس شكمبو', '0664663376', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'new')       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'new')       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'new')       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'justified') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'absent')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 21: احمد ياسين العايب2
    SELECT id INTO v_student_id FROM students WHERE name = 'احمد ياسين العايب2' AND phone = '0664663376' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('احمد ياسين العايب2', '0664663376', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 22: خديجة ذهب
    SELECT id INTO v_student_id FROM students WHERE name = 'خديجة ذهب' AND phone = '0555170568' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid) VALUES ('خديجة ذهب', '0555170568', '0662512039', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-28', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    RAISE NOTICE '✅ Group 3002 (English A2 Teens) inserted successfully with 22 students and 12 sessions!';
END $$;
