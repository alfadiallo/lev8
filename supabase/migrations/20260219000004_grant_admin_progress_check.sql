-- ============================================================================
-- GRANT PROGRESS CHECK ADMIN ACCESS
-- Migration: 20260219000004_grant_admin_progress_check.sql
-- Purpose: Give findme@alfadiallo.com program_director access to Progress Check
--          for the MHS EM program so they can manage settings, surveys, and faculty.
-- Idempotent: Uses NOT EXISTS to skip if row already present.
-- ============================================================================

INSERT INTO public.eqpqiq_user_roles (user_email, role, tool, program_id, is_active, is_admin)
SELECT 'findme@alfadiallo.com', 'program_director', 'progress_check', p.id, true, true
FROM public.programs p
LIMIT 1
ON CONFLICT DO NOTHING;
