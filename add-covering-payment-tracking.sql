-- Covering payment tracking
--
-- Fixes two defects in teacher covering salary handling:
--
--   1. Covering sessions were never marked as paid. calculateUnpaidGroups()
--      pushes covering entries into the unpaid list with no check against
--      teacher_salaries, so covering amounts reappear as unpaid every time the
--      salary modal is opened. It could not check: teacher_salaries has no
--      covering column, so there was no way to know which covering sessions a
--      payment had settled.
--
--   2. Covering records are never removed. When a teacher's status is corrected
--      from absent back to present, the covering row survives, so the school
--      pays the original teacher AND the covering teacher for the same session.
--
-- Idempotent: safe to run more than once.

-- 1. Record how many covering sessions a salary payment settled.
ALTER TABLE public.teacher_salaries
    ADD COLUMN IF NOT EXISTS covering_sessions INTEGER DEFAULT 0;

-- 2. Settle covering per record, instead of inferring it from (teacher_id, group_id).
--    Inferring is wrong anyway: a second covering in an already-paid group would
--    be masked by the first payment's row.
ALTER TABLE public.teacher_covering
    ADD COLUMN IF NOT EXISTS teacher_salary_id UUID REFERENCES public.teacher_salaries(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;

-- 3. UNIQUE(session_id) would block assigning a new covering teacher after an
--    earlier one is cancelled. Scope uniqueness to still-active records.
ALTER TABLE public.teacher_covering
    DROP CONSTRAINT IF EXISTS teacher_covering_session_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_covering_active_session
    ON public.teacher_covering (session_id)
    WHERE cancelled_at IS NULL;

-- 4. Unpaid-covering lookups filter on exactly these columns.
CREATE INDEX IF NOT EXISTS idx_teacher_covering_unsettled
    ON public.teacher_covering (covering_teacher_id, group_id)
    WHERE paid_at IS NULL AND cancelled_at IS NULL;


-- ---------------------------------------------------------------------------
-- AUDIT (read-only). Run this BEFORE the code starts filtering on the new
-- columns, to see how much damage the two defects have already done.
-- ---------------------------------------------------------------------------

-- Covering rows whose original teacher is no longer absent/justified for that
-- session. Each one is a session that was very likely paid twice.
--
-- SELECT tc.id,
--        tc.cover_date,
--        ot.name  AS original_teacher,
--        ct.name  AS covering_teacher,
--        g.name   AS group_name,
--        ta.status AS current_status_of_original_teacher
-- FROM public.teacher_covering tc
-- JOIN public.teachers ot ON ot.id = tc.original_teacher_id
-- JOIN public.teachers ct ON ct.id = tc.covering_teacher_id
-- JOIN public.groups   g  ON g.id  = tc.group_id
-- LEFT JOIN public.teacher_attendance ta
--        ON ta.session_id = tc.session_id
--       AND ta.teacher_id = tc.original_teacher_id
-- WHERE tc.cancelled_at IS NULL
--   AND (ta.status IS NULL OR ta.status NOT IN ('absent', 'justified'))
-- ORDER BY tc.cover_date DESC;

-- To retire the rows that audit returns (review them first):
--
-- UPDATE public.teacher_covering tc
-- SET cancelled_at = NOW(),
--     cancelled_reason = 'Original teacher no longer absent/justified'
-- FROM public.teacher_attendance ta
-- WHERE ta.session_id = tc.session_id
--   AND ta.teacher_id = tc.original_teacher_id
--   AND tc.cancelled_at IS NULL
--   AND ta.status NOT IN ('absent', 'justified');
