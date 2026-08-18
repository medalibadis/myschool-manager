-- Script to safely delete the 5000 payment for student "ميار جيدة" (676570627)
-- This will allow you to re-add it in the UI and have it correctly split across groups.
BEGIN;

-- 1. Delete the receipt associated with this payment first (to avoid foreign key errors)
DELETE FROM receipts
WHERE payment_id IN (
    SELECT id
    FROM payments
    WHERE student_id = (SELECT id FROM students WHERE name = 'ميار جيدة' LIMIT 1)
      AND amount = 5000
      AND group_id IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1
);

-- 2. Delete the payment itself
DELETE FROM payments
WHERE id IN (
    SELECT id
    FROM payments
    WHERE student_id = (SELECT id FROM students WHERE name = 'ميار جيدة' LIMIT 1)
      AND amount = 5000
      AND group_id IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1
);

COMMIT;
