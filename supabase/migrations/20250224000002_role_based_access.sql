-- =====================================================
-- Role-Based Access Control (RBAC) Policies
-- =====================================================
-- 
-- Access Levels:
-- - Residents: Can see own data + class/program aggregates
-- - Faculty: Can see all resident data
-- - Program Directors+: Full access
-- - Super Admin: Full access
--
-- =====================================================

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if user is faculty or above
CREATE OR REPLACE FUNCTION is_faculty_or_above()
RETURNS BOOLEAN AS $$
  SELECT role IN ('faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin')
  FROM user_profiles 
  WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if user is program leadership
CREATE OR REPLACE FUNCTION is_program_leadership()
RETURNS BOOLEAN AS $$
  SELECT role IN ('program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin')
  FROM user_profiles 
  WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to get current user's resident_id (if they are a resident)
CREATE OR REPLACE FUNCTION get_user_resident_id()
RETURNS UUID AS $$
  SELECT r.id 
  FROM residents r
  JOIN user_profiles up ON up.id = r.user_id
  WHERE up.id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- RESIDENTS TABLE
-- =====================================================
-- Residents can see their own record
-- Faculty+ can see all residents

ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "residents_select_own" ON residents;
CREATE POLICY "residents_select_own" ON residents
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR is_faculty_or_above()
  );

DROP POLICY IF EXISTS "residents_update_own" ON residents;
CREATE POLICY "residents_update_own" ON residents
  FOR UPDATE
  USING (user_id = auth.uid() OR is_program_leadership())
  WITH CHECK (user_id = auth.uid() OR is_program_leadership());

DROP POLICY IF EXISTS "residents_insert" ON residents;
CREATE POLICY "residents_insert" ON residents
  FOR INSERT
  WITH CHECK (is_program_leadership());

-- =====================================================
-- SWOT_SUMMARIES TABLE
-- =====================================================
-- Drop existing policies first
DROP POLICY IF EXISTS "swot_summaries_resident_read" ON swot_summaries;
DROP POLICY IF EXISTS "swot_summaries_faculty_read" ON swot_summaries;
DROP POLICY IF EXISTS "swot_summaries_admin_write" ON swot_summaries;
DROP POLICY IF EXISTS "swot_select_own" ON swot_summaries;
DROP POLICY IF EXISTS "swot_insert" ON swot_summaries;
DROP POLICY IF EXISTS "swot_update" ON swot_summaries;

CREATE POLICY "swot_select_own" ON swot_summaries
  FOR SELECT
  USING (
    resident_id = get_user_resident_id()
    OR is_faculty_or_above()
  );

CREATE POLICY "swot_insert" ON swot_summaries
  FOR INSERT
  WITH CHECK (is_faculty_or_above());

CREATE POLICY "swot_update" ON swot_summaries
  FOR UPDATE
  USING (is_faculty_or_above())
  WITH CHECK (is_faculty_or_above());

-- =====================================================
-- PERIOD_SCORES TABLE
-- =====================================================
-- Drop existing policies first
DROP POLICY IF EXISTS "period_scores_resident_read" ON period_scores;
DROP POLICY IF EXISTS "period_scores_faculty_read" ON period_scores;
DROP POLICY IF EXISTS "period_scores_admin_write" ON period_scores;
DROP POLICY IF EXISTS "period_scores_select_own" ON period_scores;
DROP POLICY IF EXISTS "period_scores_insert" ON period_scores;
DROP POLICY IF EXISTS "period_scores_update" ON period_scores;

CREATE POLICY "period_scores_select_own" ON period_scores
  FOR SELECT
  USING (
    resident_id = get_user_resident_id()
    OR is_faculty_or_above()
  );

CREATE POLICY "period_scores_insert" ON period_scores
  FOR INSERT
  WITH CHECK (is_faculty_or_above());

CREATE POLICY "period_scores_update" ON period_scores
  FOR UPDATE
  USING (is_faculty_or_above())
  WITH CHECK (is_faculty_or_above());

-- =====================================================
-- STRUCTURED_RATINGS TABLE  
-- =====================================================
-- Note: This table already has RLS policies from 20250115000003
-- We're adding/updating with our helper functions

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "structured_ratings_resident_read" ON structured_ratings;
DROP POLICY IF EXISTS "structured_ratings_resident_insert" ON structured_ratings;
DROP POLICY IF EXISTS "structured_ratings_faculty_read" ON structured_ratings;
DROP POLICY IF EXISTS "structured_ratings_faculty_insert" ON structured_ratings;
DROP POLICY IF EXISTS "structured_ratings_public_insert" ON structured_ratings;
DROP POLICY IF EXISTS "structured_ratings_select" ON structured_ratings;
DROP POLICY IF EXISTS "structured_ratings_insert" ON structured_ratings;
DROP POLICY IF EXISTS "structured_ratings_update" ON structured_ratings;

CREATE POLICY "structured_ratings_select" ON structured_ratings
  FOR SELECT
  USING (
    resident_id = get_user_resident_id()
    OR is_faculty_or_above()
  );

CREATE POLICY "structured_ratings_insert" ON structured_ratings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    OR form_submission_id IS NOT NULL -- Allow public form submissions
  );

CREATE POLICY "structured_ratings_update" ON structured_ratings
  FOR UPDATE
  USING (
    -- Faculty can update ratings they created
    (faculty_id IN (SELECT id FROM faculty WHERE user_id = auth.uid()))
    OR is_program_leadership()
  )
  WITH CHECK (
    (faculty_id IN (SELECT id FROM faculty WHERE user_id = auth.uid()))
    OR is_program_leadership()
  );

-- =====================================================
-- ITE_SCORES TABLE
-- =====================================================
-- Drop existing policies first
DROP POLICY IF EXISTS "ite_scores_resident_read" ON ite_scores;
DROP POLICY IF EXISTS "ite_scores_faculty_read" ON ite_scores;
DROP POLICY IF EXISTS "ite_scores_admin_write" ON ite_scores;
DROP POLICY IF EXISTS "ite_scores_select" ON ite_scores;
DROP POLICY IF EXISTS "ite_scores_insert" ON ite_scores;

CREATE POLICY "ite_scores_select" ON ite_scores
  FOR SELECT
  USING (
    resident_id = get_user_resident_id()
    OR is_faculty_or_above()
  );

CREATE POLICY "ite_scores_insert" ON ite_scores
  FOR INSERT
  WITH CHECK (is_program_leadership());

-- =====================================================
-- IMPORTED_COMMENTS TABLE
-- =====================================================
-- Drop existing policies first
DROP POLICY IF EXISTS "imported_comments_resident_read" ON imported_comments;
DROP POLICY IF EXISTS "imported_comments_faculty_read" ON imported_comments;
DROP POLICY IF EXISTS "imported_comments_admin_write" ON imported_comments;
DROP POLICY IF EXISTS "imported_comments_select" ON imported_comments;
DROP POLICY IF EXISTS "imported_comments_insert" ON imported_comments;

CREATE POLICY "imported_comments_select" ON imported_comments
  FOR SELECT
  USING (
    resident_id = get_user_resident_id()
    OR is_faculty_or_above()
  );

CREATE POLICY "imported_comments_insert" ON imported_comments
  FOR INSERT
  WITH CHECK (is_program_leadership());

-- =====================================================
-- RESIDENT_NOTES TABLE
-- =====================================================
-- Only faculty+ can see/create notes

ALTER TABLE resident_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resident_notes_select" ON resident_notes;
CREATE POLICY "resident_notes_select" ON resident_notes
  FOR SELECT
  USING (is_faculty_or_above());

DROP POLICY IF EXISTS "resident_notes_insert" ON resident_notes;
CREATE POLICY "resident_notes_insert" ON resident_notes
  FOR INSERT
  WITH CHECK (is_faculty_or_above());

DROP POLICY IF EXISTS "resident_notes_update" ON resident_notes;
CREATE POLICY "resident_notes_update" ON resident_notes
  FOR UPDATE
  USING (created_by = auth.uid() OR is_program_leadership())
  WITH CHECK (created_by = auth.uid() OR is_program_leadership());

DROP POLICY IF EXISTS "resident_notes_delete" ON resident_notes;
CREATE POLICY "resident_notes_delete" ON resident_notes
  FOR DELETE
  USING (created_by = auth.uid() OR is_program_leadership());

-- =====================================================
-- CCC_SESSIONS TABLE
-- =====================================================
-- Only faculty+ can see CCC sessions

ALTER TABLE ccc_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ccc_sessions_select" ON ccc_sessions;
CREATE POLICY "ccc_sessions_select" ON ccc_sessions
  FOR SELECT
  USING (is_faculty_or_above());

DROP POLICY IF EXISTS "ccc_sessions_insert" ON ccc_sessions;
CREATE POLICY "ccc_sessions_insert" ON ccc_sessions
  FOR INSERT
  WITH CHECK (is_program_leadership());

DROP POLICY IF EXISTS "ccc_sessions_update" ON ccc_sessions;
CREATE POLICY "ccc_sessions_update" ON ccc_sessions
  FOR UPDATE
  USING (is_program_leadership())
  WITH CHECK (is_program_leadership());

-- =====================================================
-- CLASSES TABLE (for aggregates)
-- =====================================================
-- Everyone can see class info (for aggregate views)

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classes_select_all" ON classes;
CREATE POLICY "classes_select_all" ON classes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "classes_modify" ON classes;
CREATE POLICY "classes_modify" ON classes
  FOR ALL
  USING (is_program_leadership())
  WITH CHECK (is_program_leadership());

-- =====================================================
-- USER_PROFILES TABLE
-- =====================================================
-- Users can see their own profile
-- Faculty+ can see all profiles

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR is_faculty_or_above()
  );

DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own" ON user_profiles
  FOR UPDATE
  USING (id = auth.uid() OR is_program_leadership())
  WITH CHECK (id = auth.uid() OR is_program_leadership());

DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
CREATE POLICY "user_profiles_insert" ON user_profiles
  FOR INSERT
  WITH CHECK (is_program_leadership() OR id = auth.uid());

-- =====================================================
-- ACCESS_REQUESTS TABLE
-- =====================================================
-- Only super_admin can see access requests

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "access_requests_select" ON access_requests;
CREATE POLICY "access_requests_select" ON access_requests
  FOR SELECT
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "access_requests_insert" ON access_requests;
CREATE POLICY "access_requests_insert" ON access_requests
  FOR INSERT
  WITH CHECK (true); -- Anyone can submit a request

DROP POLICY IF EXISTS "access_requests_update" ON access_requests;
CREATE POLICY "access_requests_update" ON access_requests
  FOR UPDATE
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'super_admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'super_admin');

-- =====================================================
-- Grant execute permissions on helper functions
-- =====================================================
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_faculty_or_above() TO authenticated;
GRANT EXECUTE ON FUNCTION is_program_leadership() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_resident_id() TO authenticated;


