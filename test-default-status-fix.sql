-- Test script to verify the default status fix
-- This will show students with 'default' status sessions and their calculated fees

-- Find students with 'default' status sessions
WITH student_attendance_summary AS (
  SELECT 
    s.id as student_id,
    s.name as student_name,
    s.custom_id,
    g.id as group_id,
    g.name as group_name,
    g.price as group_price,en 
    g.total_sessions,
    COUNT(*) as total_sessions_count,
    COUNT(CASE WHEN att.status = 'present' THEN 1 END) as present_sessions,
    COUNT(CASE WHEN att.status = 'absent' THEN 1 END) as absent_sessions,
    COUNT(CASE WHEN att.status = 'too_late' THEN 1 END) as too_late_sessions,
    COUNT(CASE WHEN att.status = 'default' THEN 1 END) as default_sessions,
    COUNT(CASE WHEN att.status = 'justified' THEN 1 END) as justified_sessions,
    COUNT(CASE WHEN att.status = 'new' THEN 1 END) as new_sessions,
    COUNT(CASE WHEN att.status = 'change' THEN 1 END) as change_sessions,
    COUNT(CASE WHEN att.status = 'stop' THEN 1 END) as stop_sessions
  FROM students s
  JOIN student_groups sg ON s.id = sg.student_id
  JOIN groups g ON sg.group_id = g.id
  LEFT JOIN sessions sess ON g.id = sess.group_id
  LEFT JOIN attendance att ON s.id = att.student_id AND sess.id = att.session_id
  WHERE sg.status = 'active'
  GROUP BY s.id, s.name, s.custom_id, g.id, g.name, g.price, g.total_sessions
  HAVING COUNT(CASE WHEN att.status = 'default' THEN 1 END) > 0
)
SELECT 
  student_name,
  custom_id,
  group_name,
  group_price,
  total_sessions,
  total_sessions_count,
  present_sessions,
  absent_sessions,
  too_late_sessions,
  default_sessions,
  justified_sessions,
  new_sessions,
  change_sessions,
  stop_sessions,
  -- Calculate obligatory sessions (present + absent + too_late + default)
  (present_sessions + absent_sessions + too_late_sessions + default_sessions) as obligatory_sessions,
  -- Calculate free sessions (justified + new + change + stop)
  (justified_sessions + new_sessions + change_sessions + stop_sessions) as free_sessions,
  -- Calculate price per session
  ROUND(group_price::numeric / total_sessions, 2) as price_per_session,
  -- Calculate fee owed (only obligatory sessions)
  ROUND((present_sessions + absent_sessions + too_late_sessions + default_sessions)::numeric * (group_price::numeric / total_sessions), 2) as fee_owed,
  -- Calculate free amount
  ROUND((justified_sessions + new_sessions + change_sessions + stop_sessions)::numeric * (group_price::numeric / total_sessions), 2) as free_amount
FROM student_attendance_summary
ORDER BY student_name, group_name;

-- Example: Student with 3 new + 8 present + 1 default should show:
-- obligatory_sessions = 8 + 1 = 9
-- free_sessions = 3
-- fee_owed = 9 * 500 = 4500 (if group price is 6000 and total sessions is 12)
