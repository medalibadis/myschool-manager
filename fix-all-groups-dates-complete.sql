-- COMPREHENSIVE FIX FOR ALL GROUP SCHEDULES AND SESSION DATES (2897 - 2922)
-- This script corrects the recurring days and regenerates sessions using a PL/pgSQL block.

DO $$
DECLARE
    -- Array of group data: ID, Start Date, Recurring Days
    -- Recurring Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    groups_to_fix RECORD;
    curr_date DATE;
    sess_count INT;
    total_sess INT := 12; -- Default total sessions
BEGIN
    -- Create a temporary table to hold the configuration for each group
    CREATE TEMP TABLE group_configs (
        id INT PRIMARY KEY,
        start_date DATE,
        recurring_days INT[]
    );

    -- Insert configurations for groups 2897-2909
    INSERT INTO group_configs VALUES (2909, '2026-04-04', '{5, 6}');
    INSERT INTO group_configs VALUES (2907, '2026-04-04', '{5, 6}');
    INSERT INTO group_configs VALUES (2906, '2026-04-03', '{1, 5, 6}');
    INSERT INTO group_configs VALUES (2905, '2026-04-03', '{5, 6}');
    INSERT INTO group_configs VALUES (2903, '2026-04-03', '{5, 6}');
    INSERT INTO group_configs VALUES (2902, '2026-04-03', '{5, 6}');
    INSERT INTO group_configs VALUES (2901, '2026-04-03', '{5, 6}');
    INSERT INTO group_configs VALUES (2900, '2026-04-02', '{2, 4}');
    INSERT INTO group_configs VALUES (2899, '2026-04-01', '{5, 6}');
    INSERT INTO group_configs VALUES (2898, '2026-03-28', '{5, 6}');
    INSERT INTO group_configs VALUES (2897, '2026-03-26', '{5, 6}');

    -- Also include groups 2912-2922 from the previous fix
    INSERT INTO group_configs VALUES (2912, '2026-04-09', '{4}') ON CONFLICT (id) DO UPDATE SET start_date = EXCLUDED.start_date, recurring_days = EXCLUDED.recurring_days;
    INSERT INTO group_configs VALUES (2913, '2026-04-10', '{5, 6}') ON CONFLICT (id) DO UPDATE SET start_date = EXCLUDED.start_date, recurring_days = EXCLUDED.recurring_days;
    INSERT INTO group_configs VALUES (2914, '2026-04-11', '{5, 6}') ON CONFLICT (id) DO UPDATE SET start_date = EXCLUDED.start_date, recurring_days = EXCLUDED.recurring_days;
    INSERT INTO group_configs VALUES (2915, '2026-04-11', '{5, 6}') ON CONFLICT (id) DO UPDATE SET start_date = EXCLUDED.start_date, recurring_days = EXCLUDED.recurring_days;
    INSERT INTO group_configs VALUES (2916, '2026-04-11', '{5, 6}') ON CONFLICT (id) DO UPDATE SET start_date = EXCLUDED.start_date, recurring_days = EXCLUDED.recurring_days;
    INSERT INTO group_configs VALUES (2917, '2026-04-16', '{4}') ON CONFLICT (id) DO UPDATE SET start_date = EXCLUDED.start_date, recurring_days = EXCLUDED.recurring_days;
    INSERT INTO group_configs VALUES (2918, '2026-04-16', '{2, 4}') ON CONFLICT (id) DO UPDATE SET start_date = EXCLUDED.start_date, recurring_days = EXCLUDED.recurring_days;
    INSERT INTO group_configs VALUES (2919, '2026-04-17', '{5, 6}') ON CONFLICT (id) DO UPDATE SET start_date = EXCLUDED.start_date, recurring_days = EXCLUDED.recurring_days;
    INSERT INTO group_configs VALUES (2920, '2026-04-17', '{5, 6}') ON CONFLICT (id) DO UPDATE SET start_date = EXCLUDED.start_date, recurring_days = EXCLUDED.recurring_days;
    INSERT INTO group_configs VALUES (2921, '2026-04-18', '{5, 6}') ON CONFLICT (id) DO UPDATE SET start_date = EXCLUDED.start_date, recurring_days = EXCLUDED.recurring_days;
    INSERT INTO group_configs VALUES (2922, '2026-04-18', '{5, 6}') ON CONFLICT (id) DO UPDATE SET start_date = EXCLUDED.start_date, recurring_days = EXCLUDED.recurring_days;

    -- Process each group
    FOR groups_to_fix IN SELECT * FROM group_configs LOOP
        -- 1. Update group metadata
        UPDATE groups 
        SET recurring_days = groups_to_fix.recurring_days,
            start_date = groups_to_fix.start_date
        WHERE id = groups_to_fix.id;

        -- 2. Delete existing sessions
        DELETE FROM sessions WHERE group_id = groups_to_fix.id;

        -- 3. Generate new sessions
        curr_date := groups_to_fix.start_date;
        sess_count := 0;
        
        WHILE sess_count < total_sess LOOP
            -- Check if current day of week is in recurring_days
            -- EXTRACT(DOW FROM ...) returns 0-6
            IF EXTRACT(DOW FROM curr_date) = ANY(groups_to_fix.recurring_days) THEN
                sess_count := sess_count + 1;
                INSERT INTO sessions (group_id, session_number, date) 
                VALUES (groups_to_fix.id, sess_count, curr_date);
            END IF;
            curr_date := curr_date + 1;
            
            -- Safety break to prevent infinite loop
            IF curr_date > (groups_to_fix.start_date + INTERVAL '1 year') THEN
                EXIT;
            END IF;
        END LOOP;
    END LOOP;

    DROP TABLE group_configs;
END $$;

-- Verify results
SELECT id, name, recurring_days, start_date 
FROM groups 
WHERE id >= 2897 AND id <= 2922 
ORDER BY id;
