-- ============================================================================
-- SQL Script for MySchool Manager Data Sync
-- Purpose: 
-- 1. Sync 'stopped' attendance for students who have stopped (Fixes Session Progress)
-- 2. Populate 'unpaid_balances' for existing group enrollments (Fixes Backlog)
-- ============================================================================

DO $$
BEGIN

    -- ----------------------------------------------------------------------------
    -- 1. Fix Session Progress (Backfill 'stopped' attendance)
    -- ----------------------------------------------------------------------------
    -- This ensures that students marked as 'stopped' in a group have their 
    -- future sessions explicitly marked as 'stopped' in the attendance table.
    -- This aligns with the new progress calculation logic.

    INSERT INTO attendance (session_id, student_id, status, updated_at)
    SELECT 
        s.id, 
        sg.student_id, 
        'stopped', 
        NOW()
    FROM sessions s
    JOIN student_groups sg ON s.group_id = sg.group_id
    WHERE sg.status = 'stopped' 
      AND s.date > CURRENT_DATE
      -- Only insert if record doesn't exist
      AND NOT EXISTS (
        SELECT 1 FROM attendance a 
        WHERE a.session_id = s.id AND a.student_id = sg.student_id
      );

    -- Also update existing records that might be 'default' or null to 'stopped'
    UPDATE attendance a
    SET status = 'stopped', updated_at = NOW()
    FROM sessions s, student_groups sg
    WHERE a.session_id = s.id 
      AND a.student_id = sg.student_id
      AND s.group_id = sg.group_id
      AND sg.status = 'stopped'
      AND s.date > CURRENT_DATE
      AND a.status = 'default';

    RAISE NOTICE 'Future attendance for stopped students has been synchronized.';


    -- ----------------------------------------------------------------------------
    -- 2. Backfill Unpaid Balances (Debt Records)
    -- ----------------------------------------------------------------------------
    -- This populates the 'unpaid_balances' table for all existing active/stopped
    -- enrollments that are missing a record. Ideally, the application logic now
    -- calculates balances dynamically, but this table is often used for fast lookups.

    -- Ensure unpaid_balances table exists first (sanity check, usually redundant if app is running)
    -- If it doesn't exist, this block might fail, but assuming schema exists.

    INSERT INTO unpaid_balances (
        student_id, 
        group_id, 
        description, 
        amount, 
        is_registration_fee, 
        status,
        created_at,
        updated_at
    )
    SELECT 
        sg.student_id,
        sg.group_id,
        g.name, -- Description defaults to Group Name
        -- Calculate Amount considering Discount
        ROUND(
            (g.price * (1 - (COALESCE(sg.group_discount, s.default_discount, 0) / 100.0)))::numeric, 
            2
        ),
        FALSE, -- is_registration_fee
        'unpaid',
        NOW(),
        NOW()
    FROM student_groups sg
    JOIN groups g ON sg.group_id = g.id
    JOIN students s ON sg.student_id = s.id
    WHERE 
        -- Only active or stopped groups
        sg.status IN ('active', 'stopped')
        -- Exclude if a balance record already exists for this group
        AND NOT EXISTS (
            SELECT 1 FROM unpaid_balances ub 
            WHERE ub.student_id = sg.student_id 
              AND ub.group_id = sg.group_id
              AND ub.is_registration_fee = FALSE
        );

    RAISE NOTICE 'Missing unpaid_balances records have been populated.';


    -- ----------------------------------------------------------------------------
    -- 3. Backfill Registration Fees (Optional but recommended)
    -- ----------------------------------------------------------------------------
    -- Ensure every student has a registration fee record in unpaid_balances

    INSERT INTO unpaid_balances (
        student_id, 
        group_id, 
        description, 
        amount, 
        is_registration_fee, 
        status,
        created_at,
        updated_at
    )
    SELECT 
        s.id,
        NULL, -- No group ID for registration
        'Registration Fee',
        500.00, -- Default Registration Fee
        TRUE,
        'unpaid',
        NOW(),
        NOW()
    FROM students s
    WHERE NOT EXISTS (
        SELECT 1 FROM unpaid_balances ub 
        WHERE ub.student_id = s.id 
          AND ub.is_registration_fee = TRUE
    );

    RAISE NOTICE 'Missing registration fee records have been populated.';

END $$;
