-- ============================================================
-- ADD SESSIONS 9 TO 12 FOR GROUP 3000
-- Creates sessions #9, #10, #11, #12 and populates 'default' attendance
-- ============================================================

DO $$
DECLARE
    v_group_id INTEGER := 3000;
    s9 UUID; s10 UUID; s11 UUID; s12 UUID;
    r_student RECORD;
BEGIN
    -- 1. Insert sessions 9, 10, 11, 12 if they don't exist
    INSERT INTO sessions (group_id, date, session_number) 
    VALUES (v_group_id, '2026-07-31', 9) 
    ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date
    RETURNING id INTO s9;

    INSERT INTO sessions (group_id, date, session_number) 
    VALUES (v_group_id, '2026-08-01', 10) 
    ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date
    RETURNING id INTO s10;

    INSERT INTO sessions (group_id, date, session_number) 
    VALUES (v_group_id, '2026-08-07', 11) 
    ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date
    RETURNING id INTO s11;

    INSERT INTO sessions (group_id, date, session_number) 
    VALUES (v_group_id, '2026-08-08', 12) 
    ON CONFLICT (group_id, session_number) DO UPDATE SET date = EXCLUDED.date
    RETURNING id INTO s12;

    -- 2. Populate 'default' attendance for all students enrolled in Group 3000
    FOR r_student IN SELECT student_id FROM student_groups WHERE group_id = v_group_id LOOP
        INSERT INTO attendance (session_id, student_id, status) VALUES (s9, r_student.student_id, 'default') ON CONFLICT DO NOTHING;
        INSERT INTO attendance (session_id, student_id, status) VALUES (s10, r_student.student_id, 'default') ON CONFLICT DO NOTHING;
        INSERT INTO attendance (session_id, student_id, status) VALUES (s11, r_student.student_id, 'default') ON CONFLICT DO NOTHING;
        INSERT INTO attendance (session_id, student_id, status) VALUES (s12, r_student.student_id, 'default') ON CONFLICT DO NOTHING;
    END LOOP;

    RAISE NOTICE '✅ Sessions 9, 10, 11, 12 added successfully for Group 3000!';
END $$;
