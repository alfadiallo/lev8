-- ============================================================================
-- CCC SESSIONS TABLES
-- Migration: 20250130000005_ccc_sessions.sql
-- Purpose: Tables for Clinical Competency Committee meeting management
-- ============================================================================

-- ============================================================================
-- 1. CCC SESSIONS TABLE
-- ============================================================================

-- Drop and recreate if exists with wrong schema (safe for dev)
DROP TABLE IF EXISTS ccc_note_history CASCADE;
DROP TABLE IF EXISTS ccc_notes CASCADE;
DROP TABLE IF EXISTS ccc_session_residents CASCADE;
DROP TABLE IF EXISTS ccc_sessions CASCADE;

CREATE TABLE ccc_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  academic_year VARCHAR(9) NOT NULL, -- e.g., '2025-2026'
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('Fall', 'Spring', 'Ad-hoc')),
  title VARCHAR(255),
  pgy_level INT CHECK (pgy_level >= 1 AND pgy_level <= 7),
  duration_minutes INT DEFAULT 60,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_ccc_sessions_program ON ccc_sessions(program_id);
CREATE INDEX idx_ccc_sessions_date ON ccc_sessions(session_date);
CREATE INDEX idx_ccc_sessions_status ON ccc_sessions(status);

-- ============================================================================
-- 2. CCC SESSION RESIDENTS TABLE
-- ============================================================================

CREATE TABLE ccc_session_residents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES ccc_sessions(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  discussion_order INT NOT NULL DEFAULT 1,
  time_allocated INT DEFAULT 5, -- minutes
  time_spent INT, -- actual minutes spent (filled after discussion)
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each resident can only be in a session once
  CONSTRAINT unique_session_resident UNIQUE (session_id, resident_id)
);

-- Indexes
CREATE INDEX idx_ccc_session_residents_session ON ccc_session_residents(session_id);
CREATE INDEX idx_ccc_session_residents_resident ON ccc_session_residents(resident_id);
CREATE INDEX idx_ccc_session_residents_order ON ccc_session_residents(session_id, discussion_order);

-- ============================================================================
-- 3. CCC NOTES TABLE (Real-time collaborative notes)
-- ============================================================================

CREATE TABLE ccc_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES ccc_sessions(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES residents(id) ON DELETE SET NULL, -- NULL for session-level notes
  note_type VARCHAR(30) NOT NULL DEFAULT 'general' CHECK (note_type IN (
    'general',
    'strength',
    'weakness',
    'opportunity',
    'threat',
    'action_item',
    'milestone_note',
    'committee_decision'
  )),
  note_text TEXT NOT NULL,
  is_confidential BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ccc_notes_session ON ccc_notes(session_id);
CREATE INDEX idx_ccc_notes_resident ON ccc_notes(resident_id);
CREATE INDEX idx_ccc_notes_type ON ccc_notes(note_type);

-- ============================================================================
-- 4. CCC NOTE HISTORY (Version tracking)
-- ============================================================================

CREATE TABLE ccc_note_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES ccc_notes(id) ON DELETE CASCADE,
  previous_text TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ccc_note_history_note ON ccc_note_history(note_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ccc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccc_session_residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccc_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccc_note_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "ccc_sessions_select_staff" ON ccc_sessions;
DROP POLICY IF EXISTS "ccc_sessions_insert_admin" ON ccc_sessions;
DROP POLICY IF EXISTS "ccc_sessions_update_admin" ON ccc_sessions;
DROP POLICY IF EXISTS "ccc_session_residents_select_staff" ON ccc_session_residents;
DROP POLICY IF EXISTS "ccc_session_residents_insert_admin" ON ccc_session_residents;
DROP POLICY IF EXISTS "ccc_session_residents_update_admin" ON ccc_session_residents;
DROP POLICY IF EXISTS "ccc_notes_select_staff" ON ccc_notes;
DROP POLICY IF EXISTS "ccc_notes_insert_staff" ON ccc_notes;
DROP POLICY IF EXISTS "ccc_notes_update" ON ccc_notes;
DROP POLICY IF EXISTS "ccc_note_history_select_staff" ON ccc_note_history;
DROP POLICY IF EXISTS "ccc_note_history_insert" ON ccc_note_history;

-- CCC Sessions: readable by program staff
CREATE POLICY "ccc_sessions_select_staff" ON ccc_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin', 'faculty', 'coordinator')
    )
  );

-- CCC Sessions: insert/update by program directors
CREATE POLICY "ccc_sessions_insert_admin" ON ccc_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin')
    )
  );

CREATE POLICY "ccc_sessions_update_admin" ON ccc_sessions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin')
    )
  );

-- Session Residents: readable by program staff
CREATE POLICY "ccc_session_residents_select_staff" ON ccc_session_residents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin', 'faculty', 'coordinator')
    )
  );

-- Session Residents: insert/update by program directors
CREATE POLICY "ccc_session_residents_insert_admin" ON ccc_session_residents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin')
    )
  );

CREATE POLICY "ccc_session_residents_update_admin" ON ccc_session_residents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin')
    )
  );

-- Notes: readable by program staff
CREATE POLICY "ccc_notes_select_staff" ON ccc_notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin', 'faculty', 'coordinator')
    )
  );

-- Notes: insert by program staff
CREATE POLICY "ccc_notes_insert_staff" ON ccc_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin', 'faculty', 'coordinator')
    )
  );

-- Notes: update own notes or by admin
CREATE POLICY "ccc_notes_update" ON ccc_notes
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
CREATE POLICY "ccc_note_history_select_staff" ON ccc_note_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin', 'faculty', 'coordinator')
    )
  );

-- Note History: insert by system (via trigger)
CREATE POLICY "ccc_note_history_insert" ON ccc_note_history
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 6. TRIGGER: Track note changes
-- ============================================================================

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS ccc_note_change_trigger ON ccc_notes;
DROP FUNCTION IF EXISTS track_ccc_note_changes();

CREATE FUNCTION track_ccc_note_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.note_text IS DISTINCT FROM NEW.note_text THEN
    INSERT INTO ccc_note_history (note_id, previous_text, changed_by)
    VALUES (OLD.id, OLD.note_text, auth.uid());
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER ccc_note_change_trigger
  BEFORE UPDATE ON ccc_notes
  FOR EACH ROW
  EXECUTE FUNCTION track_ccc_note_changes();

-- ============================================================================
-- 7. ENABLE REALTIME FOR NOTES
-- ============================================================================

-- Enable realtime for collaborative note editing
ALTER TABLE ccc_notes REPLICA IDENTITY FULL;

-- Add to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'ccc_notes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ccc_notes;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not add ccc_notes to realtime publication';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

