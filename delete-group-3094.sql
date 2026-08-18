-- Script to safely delete group 3094 and all its related records
BEGIN;

-- 1. Delete attendance records for sessions belonging to this group
DELETE FROM attendance 
WHERE session_id IN (
    SELECT id FROM sessions WHERE group_id = 3094
);

-- 2. Delete sessions belonging to this group
DELETE FROM sessions 
WHERE group_id = 3094;

-- 3. Delete student_groups links for this group
DELETE FROM student_groups 
WHERE group_id = 3094;

-- 4. Delete receipts associated with payments for this group
DELETE FROM receipts 
WHERE payment_id IN (
    SELECT id FROM payments WHERE group_id = 3094
);

-- 5. Delete payments associated with this group
DELETE FROM payments 
WHERE group_id = 3094;

-- 6. Finally, delete the group itself
DELETE FROM groups 
WHERE id = 3094;

COMMIT;
