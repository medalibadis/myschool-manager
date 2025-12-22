-- Fix Session Order After Rescheduling
-- This script adds a session_number field to preserve the original sequence of sessions
-- and fixes existing sessions to have proper sequence numbers

-- Step 1: Add session_number column if it doesn't exist
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

-- Step 2: Assign session numbers to existing sessions based on their current date order
-- This preserves the chronological order as the "original" sequence
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

-- Step 3: Create an index on session_number for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_session_number ON sessions(group_id, session_number);

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
