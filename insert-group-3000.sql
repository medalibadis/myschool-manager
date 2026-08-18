-- ============================================================
-- INSERT GROUP 3000: English A2 Teens (Full 12 Sessions)
-- Teacher ID: T22 | Price: 6000 DA | Start Date: 2026-06-27
-- Days: Friday (5), Saturday (6) | Total Sessions: 12
-- Sessions 1-8: Completed past attendance
-- Sessions 9-12: Upcoming future sessions (Empty 'default' state)
-- ============================================================

DO $$
DECLARE
    v_teacher_id UUID;
    v_group_id INTEGER := 3000;
    
    -- Session UUIDs (12 total sessions)
    s1 UUID; s2 UUID; s3 UUID; s4 UUID; s5 UUID; s6 UUID; s7 UUID; s8 UUID;
    s9 UUID; s10 UUID; s11 UUID; s12 UUID;
    
    -- Student UUID helper
    v_student_id UUID;
BEGIN
    -- 1. Find Teacher by custom_id 'T22' or fallback to first teacher
    SELECT id INTO v_teacher_id FROM teachers WHERE custom_id = 'T22' OR id::text = 'T22' LIMIT 1;
    
    IF v_teacher_id IS NULL THEN
        SELECT id INTO v_teacher_id FROM teachers LIMIT 1;
    END IF;
    
    IF v_teacher_id IS NULL THEN
        RAISE EXCEPTION 'No teacher found in teachers table! Please add at least one teacher first.';
    END IF;

    -- 2. Insert or Update Group 3000
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

    -- Update sequence so future SERIAL auto-increments start after 3000
    PERFORM setval('groups_id_seq', GREATEST(3000, (SELECT MAX(id) FROM groups)));

    -- 3. Insert All 12 Sessions with session_number & Get UUIDs
    -- Past completed sessions (1-8)
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-06-27', 1) RETURNING id INTO s1;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-03', 2) RETURNING id INTO s2;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-04', 3) RETURNING id INTO s3;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-10', 4) RETURNING id INTO s4;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-11', 5) RETURNING id INTO s5;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-17', 6) RETURNING id INTO s6;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-18', 7) RETURNING id INTO s7;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-25', 8) RETURNING id INTO s8;
    
    -- Upcoming future sessions (9-12)
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-07-31', 9) RETURNING id INTO s9;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-08-01', 10) RETURNING id INTO s10;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-08-07', 11) RETURNING id INTO s11;
    INSERT INTO sessions (group_id, date, session_number) VALUES (v_group_id, '2026-08-08', 12) RETURNING id INTO s12;

    -- ============================================================
    -- 4. INSERT STUDENTS, ENROLLMENTS, REGISTRATION FEE & ATTENDANCE
    -- ============================================================

    -- Student 1: محمد زياد عطالله
    SELECT id INTO v_student_id FROM students WHERE name = 'محمد زياد عطالله' AND phone = '0770978152' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid)
        VALUES ('محمد زياد عطالله', '0770978152', '0555785450', true)
        RETURNING id INTO v_student_id;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;
    INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type)
    VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;
    
    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 2: ريتاج العايب
    SELECT id INTO v_student_id FROM students WHERE name = 'ريتاج العايب' AND phone = '0666030205' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid)
        VALUES ('ريتاج العايب', '0666030205', true)
        RETURNING id INTO v_student_id;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;
    INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type)
    VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 3: اكرام باسي
    SELECT id INTO v_student_id FROM students WHERE name = 'اكرام باسي' AND phone = '0661338017' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid)
        VALUES ('اكرام باسي', '0661338017', true)
        RETURNING id INTO v_student_id;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;
    INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type)
    VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 4: عبد الخالق شبرو
    SELECT id INTO v_student_id FROM students WHERE name = 'عبد الخالق شبرو' AND phone = '0665656487' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid)
        VALUES ('عبد الخالق شبرو', '0665656487', true)
        RETURNING id INTO v_student_id;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;
    INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type)
    VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 5: سناء بن عمر
    SELECT id INTO v_student_id FROM students WHERE name = 'سناء بن عمر' AND phone = '0666666040' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid)
        VALUES ('سناء بن عمر', '0666666040', true)
        RETURNING id INTO v_student_id;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;
    INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type)
    VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 6: محمد عاصم عبد الملك
    SELECT id INTO v_student_id FROM students WHERE name = 'محمد عاصم عبد الملك' AND phone = '0668022323' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid)
        VALUES ('محمد عاصم عبد الملك', '0668022323', '0698035136', true)
        RETURNING id INTO v_student_id;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;
    INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type)
    VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 7: رزان مكاوي
    SELECT id INTO v_student_id FROM students WHERE name = 'رزان مكاوي' AND phone = '0674839907' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid)
        VALUES ('رزان مكاوي', '0674839907', true)
        RETURNING id INTO v_student_id;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;
    INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type)
    VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 8: محمد الامين رزوق2
    SELECT id INTO v_student_id FROM students WHERE name = 'محمد الامين رزوق2' AND phone = '0660436341' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid)
        VALUES ('محمد الامين رزوق2', '0660436341', '0798969878', true)
        RETURNING id INTO v_student_id;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;
    INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type)
    VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'absent')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 9: زين بن علي
    SELECT id INTO v_student_id FROM students WHERE name = 'زين بن علي' AND phone = '0780117501' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid)
        VALUES ('زين بن علي', '0780117501', true)
        RETURNING id INTO v_student_id;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;
    INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type)
    VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'too_late') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 10: عقبة بن علي
    SELECT id INTO v_student_id FROM students WHERE name = 'عقبة بن علي' AND phone = '0780117501' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid)
        VALUES ('عقبة بن علي', '0780117501', true)
        RETURNING id INTO v_student_id;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;
    INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type)
    VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'too_late') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 11: تقي الدين شرفي
    SELECT id INTO v_student_id FROM students WHERE name = 'تقي الدين شرفي' AND phone = '0656406382' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid)
        VALUES ('تقي الدين شرفي', '0656406382', true)
        RETURNING id INTO v_student_id;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;
    INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type)
    VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'new')      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'absent')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'absent')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'absent')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'absent')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'absent')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 12: محمد البشير فرحات
    SELECT id INTO v_student_id FROM students WHERE name = 'محمد البشير فرحات' AND phone = '0780278521' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, second_phone, registration_fee_paid)
        VALUES ('محمد البشير فرحات', '0780278521', '0780862774', true)
        RETURNING id INTO v_student_id;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;
    INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type)
    VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'new')      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'new')      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'new')      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'too_late') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    -- Student 13: الاء قماري
    SELECT id INTO v_student_id FROM students WHERE name = 'الاء قماري' AND phone = '0555944489' LIMIT 1;
    IF v_student_id IS NULL THEN
        INSERT INTO students (name, phone, registration_fee_paid)
        VALUES ('الاء قماري', '0555944489', true)
        RETURNING id INTO v_student_id;
    END IF;
    INSERT INTO student_groups (student_id, group_id, status) VALUES (v_student_id, v_group_id, 'active') ON CONFLICT DO NOTHING;
    INSERT INTO payments (student_id, group_id, amount, date, notes, payment_type)
    VALUES (v_student_id, NULL, 500, '2026-06-27', 'Registration fee paid (Bulk Import)', 'registration_fee') ON CONFLICT DO NOTHING;

    INSERT INTO attendance (session_id, student_id, status) VALUES (s1, v_student_id, 'new')      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s2, v_student_id, 'new')      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s3, v_student_id, 'new')      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s4, v_student_id, 'new')      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s5, v_student_id, 'new')      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s6, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s7, v_student_id, 'present')  ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s8, v_student_id, 'absent')   ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s9, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s10, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s11, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;
    INSERT INTO attendance (session_id, student_id, status) VALUES (s12, v_student_id, 'default') ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status;

    RAISE NOTICE '✅ Group 3000 (English A2 Teens) updated successfully with all 12 sessions!';
END $$;
