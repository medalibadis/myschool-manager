-- Clean up duplicate sessions
-- This script removes duplicate sessions for the same group and date

-- First, let's see what duplicates exist
SELECT 
    group_id,
    date,
    COUNT(*) as session_count,
    array_agg(id) as session_ids
FROM sessions
GROUP BY group_id, date
HAVING COUNT(*) > 1
ORDER BY group_id, date;

-- Delete duplicate sessions, keeping only the first one for each group/date combination
DELETE FROM sessions 
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY group_id, date ORDER BY id) as rn
        FROM sessions
    ) t
    WHERE t.rn > 1
);

-- Verify the cleanup
SELECT 
    group_id,
    date,
    COUNT(*) as session_count
FROM sessions
GROUP BY group_id, date
HAVING COUNT(*) > 1
ORDER BY group_id, date;

-- Show final session count per group
SELECT 
    group_id,
    COUNT(*) as total_sessions
FROM sessions
GROUP BY group_id
ORDER BY group_id; 