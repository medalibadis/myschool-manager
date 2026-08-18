-- ============================================================
-- INSERT GROUP 3001: English A2 Teens
-- Teacher ID: T21 | Price: 6000 DA | Start Date: 2026-06-27
-- Days: Friday (5), Saturday (6) | Total Sessions: 12
-- Sessions 1-9: Completed past attendance
-- Sessions 10-12: Upcoming future sessions (Empty 'default' state)
-- ============================================================

DO $$
DECLARE
    v_teacher_id UUID;
    v_group_id INTEGER := 3001;
    
    -- Session UUIDs (12 total sessions)
    s1 UUID; s2 UUID; s3 UUID; s4 UUID; s5 UUID; s6 UUID; s7 UUID; s8 UUID; s9 UUID;
    s10 UUID; s11 UUID; s12 UUID;
    
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

    -- 2. Insert or Update Group 3001
    INSERT INTO groups (
        id, name, teacher_id, start_date, recurring_days, total_sessions, price, 
        language, level, category, start_time, end_time
    ) VALUES (
        v_group_id, 'English A2 Teens', v_teacher_id, '2026-06-27', ARRAY[5, 6], 12, 6000.00,
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

    -- Update sequence so future SERIAL auto-increments start after 3001
    PERFORM setval('groups_id_seq', GREATEST(3001, (SELECT MAX(id) FROM groups)));

    -- 3. Insert All 12 Sessions with session_number (Idempotent ON CONFLICT)
    -- Past completed sessions (1-9)
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-06-27', 1)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s1;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-03', 2)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s2;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-04', 3)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s3;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-10', 4)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s4;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-11', 5)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s5;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-17', 6)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s6;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-18', 7)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s7;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-24', 8)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s8;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-25', 9)  ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s9;
    
    -- Upcoming future sessions (10-12)
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-31', 10) ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s10;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-08-01', 11) ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s11;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-08-07', 12) ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date RETURNING id INTO s12;

    -- ============================================================
    -- 4. INSERT STUDENTS, ENROLLMENTS, REGISTRATION FEE & ATTENDANCE
    -- ============================================================

    -- Student 1: لين حلواجي
    SELECT id INTO v_student_id FROM students WHERE name = 'لين حلواجي' AND phone = '0655279627' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('لين حلواجي', '0655279627', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
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
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 2: مازن بن خليفة
    SELECT id INTO v_student_id FROM students WHERE name = 'مازن بن خليفة' AND phone = '0770860063' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid) VALUES ('مازن بن خليفة', '0770860063', '0656502375', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 3: بيلسان بن خليفة
    SELECT id INTO v_student_id FROM students WHERE name = 'بيلسان بن خليفة' AND phone = '0770860063' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid) VALUES ('بيلسان بن خليفة', '0770860063', '0656502375', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 4: لجين زبيدي
    SELECT id INTO v_student_id FROM students WHERE name = 'لجين زبيدي' AND phone = '0668513330' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('لجين زبيدي', '0668513330', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 5: معتز بالله دو
    SELECT id INTO v_student_id FROM students WHERE name = 'معتز بالله دو' AND phone = '0770770096' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('معتز بالله دو', '0770770096', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'justified') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'justified') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'justified') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'justified') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 6: نجم الدين قيطوبي
    SELECT id INTO v_student_id FROM students WHERE name = 'نجم الدين قيطوبي' AND phone = '0793662459' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid) VALUES ('نجم الدين قيطوبي', '0793662459', '077602755', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 7: احمد حمتين
    SELECT id INTO v_student_id FROM students WHERE name = 'احمد حمتين' AND phone = '0795352220' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('احمد حمتين', '0795352220', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 8: جوهر كناوية
    SELECT id INTO v_student_id FROM students WHERE name = 'جوهر كناوية' AND phone = '0783981617' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid) VALUES ('جوهر كناوية', '0783981617', '0669803298', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
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
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 9: ميسم قدور
    SELECT id INTO v_student_id FROM students WHERE name = 'ميسم قدور' AND phone = '0773732456' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('ميسم قدور', '0773732456', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 10: جوري زيتوني
    SELECT id INTO v_student_id FROM students WHERE name = 'جوري زيتوني' AND phone = '0672360522' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid) VALUES ('جوري زيتوني', '0672360522', '0672360642', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 11: المعتز بالله فردية
    SELECT id INTO v_student_id FROM students WHERE name = 'المعتز بالله فردية' AND phone = '0675645619' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid) VALUES ('المعتز بالله فردية', '0675645619', '0798359086', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
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
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 12: المعز بالله فردية
    SELECT id INTO v_student_id FROM students WHERE name = 'المعز بالله فردية' AND phone = '0675645619' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid) VALUES ('المعز بالله فردية', '0675645619', '0798359086', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
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
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 13: عبد الرحيم بكاري
    SELECT id INTO v_student_id FROM students WHERE name = 'عبد الرحيم بكاري' AND phone = '0664960410' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid) VALUES ('عبد الرحيم بكاري', '0664960410', '0664936282', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 14: تميم سوفية
    SELECT id INTO v_student_id FROM students WHERE name = 'تميم سوفية' AND phone = '0669005980' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('تميم سوفية', '0669005980', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 15: الفاروق فرحات حميدة
    SELECT id INTO v_student_id FROM students WHERE name = 'الفاروق فرحات حميدة' AND phone = '0673039304' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('الفاروق فرحات حميدة', '0673039304', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'absent')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'absent')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'absent')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'absent')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'absent')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'absent')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'absent')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 16: يوسف فطحيزة تجاني
    SELECT id INTO v_student_id FROM students WHERE name = 'يوسف فطحيزة تجاني' AND phone = '0672866055' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid) VALUES ('يوسف فطحيزة تجاني', '0672866055', '0659866033', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
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
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 17: ريتاج سعدون
    SELECT id INTO v_student_id FROM students WHERE name = 'ريتاج سعدون' AND phone = '0555237447' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('ريتاج سعدون', '0555237447', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 18: احمد نضال شايع1
    SELECT id INTO v_student_id FROM students WHERE name = 'احمد نضال شايع1' AND phone = '0770923467' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid) VALUES ('احمد نضال شايع1', '0770923467', true) RETURNING id INTO v_student_id;
        INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type) VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')     ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    RAISE NOTICE '✅ Group 3001 (English A2 Teens) inserted successfully with 18 students and 12 sessions!';
END $$;
