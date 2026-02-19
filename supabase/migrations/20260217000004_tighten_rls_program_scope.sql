-- ============================================================================
-- Migration: Tighten RLS policies to enforce program scope
--
-- Problem: The structured_ratings_select policy (from 20250224000002) uses
-- is_faculty_or_above() which allows ANY faculty to read ALL ratings across
-- programs. The earlier structured_ratings_faculty_read policy (from 
-- 20250115000003) correctly scopes by program but PostgreSQL RLS is OR-based:
-- if ANY policy passes, access is granted. The weaker policy wins.
--
-- Fix: Replace structured_ratings_select with a program-scoped version.
-- Also tighten residents_select_own for the same reason.
-- ============================================================================

-- ============================================================================
-- 1. Fix structured_ratings SELECT policy
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "structured_ratings_select" ON public.structured_ratings;

-- Replace with program-scoped version:
-- Residents see their own ratings, faculty see ratings within their program,
-- super_admin sees everything.
CREATE POLICY "structured_ratings_select_program_scoped" ON public.structured_ratings
  FOR SELECT
  USING (
    -- Own ratings (resident viewing their own)
    resident_id IN (SELECT id FROM public.residents WHERE user_id = auth.uid())
    -- Faculty/PD in the same program
    OR EXISTS (
      SELECT 1 FROM public.faculty f
      JOIN public.residents r ON r.program_id = f.program_id
      WHERE f.user_id = auth.uid()
      AND r.id = structured_ratings.resident_id
    )
    -- Super admin
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'super_admin'
    )
    -- Public form submissions (token-based survey access)
    OR form_submission_id IS NOT NULL
  );


-- ============================================================================
-- 2. Fix residents SELECT policy
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "residents_select_own" ON public.residents;

-- Replace with program-scoped version
CREATE POLICY "residents_select_program_scoped" ON public.residents
  FOR SELECT
  USING (
    -- Own record
    user_id = auth.uid()
    -- Faculty/PD in the same program
    OR EXISTS (
      SELECT 1 FROM public.faculty f
      WHERE f.user_id = auth.uid()
      AND f.program_id = residents.program_id
    )
    -- PD of the program
    OR EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.pgm_director_id = auth.uid()
      AND p.id = residents.program_id
    )
    -- Super admin
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'super_admin'
    )
  );
