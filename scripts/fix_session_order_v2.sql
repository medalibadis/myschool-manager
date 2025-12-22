-- Fix Session Order After Rescheduling (Version 2)
-- This script handles existing unique constraints and properly assigns session numbers

-- Step 1: Drop the existing unique constraint temporarily to allow updates
DO $$ 
BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'sessions_group_id_session_number_key'
    ) THEN
        ALTER TABLE sessions DROP CONSTRAINT sessions_group_id_session_number_key;
        RAISE NOTICE 'Dropped existing unique constraint';
    END IF;
END $$;

-- Step 2: Add session_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'session_number'
    ) THEN
        ALTER TABLE sessions ADD COLUMN session_number INTEGER;
        RAISE NOTICE 'Added session_number column to sessions table';
    ELSE
        RAISE NOTICE 'session_number column already exists';
    END IF;
END $$;

-- Step 3: Clear all existing session numbers to avoid conflicts
DO $$ 
BEGIN
    UPDATE sessions SET session_number = NULL;
    RAISE NOTICE 'Cleared all existing session numbers';
END $$;

-- Step 4: Assign session numbers to all sessions based on their current date order
DO $$ 
DECLARE 
    group_record RECORD;
    session_record RECORD;
    current_number INTEGER;
BEGIN
    -- For each group
    FOR group_record IN 
        SELECT DISTINCT group_id FROM sessions ORDER BY group_id
    LOOP
        current_number := 1;
        
        -- For each session in this group, ordered by date
        FOR session_record IN 
            SELECT id 
            FROM sessions 
            WHERE group_id = group_record.group_id 
            ORDER BY date ASC, created_at ASC
        LOOP
            -- Assign session number
            UPDATE sessions 
            SET session_number = current_number 
            WHERE id = session_record.id;
            
            current_number := current_number + 1;
        END LOOP;
        
        RAISE NOTICE 'Assigned session numbers for group %', group_record.group_id;
    END LOOP;
    
    RAISE NOTICE 'Session numbering complete';
END $$;

-- Step 5: Re-create the unique constraint
DO $$ 
BEGIN
    ALTER TABLE sessions 
    ADD CONSTRAINT sessions_group_id_session_number_key 
    UNIQUE (group_id, session_number);
    
    RAISE NOTICE 'Re-created unique constraint on (group_id, session_number)';
END $$;

-- Step 6: Create an index for better query performance
DO $$ 
BEGIN
    CREATE INDEX IF NOT EXISTS idx_sessions_session_number ON sessions(group_id, session_number);
    RAISE NOTICE 'Created index on session_number';
END $$;

-- Verification query - shows sessions with their numbers
SELECT 
    g.name as group_name,
    s.id,
    s.session_number,
    s.date,
    s.created_at
FROM sessions s
JOIN groups g ON s.group_id = g.id
ORDER BY g.name, s.session_number;
