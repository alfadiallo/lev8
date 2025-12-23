-- ============================================================================
-- RESIDENT NOTES TABLE
-- Migration: 20250116000001_resident_notes.sql
-- Purpose: Unified notes table for resident profiles with future audio/AI support
-- ============================================================================

-- ============================================================================
-- 1. RESIDENT NOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS resident_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  
  -- Source tracking (where did this note come from?)
  source_type VARCHAR(30) NOT NULL DEFAULT 'portal_review'
    CHECK (source_type IN ('portal_review', 'ccc_session', 'one_on_one', 'voice_memo')),
  source_id UUID,  -- optional link to ccc_sessions.id, future meetings.id, etc.
  
  -- Content
  note_type VARCHAR(30) NOT NULL DEFAULT 'general'
    CHECK (note_type IN (
      'general',
      'strength',
      'weakness',
      'opportunity',
      'threat',
      'action_item',
      'milestone_note',
      'committee_decision'
    )),
  note_text TEXT,  -- text content or transcription
  
  -- Audio support (future-ready)
  audio_url TEXT,                    -- storage path if audio recording
  audio_duration_seconds INT,
  transcription_status VARCHAR(20)   -- 'pending', 'processing', 'completed', 'failed'
    CHECK (transcription_status IS NULL OR transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- AI analysis (future-ready)
  ai_summary TEXT,
  ai_sentiment VARCHAR(20)           -- 'positive', 'neutral', 'negative', 'mixed'
    CHECK (ai_sentiment IS NULL OR ai_sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  ai_tags TEXT[],                    -- extracted topics/themes
  
  -- Metadata
  is_confidential BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_resident_notes_resident ON resident_notes(resident_id);
CREATE INDEX IF NOT EXISTS idx_resident_notes_source ON resident_notes(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_resident_notes_type ON resident_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_resident_notes_created ON resident_notes(created_at DESC);

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE resident_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "resident_notes_select_staff" ON resident_notes;
DROP POLICY IF EXISTS "resident_notes_insert_staff" ON resident_notes;
DROP POLICY IF EXISTS "resident_notes_update" ON resident_notes;
DROP POLICY IF EXISTS "resident_notes_delete" ON resident_notes;

-- Select: Program staff can view notes
CREATE POLICY "resident_notes_select_staff" ON resident_notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin', 'faculty', 'coordinator')
    )
  );

-- Insert: Program staff can create notes
CREATE POLICY "resident_notes_insert_staff" ON resident_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin', 'faculty', 'coordinator')
    )
  );

-- Update: Own notes or admin
CREATE POLICY "resident_notes_update" ON resident_notes
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin')
    )
  );

-- Delete: Own notes or admin
CREATE POLICY "resident_notes_delete" ON resident_notes
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin')
    )
  );

-- ============================================================================
-- 4. UPDATE TRIGGER
-- ============================================================================

-- Drop existing function and trigger if any
DROP TRIGGER IF EXISTS resident_notes_updated_at ON resident_notes;
DROP FUNCTION IF EXISTS update_resident_notes_updated_at();

CREATE FUNCTION update_resident_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resident_notes_updated_at
  BEFORE UPDATE ON resident_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_resident_notes_updated_at();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================




