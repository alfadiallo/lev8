-- ============================================================================
-- PROGRESS CHECK DEMO ACCOUNTS
-- Migration: 20260218000002_progress_check_demo_accounts.sql
-- Purpose: Seed demo accounts for the Progress Check tool so the landing
--          page demo tiles work out of the box.
-- Idempotent: Uses NOT EXISTS to skip rows that already exist.
-- ============================================================================

INSERT INTO public.eqpqiq_user_roles (user_email, role, tool, program_id, is_active, is_admin)
SELECT v.user_email, v.role, v.tool, v.program_id::uuid, v.is_active, v.is_admin
FROM (VALUES
  ('demo-pd@mhw-em.edu',       'program_director', 'progress_check', '00000000-0000-0000-0000-000000000002', true, true),
  ('demo-faculty@mhw-em.edu',  'faculty',          'progress_check', '00000000-0000-0000-0000-000000000002', true, false),
  ('demo-resident@mhw-em.edu', 'resident',         'progress_check', '00000000-0000-0000-0000-000000000002', true, false)
) AS v(user_email, role, tool, program_id, is_active, is_admin)
WHERE NOT EXISTS (
  SELECT 1 FROM public.eqpqiq_user_roles r
  WHERE r.user_email = v.user_email
    AND r.tool = v.tool
    AND r.program_id = v.program_id::uuid
);
