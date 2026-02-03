-- SQL Script to fix duplicate key errors when adding new teachers or students
-- This happens when the ID sequences get out of sync with existing data

DO $$
DECLARE
    max_teacher_id INTEGER;
    max_student_id INTEGER;
BEGIN
    -- 1. Fix Teacher Sequences
    SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(custom_id, '[^0-9]', '', 'g'), '') AS INTEGER)), 0) INTO max_teacher_id
    FROM teachers 
    WHERE custom_id IS NOT NULL AND custom_id ~ 'T[0-9]+';
    
    RAISE NOTICE 'Max Teacher ID found: T%', max_teacher_id;

    -- Update teacher_id_seq if it exists
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'teacher_id_seq') THEN
        PERFORM setval('teacher_id_seq', GREATEST(max_teacher_id, 1), true);
        RAISE NOTICE 'Updated teacher_id_seq to %', max_teacher_id;
    END IF;

    -- Update teacher_custom_id_seq if it exists
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'teacher_custom_id_seq') THEN
        PERFORM setval('teacher_custom_id_seq', GREATEST(max_teacher_id, 1), true);
        RAISE NOTICE 'Updated teacher_custom_id_seq to %', max_teacher_id;
    END IF;

    -- 2. Fix Student Sequence
    SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(custom_id, '[^0-9]', '', 'g'), '') AS INTEGER)), 0) INTO max_student_id
    FROM students 
    WHERE custom_id IS NOT NULL AND custom_id ~ 'ST[0-9]+';
    
    RAISE NOTICE 'Max Student ID found: ST%', LPAD(max_student_id::text, 4, '0');

    -- Update student_custom_id_seq if it exists
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'student_custom_id_seq') THEN
        PERFORM setval('student_custom_id_seq', GREATEST(max_student_id, 1), true);
        RAISE NOTICE 'Updated student_custom_id_seq to %', max_student_id;
    END IF;
    
    -- Also check for generic student_id_seq if any
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'student_id_seq') THEN
        PERFORM setval('student_id_seq', GREATEST(max_student_id, 1), true);
        RAISE NOTICE 'Updated student_id_seq to %', max_student_id;
    END IF;

END $$;
