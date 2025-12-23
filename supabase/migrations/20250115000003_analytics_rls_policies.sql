-- Analytics RLS Policies
-- Row-Level Security policies for analytics tables

-- ============================================================================
-- ENABLE RLS ON ALL ANALYTICS TABLES
-- ============================================================================
ALTER TABLE public.rotation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.structured_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.period_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swot_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ite_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rosh_completion_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_annotations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROTATION TYPES (Public reference data - read-only)
-- ============================================================================
CREATE POLICY rotation_types_read ON public.rotation_types
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- IMPORTED COMMENTS
-- ============================================================================

-- Residents can view their own comments
CREATE POLICY imported_comments_resident_read ON public.imported_comments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    resident_id IN (
      SELECT id FROM public.residents WHERE user_id = auth.uid()
    )
  );

-- Faculty can view comments from their program
CREATE POLICY imported_comments_faculty_read ON public.imported_comments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      LEFT JOIN public.faculty f ON f.user_id = up.id
      LEFT JOIN public.residents r ON r.id = imported_comments.resident_id
      WHERE up.id = auth.uid()
      AND up.role IN ('faculty', 'program_director', 'super_admin')
      AND (f.program_id = r.program_id OR up.role = 'super_admin')
    )
  );

-- ============================================================================
-- STRUCTURED RATINGS
-- ============================================================================

-- Residents can view their own ratings
CREATE POLICY structured_ratings_resident_read ON public.structured_ratings
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    resident_id IN (
      SELECT id FROM public.residents WHERE user_id = auth.uid()
    )
  );

-- Residents can INSERT their own self-assessments
CREATE POLICY structured_ratings_resident_insert ON public.structured_ratings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    rater_type = 'self' 
    AND resident_id IN (
      SELECT id FROM public.residents WHERE user_id = auth.uid()
    )
  );

-- Faculty can view ratings from their program
CREATE POLICY structured_ratings_faculty_read ON public.structured_ratings
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      LEFT JOIN public.faculty f ON f.user_id = up.id
      LEFT JOIN public.residents r ON r.id = structured_ratings.resident_id
      WHERE up.id = auth.uid()
      AND up.role IN ('faculty', 'program_director', 'super_admin')
      AND (f.program_id = r.program_id OR up.role = 'super_admin')
    )
  );

-- Faculty can INSERT ratings for residents in their program
CREATE POLICY structured_ratings_faculty_insert ON public.structured_ratings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    rater_type = 'faculty'
    AND faculty_id IN (
      SELECT id FROM public.faculty WHERE user_id = auth.uid()
    )
    AND resident_id IN (
      SELECT r.id FROM public.residents r
      JOIN public.faculty f ON f.program_id = r.program_id
      WHERE f.user_id = auth.uid()
    )
  );

-- Allow unauthenticated form submissions (validated by application logic)
CREATE POLICY structured_ratings_public_insert ON public.structured_ratings
  FOR INSERT
  WITH CHECK (
    form_submission_id IS NOT NULL -- Must come through public form
  );

-- ============================================================================
-- PERIOD SCORES
-- ============================================================================

-- Residents can view their own period scores
CREATE POLICY period_scores_resident_read ON public.period_scores
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    resident_id IN (
      SELECT id FROM public.residents WHERE user_id = auth.uid()
    )
    AND is_current = TRUE
  );

-- Faculty can view all period scores in their program
CREATE POLICY period_scores_faculty_read ON public.period_scores
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      LEFT JOIN public.faculty f ON f.user_id = up.id
      LEFT JOIN public.residents r ON r.id = period_scores.resident_id
      WHERE up.id = auth.uid()
      AND up.role IN ('faculty', 'program_director', 'super_admin')
      AND (f.program_id = r.program_id OR up.role = 'super_admin')
    )
  );

-- ============================================================================
-- SWOT SUMMARIES
-- ============================================================================

-- Residents can view their own SWOT
CREATE POLICY swot_summaries_resident_read ON public.swot_summaries
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    resident_id IN (
      SELECT id FROM public.residents WHERE user_id = auth.uid()
    )
    AND is_current = TRUE
  );

-- Faculty can view all SWOT in their program
CREATE POLICY swot_summaries_faculty_read ON public.swot_summaries
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      LEFT JOIN public.faculty f ON f.user_id = up.id
      LEFT JOIN public.residents r ON r.id = swot_summaries.resident_id
      WHERE up.id = auth.uid()
      AND up.role IN ('faculty', 'program_director', 'super_admin')
      AND (f.program_id = r.program_id OR up.role = 'super_admin')
    )
  );

-- ============================================================================
-- ITE SCORES
-- ============================================================================

-- Residents can view their own ITE scores
CREATE POLICY ite_scores_resident_read ON public.ite_scores
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    resident_id IN (
      SELECT id FROM public.residents WHERE user_id = auth.uid()
    )
  );

-- Faculty can view ITE scores in their program
CREATE POLICY ite_scores_faculty_read ON public.ite_scores
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      LEFT JOIN public.faculty f ON f.user_id = up.id
      LEFT JOIN public.residents r ON r.id = ite_scores.resident_id
      WHERE up.id = auth.uid()
      AND up.role IN ('faculty', 'program_director', 'super_admin')
      AND (f.program_id = r.program_id OR up.role = 'super_admin')
    )
  );

-- Program directors and super admins can insert/update ITE scores
CREATE POLICY ite_scores_admin_write ON public.ite_scores
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('program_director', 'super_admin')
    )
  );

-- ============================================================================
-- ROSH COMPLETION SNAPSHOTS
-- ============================================================================

-- Residents can view their own ROSH completion
CREATE POLICY rosh_snapshots_resident_read ON public.rosh_completion_snapshots
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    resident_id IN (
      SELECT id FROM public.residents WHERE user_id = auth.uid()
    )
  );

-- Faculty can view ROSH completion in their program
CREATE POLICY rosh_snapshots_faculty_read ON public.rosh_completion_snapshots
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      LEFT JOIN public.faculty f ON f.user_id = up.id
      LEFT JOIN public.residents r ON r.id = rosh_completion_snapshots.resident_id
      WHERE up.id = auth.uid()
      AND up.role IN ('faculty', 'program_director', 'super_admin')
      AND (f.program_id = r.program_id OR up.role = 'super_admin')
    )
  );

-- Program directors and super admins can insert/update ROSH snapshots
CREATE POLICY rosh_snapshots_admin_write ON public.rosh_completion_snapshots
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('program_director', 'super_admin')
    )
  );

-- ============================================================================
-- FORM TOKENS
-- ============================================================================

-- Only program directors and super admins can manage form tokens
CREATE POLICY form_tokens_admin_all ON public.form_tokens
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('program_director', 'super_admin')
    )
  );

-- ============================================================================
-- FACULTY ANNOTATIONS
-- ============================================================================

-- Faculty can create annotations
CREATE POLICY faculty_annotations_insert ON public.faculty_annotations
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    faculty_id IN (
      SELECT id FROM public.faculty WHERE user_id = auth.uid()
    )
  );

-- All faculty in program can view annotations
CREATE POLICY faculty_annotations_read ON public.faculty_annotations
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      LEFT JOIN public.faculty f ON f.user_id = up.id
      WHERE up.id = auth.uid()
      AND up.role IN ('faculty', 'program_director', 'super_admin')
    )
  );

-- Annotation creator and program directors can update
CREATE POLICY faculty_annotations_update ON public.faculty_annotations
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    (
      faculty_id IN (
        SELECT id FROM public.faculty WHERE user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('program_director', 'super_admin')
      )
    )
  );



