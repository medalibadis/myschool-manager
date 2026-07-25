-- Fix for Group 2922: Incorrect session dates (Mondays instead of Fri/Sat)
-- This script updates the recurring days (just in case) and regenerates the 12 sessions starting from Apr 18, 2026.

BEGIN;

-- 1. Ensure Group 2922 has the correct schedule configuration
UPDATE groups 
SET 
    recurring_days = '{5, 6}', -- Friday (5) and Saturday (6)
    start_date = '2026-04-18',
    total_sessions = 12
WHERE id = 2922;

-- 2. Delete existing sessions for Group 2922 (safe since progress is 0/12)
DELETE FROM sessions WHERE group_id = 2922;

-- 3. Manually insert the correct sessions
-- Session 1: Apr 18 (Sat)
INSERT INTO sessions (group_id, session_number, date) VALUES (2922, 1, '2026-04-18');
-- Session 2: Apr 24 (Fri)
INSERT INTO sessions (group_id, session_number, date) VALUES (2922, 2, '2026-04-24');
-- Session 3: Apr 25 (Sat)
INSERT INTO sessions (group_id, session_number, date) VALUES (2922, 3, '2026-04-25');
-- Session 4: May 01 (Fri)
INSERT INTO sessions (group_id, session_number, date) VALUES (2922, 4, '2026-05-01');
-- Session 5: May 02 (Sat)
INSERT INTO sessions (group_id, session_number, date) VALUES (2922, 5, '2026-05-02');
-- Session 6: May 08 (Fri)
INSERT INTO sessions (group_id, session_number, date) VALUES (2922, 6, '2026-05-08');
-- Session 7: May 09 (Sat)
INSERT INTO sessions (group_id, session_number, date) VALUES (2922, 7, '2026-05-09');
-- Session 8: May 15 (Fri)
INSERT INTO sessions (group_id, session_number, date) VALUES (2922, 8, '2026-05-15');
-- Session 9: May 16 (Sat)
INSERT INTO sessions (group_id, session_number, date) VALUES (2922, 9, '2026-05-16');
-- Session 10: May 22 (Fri)
INSERT INTO sessions (group_id, session_number, date) VALUES (2922, 10, '2026-05-22');
-- Session 11: May 23 (Sat)
INSERT INTO sessions (group_id, session_number, date) VALUES (2922, 11, '2026-05-23');
-- Session 12: May 29 (Fri)
INSERT INTO sessions (group_id, session_number, date) VALUES (2922, 12, '2026-05-29');

COMMIT;

-- Verification
SELECT id, group_id, session_number, date 
FROM sessions 
WHERE group_id = 2922 
ORDER BY session_number;
