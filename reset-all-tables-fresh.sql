-- Database Cleanup Script
-- Purpose: Delete all student, group, and payment data while preserving teachers.

-- 1. Clear child/transactional tables
TRUNCATE TABLE attendance CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE receipts CASCADE;
TRUNCATE TABLE student_groups CASCADE;
TRUNCATE TABLE refund_requests CASCADE;
TRUNCATE TABLE call_logs CASCADE;

-- 2. Clear main entities
TRUNCATE TABLE groups CASCADE;
TRUNCATE TABLE students CASCADE;
TRUNCATE TABLE waiting_list CASCADE;

-- 3. Reset all sequences (ID counters) to start from 1 again
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
              WHERE relkind = 'S' AND n.nspname = 'public') 
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.relname) || ' RESTART WITH 1';
    END LOOP;
END $$;
