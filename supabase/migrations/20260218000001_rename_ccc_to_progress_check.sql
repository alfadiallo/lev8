-- ============================================================================
-- RENAME CCC TO PROGRESS CHECK
-- Migration: 20260218000001_rename_ccc_to_progress_check.sql
-- Purpose: Rename all CCC (Clinical Competency Committee) references to
--          "Progress Check" across tables, indexes, policies, triggers,
--          tool values, and CHECK constraints.
-- ============================================================================

-- ============================================================================
-- 1. RENAME TABLES
-- ============================================================================

ALTER TABLE IF EXISTS ccc_sessions RENAME TO progress_check_sessions;
ALTER TABLE IF EXISTS ccc_session_residents RENAME TO progress_check_session_residents;
ALTER TABLE IF EXISTS ccc_notes RENAME TO progress_check_notes;
ALTER TABLE IF EXISTS ccc_note_history RENAME TO progress_check_note_history;

-- ============================================================================
-- 2. RENAME INDEXES
-- ============================================================================

ALTER INDEX IF EXISTS idx_ccc_sessions_program RENAME TO idx_progress_check_sessions_program;
ALTER INDEX IF EXISTS idx_ccc_sessions_date RENAME TO idx_progress_check_sessions_date;
ALTER INDEX IF EXISTS idx_ccc_sessions_status RENAME TO idx_progress_check_sessions_status;
ALTER INDEX IF EXISTS idx_ccc_session_residents_session RENAME TO idx_progress_check_session_residents_session;
ALTER INDEX IF EXISTS idx_ccc_session_residents_resident RENAME TO idx_progress_check_session_residents_resident;
ALTER INDEX IF EXISTS idx_ccc_session_residents_order RENAME TO idx_progress_check_session_residents_order;
ALTER INDEX IF EXISTS idx_ccc_notes_session RENAME TO idx_progress_check_notes_session;
ALTER INDEX IF EXISTS idx_ccc_notes_resident RENAME TO idx_progress_check_notes_resident;
ALTER INDEX IF EXISTS idx_ccc_notes_type RENAME TO idx_progress_check_notes_type;
ALTER INDEX IF EXISTS idx_ccc_note_history_note RENAME TO idx_progress_check_note_history_note;

-- ============================================================================
-- 3. DROP OLD RLS POLICIES (on renamed tables)
-- ============================================================================

-- progress_check_sessions (formerly ccc_sessions)
DROP POLICY IF EXISTS "ccc_sessions_select_staff" ON progress_check_sessions;
DROP POLICY IF EXISTS "ccc_sessions_insert_admin" ON progress_check_sessions;
DROP POLICY IF EXISTS "ccc_sessions_update_admin" ON progress_check_sessions;
DROP POLICY IF EXISTS "ccc_sessions_select" ON progress_check_sessions;
DROP POLICY IF EXISTS "ccc_sessions_insert" ON progress_check_sessions;
DROP POLICY IF EXISTS "ccc_sessions_update" ON progress_check_sessions;

-- progress_check_session_residents (formerly ccc_session_residents)
DROP POLICY IF EXISTS "ccc_session_residents_select_staff" ON progress_check_session_residents;
DROP POLICY IF EXISTS "ccc_session_residents_insert_admin" ON progress_check_session_residents;
DROP POLICY IF EXISTS "ccc_session_residents_update_admin" ON progress_check_session_residents;

-- progress_check_notes (formerly ccc_notes)
DROP POLICY IF EXISTS "ccc_notes_select_staff" ON progress_check_notes;
DROP POLICY IF EXISTS "ccc_notes_insert_staff" ON progress_check_notes;
DROP POLICY IF EXISTS "ccc_notes_update" ON progress_check_notes;

-- progress_check_note_history (formerly ccc_note_history)
DROP POLICY IF EXISTS "ccc_note_history_select_staff" ON progress_check_note_history;
DROP POLICY IF EXISTS "ccc_note_history_insert" ON progress_check_note_history;

-- ============================================================================
-- 4. RECREATE RLS POLICIES WITH NEW NAMES
-- ============================================================================

-- Progress Check Sessions: readable by program staff
CREATE POLICY "progress_check_sessions_select_staff" ON progress_check_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('program_director', 'admin', 'system_admin', 'faculty', 'coordinator')
    )
  );

-- Progress Check Sessions: insert by program directors
CREATE POLICY "progress_check_sessions_insert_admin" ON progress_check_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('program_director', 'admin', 'system_admin')
    )
  );

-- Progress Check Sessions: update by program directors
CREATE POLICY "progress_check_sessions_update_admin" ON progress_check_sessions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('program_director', 'admin', 'system_admin')
    )
  );

-- Session Residents: readable by program staff
CREATE POLICY "progress_check_session_residents_select_staff" ON progress_check_session_residents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('program_director', 'admin', 'system_admin', 'faculty', 'coordinator')
    )
  );

-- Session Residents: insert by program directors
CREATE POLICY "progress_check_session_residents_insert_admin" ON progress_check_session_residents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('program_director', 'admin', 'system_admin')
    )
  );

-- Session Residents: update by program directors
CREATE POLICY "progress_check_session_residents_update_admin" ON progress_check_session_residents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('program_director', 'admin', 'system_admin')
    )
  );

-- Notes: readable by program staff
CREATE POLICY "progress_check_notes_select_staff" ON progress_check_notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('program_director', 'admin', 'system_admin', 'faculty', 'coordinator')
    )
  );

-- Notes: insert by program staff
CREATE POLICY "progress_check_notes_insert_staff" ON progress_check_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('program_director', 'admin', 'system_admin', 'faculty', 'coordinator')
    )
  );

-- Notes: update own notes or by admin
CREATE POLICY "progress_check_notes_update" ON progress_check_notes
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('program_director', 'admin', 'system_admin')
    )
  );

-- Note History: readable by program staff
CREATE POLICY "progress_check_note_history_select_staff" ON progress_check_note_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('program_director', 'admin', 'system_admin', 'faculty', 'coordinator')
    )
  );

-- Note History: insert by authenticated users (trigger-driven)
CREATE POLICY "progress_check_note_history_insert" ON progress_check_note_history
  FOR INSERT TO authenticated
  WITH CHECK (
    changed_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.progress_check_notes n
      WHERE n.id = note_id
    )
  );

-- ============================================================================
-- 5. DROP AND RECREATE TRIGGER + FUNCTION
-- ============================================================================

DROP TRIGGER IF EXISTS ccc_note_change_trigger ON progress_check_notes;
DROP FUNCTION IF EXISTS track_ccc_note_changes();

CREATE FUNCTION track_progress_check_note_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.note_text IS DISTINCT FROM NEW.note_text THEN
    INSERT INTO progress_check_note_history (note_id, previous_text, changed_by)
    VALUES (OLD.id, OLD.note_text, auth.uid());
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER progress_check_note_change_trigger
  BEFORE UPDATE ON progress_check_notes
  FOR EACH ROW
  EXECUTE FUNCTION track_progress_check_note_changes();

-- ============================================================================
-- 6. UPDATE tool COLUMN VALUES IN eqpqiq_user_roles
-- ============================================================================

-- First drop the CHECK constraint, then update, then re-add
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find and drop the tool CHECK constraint on eqpqiq_user_roles
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE t.relname = 'eqpqiq_user_roles'
    AND n.nspname = 'public'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%tool%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.eqpqiq_user_roles DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

UPDATE public.eqpqiq_user_roles SET tool = 'progress_check' WHERE tool = 'ccc';

ALTER TABLE public.eqpqiq_user_roles
  ADD CONSTRAINT eqpqiq_user_roles_tool_check
  CHECK (tool IN ('interview', 'progress_check', 'pulsecheck'));

-- (Section 7 removed — surveys table does not have a tool column)

-- ============================================================================
-- 7. UPDATE source_type IN resident_notes
-- ============================================================================

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE t.relname = 'resident_notes'
    AND n.nspname = 'public'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%source_type%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.resident_notes DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

UPDATE public.resident_notes SET source_type = 'progress_check_session' WHERE source_type = 'ccc_session';

ALTER TABLE public.resident_notes
  ADD CONSTRAINT resident_notes_source_type_check
  CHECK (source_type IN ('portal_review', 'progress_check_session', 'one_on_one', 'voice_memo'));

-- ============================================================================
-- 9. UPDATE SUPABASE REALTIME PUBLICATION
-- ============================================================================

DO $$
BEGIN
  -- Remove old table name from publication
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'progress_check_notes'
  ) THEN
    -- Already renamed (table rename carries over in publication)
    RAISE NOTICE 'progress_check_notes already in supabase_realtime publication';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not verify realtime publication for progress_check_notes';
END $$;

-- ============================================================================
-- 10. UPDATE TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE public.progress_check_sessions IS 'Progress Check meeting sessions for residency programs';
COMMENT ON TABLE public.progress_check_session_residents IS 'Residents scheduled for discussion in a Progress Check session';
COMMENT ON TABLE public.progress_check_notes IS 'Real-time collaborative notes for Progress Check sessions';
COMMENT ON TABLE public.progress_check_note_history IS 'Version tracking for Progress Check note edits';
COMMENT ON TABLE public.eqpqiq_user_roles IS 'Unified cross-tool role tracking for eqpqiq.com (Interview, Progress Check, Pulse Check)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
