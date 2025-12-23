-- Analytics Foundation Migration
-- Adds analytics tables for the Understand > Overview module
-- Integrates with existing residents, programs, health_systems tables

-- ============================================================================
-- 1. ROTATION TYPES (Classification of evaluation types)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rotation_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_name TEXT NOT NULL UNIQUE,
  rotation_category TEXT NOT NULL CHECK (rotation_category IN ('On', 'Off')),
  rotation_name TEXT,
  site_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rotation_types_name ON public.rotation_types(evaluation_name);
CREATE INDEX IF NOT EXISTS idx_rotation_types_category ON public.rotation_types(rotation_category);

-- ============================================================================
-- 2. HELPER FUNCTIONS
-- ============================================================================

-- Calculate PGY level dynamically based on class year and evaluation date
CREATE OR REPLACE FUNCTION calculate_pgy_level(
  p_class_id UUID,
  evaluation_date DATE DEFAULT CURRENT_DATE
) RETURNS TEXT AS $$
DECLARE
  v_class_year INTEGER;
  current_academic_year INTEGER;
  years_to_graduation INTEGER;
  pgy_level INTEGER;
BEGIN
  -- Get class year from academic_classes
  SELECT EXTRACT(YEAR FROM graduation_date) INTO v_class_year
  FROM public.academic_classes
  WHERE id = p_class_id;
  
  IF v_class_year IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Academic year starts July 1
  current_academic_year := CASE 
    WHEN EXTRACT(MONTH FROM evaluation_date) >= 7 
    THEN EXTRACT(YEAR FROM evaluation_date)
    ELSE EXTRACT(YEAR FROM evaluation_date) - 1
  END;
  
  years_to_graduation := v_class_year - current_academic_year;
  pgy_level := 4 - years_to_graduation; -- For 3-year program (adjust to 5 for 4-year)
  
  -- Bounds checking
  IF pgy_level < 1 OR pgy_level > 4 THEN
    RETURN NULL;
  END IF;
  
  RETURN 'PGY-' || pgy_level;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Determine period (Fall/Spring) based on PGY level and evaluation date
CREATE OR REPLACE FUNCTION determine_period(
  pgy_level TEXT,
  evaluation_date DATE
) RETURNS TEXT AS $$
DECLARE
  month_num INTEGER;
BEGIN
  month_num := EXTRACT(MONTH FROM evaluation_date);
  
  CASE pgy_level
    WHEN 'PGY-1' THEN
      -- Fall: 6/1-11/30, Spring: 12/1-5/31
      IF month_num BETWEEN 6 AND 11 THEN
        RETURN 'Fall';
      ELSE
        RETURN 'Spring';
      END IF;
    
    WHEN 'PGY-2' THEN
      -- Fall: 5/1-10/31, Spring: 11/1-4/30
      IF month_num BETWEEN 5 AND 10 THEN
        RETURN 'Fall';
      ELSE
        RETURN 'Spring';
      END IF;
    
    WHEN 'PGY-3' THEN
      -- Fall: 4/1-9/30, Spring: 10/1-3/31
      IF month_num BETWEEN 4 AND 9 THEN
        RETURN 'Fall';
      ELSE
        RETURN 'Spring';
      END IF;
    
    WHEN 'PGY-4' THEN
      -- Fall: 3/1-8/31, Spring: 9/1-2/28
      IF month_num BETWEEN 3 AND 8 THEN
        RETURN 'Fall';
      ELSE
        RETURN 'Spring';
      END IF;
    
    ELSE
      RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 3. IMPORTED COMMENTS (Historical MedHub evaluations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.imported_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source data (from MedHub export)
  date_completed DATE NOT NULL,
  evaluatee TEXT NOT NULL,
  evaluation_type TEXT NOT NULL,
  question_type TEXT,
  question TEXT,
  comment_text TEXT NOT NULL,
  
  -- Linked entities (resolved during import)
  resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  evaluator_name TEXT,
  evaluator_role TEXT CHECK (evaluator_role IN ('core_faculty', 'teaching_faculty', 'peer', 'self', 'unknown')),
  
  -- Rotation context (auto-determined from rotation_types)
  rotation_type_id UUID REFERENCES public.rotation_types(id) ON DELETE SET NULL,
  rotation_category TEXT,
  rotation_name TEXT,
  site_code TEXT,
  
  -- Computed period info
  pgy_level TEXT,
  period TEXT,
  period_label TEXT,
  
  -- AI Analysis Results (IMMUTABLE after generation)
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
  ai_sentiment_score NUMERIC(3,2),
  
  -- EQ Scores (0.00 to 5.00)
  ai_eq_empathy NUMERIC(3,2),
  ai_eq_adaptability NUMERIC(3,2),
  ai_eq_stress_mgmt NUMERIC(3,2),
  ai_eq_curiosity NUMERIC(3,2),
  ai_eq_communication NUMERIC(3,2),
  ai_eq_avg NUMERIC(3,2),
  
  -- PQ Scores (0.00 to 5.00)
  ai_pq_work_ethic NUMERIC(3,2),
  ai_pq_integrity NUMERIC(3,2),
  ai_pq_teachability NUMERIC(3,2),
  ai_pq_documentation NUMERIC(3,2),
  ai_pq_leadership NUMERIC(3,2),
  ai_pq_avg NUMERIC(3,2),
  
  -- IQ Scores (0.00 to 5.00)
  ai_iq_knowledge NUMERIC(3,2),
  ai_iq_analytical NUMERIC(3,2),
  ai_iq_learning NUMERIC(3,2),
  ai_iq_flexibility NUMERIC(3,2),
  ai_iq_performance NUMERIC(3,2),
  ai_iq_avg NUMERIC(3,2),
  
  -- Impact Factors
  ai_eq_impact TEXT CHECK (ai_eq_impact IN ('low', 'moderate', 'high')),
  ai_pq_impact TEXT CHECK (ai_pq_impact IN ('low', 'moderate', 'high')),
  ai_iq_impact TEXT CHECK (ai_iq_impact IN ('low', 'moderate', 'high')),
  
  -- AI Metadata
  ai_key_themes JSONB,
  ai_confidence NUMERIC(3,2),
  ai_analysis_date TIMESTAMPTZ,
  ai_model_version TEXT DEFAULT 'claude-sonnet-4-20250514',
  
  -- Status
  is_analyzed BOOLEAN DEFAULT FALSE,
  analysis_error TEXT,
  
  -- Import metadata
  import_batch_id UUID,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_imported_comments_resident ON public.imported_comments(resident_id);
CREATE INDEX IF NOT EXISTS idx_imported_comments_period ON public.imported_comments(resident_id, period_label);
CREATE INDEX IF NOT EXISTS idx_imported_comments_date ON public.imported_comments(date_completed);
CREATE INDEX IF NOT EXISTS idx_imported_comments_analyzed ON public.imported_comments(is_analyzed) WHERE is_analyzed = FALSE;
CREATE INDEX IF NOT EXISTS idx_imported_comments_impact ON public.imported_comments(resident_id) 
  WHERE ai_eq_impact = 'high' OR ai_pq_impact = 'high' OR ai_iq_impact = 'high';

-- ============================================================================
-- 4. STRUCTURED RATINGS (New Lev8 form submissions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.structured_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who & When
  resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE NOT NULL,
  rater_type TEXT NOT NULL CHECK (rater_type IN ('faculty', 'self')),
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  
  -- Period context
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pgy_level TEXT,
  period TEXT,
  period_label TEXT,
  
  -- EQ Attributes (1.0 to 5.0, 0.5 increments)
  eq_empathy_positive_interactions NUMERIC(2,1) CHECK (eq_empathy_positive_interactions BETWEEN 1.0 AND 5.0),
  eq_adaptability_self_awareness NUMERIC(2,1) CHECK (eq_adaptability_self_awareness BETWEEN 1.0 AND 5.0),
  eq_stress_management_resilience NUMERIC(2,1) CHECK (eq_stress_management_resilience BETWEEN 1.0 AND 5.0),
  eq_curiosity_growth_mindset NUMERIC(2,1) CHECK (eq_curiosity_growth_mindset BETWEEN 1.0 AND 5.0),
  eq_effectiveness_communication NUMERIC(2,1) CHECK (eq_effectiveness_communication BETWEEN 1.0 AND 5.0),
  
  -- PQ Attributes
  pq_work_ethic_reliability NUMERIC(2,1) CHECK (pq_work_ethic_reliability BETWEEN 1.0 AND 5.0),
  pq_integrity_accountability NUMERIC(2,1) CHECK (pq_integrity_accountability BETWEEN 1.0 AND 5.0),
  pq_teachability_receptiveness NUMERIC(2,1) CHECK (pq_teachability_receptiveness BETWEEN 1.0 AND 5.0),
  pq_documentation NUMERIC(2,1) CHECK (pq_documentation BETWEEN 1.0 AND 5.0),
  pq_leadership_relationships NUMERIC(2,1) CHECK (pq_leadership_relationships BETWEEN 1.0 AND 5.0),
  
  -- IQ Attributes
  iq_knowledge_base NUMERIC(2,1) CHECK (iq_knowledge_base BETWEEN 1.0 AND 5.0),
  iq_analytical_thinking NUMERIC(2,1) CHECK (iq_analytical_thinking BETWEEN 1.0 AND 5.0),
  iq_commitment_learning NUMERIC(2,1) CHECK (iq_commitment_learning BETWEEN 1.0 AND 5.0),
  iq_clinical_flexibility NUMERIC(2,1) CHECK (iq_clinical_flexibility BETWEEN 1.0 AND 5.0),
  iq_performance_for_level NUMERIC(2,1) CHECK (iq_performance_for_level BETWEEN 1.0 AND 5.0),
  
  -- Computed averages (populated by trigger)
  eq_avg NUMERIC(3,2),
  pq_avg NUMERIC(3,2),
  iq_avg NUMERIC(3,2),
  
  -- Optional free-text (ONLY for self-assessments)
  concerns_goals TEXT,
  
  -- Metadata
  form_submission_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_structured_ratings_resident ON public.structured_ratings(resident_id);
CREATE INDEX IF NOT EXISTS idx_structured_ratings_period ON public.structured_ratings(resident_id, period_label);
CREATE INDEX IF NOT EXISTS idx_structured_ratings_rater ON public.structured_ratings(rater_type);

-- Trigger to auto-calculate averages
CREATE OR REPLACE FUNCTION calculate_rating_averages()
RETURNS TRIGGER AS $$
BEGIN
  NEW.eq_avg := (
    COALESCE(NEW.eq_empathy_positive_interactions, 0) +
    COALESCE(NEW.eq_adaptability_self_awareness, 0) +
    COALESCE(NEW.eq_stress_management_resilience, 0) +
    COALESCE(NEW.eq_curiosity_growth_mindset, 0) +
    COALESCE(NEW.eq_effectiveness_communication, 0)
  ) / 5.0;
  
  NEW.pq_avg := (
    COALESCE(NEW.pq_work_ethic_reliability, 0) +
    COALESCE(NEW.pq_integrity_accountability, 0) +
    COALESCE(NEW.pq_teachability_receptiveness, 0) +
    COALESCE(NEW.pq_documentation, 0) +
    COALESCE(NEW.pq_leadership_relationships, 0)
  ) / 5.0;
  
  NEW.iq_avg := (
    COALESCE(NEW.iq_knowledge_base, 0) +
    COALESCE(NEW.iq_analytical_thinking, 0) +
    COALESCE(NEW.iq_commitment_learning, 0) +
    COALESCE(NEW.iq_clinical_flexibility, 0) +
    COALESCE(NEW.iq_performance_for_level, 0)
  ) / 5.0;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_rating_averages
  BEFORE INSERT OR UPDATE ON public.structured_ratings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_rating_averages();

-- ============================================================================
-- 5. PERIOD SCORES (Aggregated analytics per period)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.period_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE NOT NULL,
  period_label TEXT NOT NULL,
  
  -- FROM STRUCTURED RATINGS (Faculty averages)
  faculty_eq_avg NUMERIC(3,2),
  faculty_pq_avg NUMERIC(3,2),
  faculty_iq_avg NUMERIC(3,2),
  faculty_n_raters INTEGER,
  faculty_ratings_detail JSONB,
  
  -- FROM STRUCTURED RATINGS (Self-assessment)
  self_eq_avg NUMERIC(3,2),
  self_pq_avg NUMERIC(3,2),
  self_iq_avg NUMERIC(3,2),
  self_ratings_detail JSONB,
  
  -- FROM AI ANALYSIS OF IMPORTED COMMENTS
  ai_eq_avg NUMERIC(3,2),
  ai_pq_avg NUMERIC(3,2),
  ai_iq_avg NUMERIC(3,2),
  ai_n_comments INTEGER,
  ai_confidence_avg NUMERIC(3,2),
  
  -- GAP ANALYSIS
  self_faculty_gap_eq NUMERIC(3,2),
  self_faculty_gap_pq NUMERIC(3,2),
  self_faculty_gap_iq NUMERIC(3,2),
  
  -- ITE DATA (if available for this period)
  ite_raw_score INTEGER,
  ite_percentile NUMERIC(5,2),
  ite_test_date DATE,
  
  -- Metadata
  analysis_version TEXT DEFAULT 'v1.0',
  is_current BOOLEAN DEFAULT TRUE,
  replaced_by UUID REFERENCES public.period_scores(id) ON DELETE SET NULL,
  replaced_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(resident_id, period_label, analysis_version)
);

CREATE INDEX IF NOT EXISTS idx_period_scores_resident ON public.period_scores(resident_id);
CREATE INDEX IF NOT EXISTS idx_period_scores_current ON public.period_scores(resident_id, is_current) WHERE is_current = TRUE;

-- ============================================================================
-- 6. SWOT SUMMARIES (AI-generated SWOT analysis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.swot_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE NOT NULL,
  period_label TEXT NOT NULL,
  
  -- SWOT content (each is an array of objects)
  strengths JSONB NOT NULL DEFAULT '[]',
  weaknesses JSONB NOT NULL DEFAULT '[]',
  opportunities JSONB NOT NULL DEFAULT '[]',
  threats JSONB NOT NULL DEFAULT '[]',
  
  -- Metadata
  n_comments_analyzed INTEGER NOT NULL,
  ai_confidence NUMERIC(3,2),
  ai_model_version TEXT DEFAULT 'claude-sonnet-4-20250514',
  
  -- Version control (IMMUTABLE)
  analysis_version TEXT DEFAULT 'v1.0',
  is_current BOOLEAN DEFAULT TRUE,
  replaced_by UUID REFERENCES public.swot_summaries(id) ON DELETE SET NULL,
  replaced_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(resident_id, period_label, analysis_version)
);

CREATE INDEX IF NOT EXISTS idx_swot_resident ON public.swot_summaries(resident_id);
CREATE INDEX IF NOT EXISTS idx_swot_current ON public.swot_summaries(resident_id, is_current) WHERE is_current = TRUE;

-- ============================================================================
-- 7. ITE SCORES (In-Training Examination tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ite_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE NOT NULL,
  
  -- Test info
  test_date DATE NOT NULL,
  academic_year TEXT NOT NULL,
  pgy_level TEXT NOT NULL,
  
  -- Scores
  raw_score INTEGER,
  percentile NUMERIC(5,2),
  
  -- Metadata
  entered_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(resident_id, test_date)
);

CREATE INDEX IF NOT EXISTS idx_ite_resident ON public.ite_scores(resident_id);
CREATE INDEX IF NOT EXISTS idx_ite_year ON public.ite_scores(academic_year);
CREATE INDEX IF NOT EXISTS idx_ite_pgy ON public.ite_scores(pgy_level);

-- ============================================================================
-- 8. ROSH COMPLETION SNAPSHOTS (Time-series study progress tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rosh_completion_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who and when
  resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE NOT NULL,
  snapshot_date DATE NOT NULL,
  
  -- Completion data
  completion_percentage NUMERIC(5,2) NOT NULL CHECK (completion_percentage BETWEEN 0 AND 100),
  
  -- Context
  pgy_level TEXT NOT NULL,
  class_year INTEGER NOT NULL,
  
  -- Optional metadata
  notes TEXT,
  entered_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate entries for same resident on same date
  UNIQUE(resident_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_rosh_snapshots_date ON public.rosh_completion_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_rosh_snapshots_resident ON public.rosh_completion_snapshots(resident_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_rosh_snapshots_class ON public.rosh_completion_snapshots(class_year, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_rosh_snapshots_pgy ON public.rosh_completion_snapshots(pgy_level, snapshot_date);

-- View for latest snapshot per resident
CREATE VIEW rosh_completion_latest AS
SELECT DISTINCT ON (resident_id) 
  rs.*,
  up.full_name
FROM public.rosh_completion_snapshots rs
JOIN public.residents r ON rs.resident_id = r.id
JOIN public.user_profiles up ON r.user_id = up.id
ORDER BY rs.resident_id, rs.snapshot_date DESC;

-- View for class averages by snapshot date
CREATE VIEW rosh_class_averages AS
SELECT 
  snapshot_date,
  class_year,
  pgy_level,
  AVG(completion_percentage) as avg_completion,
  STDDEV(completion_percentage) as stddev_completion,
  COUNT(*) as n_residents,
  MIN(completion_percentage) as min_completion,
  MAX(completion_percentage) as max_completion
FROM public.rosh_completion_snapshots
GROUP BY snapshot_date, class_year, pgy_level
ORDER BY snapshot_date DESC, class_year;

-- ============================================================================
-- 9. FORM TOKENS (Public form access tokens)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.form_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  form_type TEXT NOT NULL CHECK (form_type IN ('faculty_evaluation', 'self_assessment')),
  
  -- Context
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE,
  
  -- Validity
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Tracking
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_tokens_token ON public.form_tokens(token);
CREATE INDEX IF NOT EXISTS idx_form_tokens_valid ON public.form_tokens(is_active, valid_until) WHERE is_active = TRUE;

-- ============================================================================
-- 10. FACULTY ANNOTATIONS (Quality control annotations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.faculty_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What's being annotated
  target_type TEXT NOT NULL CHECK (target_type IN ('period_score', 'swot_summary', 'imported_comment')),
  target_id UUID NOT NULL,
  
  -- Who annotated
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE NOT NULL,
  
  -- Annotation details
  annotation_type TEXT NOT NULL CHECK (annotation_type IN (
    'ai_misinterpretation',
    'missing_context',
    'additional_note',
    'score_adjustment_request',
    'reprocessing_needed'
  )),
  
  comment TEXT NOT NULL,
  affected_attribute TEXT,
  suggested_correction JSONB,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_annotations_target ON public.faculty_annotations(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_annotations_faculty ON public.faculty_annotations(faculty_id);
CREATE INDEX IF NOT EXISTS idx_annotations_status ON public.faculty_annotations(status) WHERE status = 'open';

-- ============================================================================
-- TRIGGERS for updated_at
-- ============================================================================
CREATE TRIGGER update_rotation_types_updated_at BEFORE UPDATE ON public.rotation_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imported_comments_updated_at BEFORE UPDATE ON public.imported_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_structured_ratings_updated_at BEFORE UPDATE ON public.structured_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_period_scores_updated_at BEFORE UPDATE ON public.period_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swot_summaries_updated_at BEFORE UPDATE ON public.swot_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ite_scores_updated_at BEFORE UPDATE ON public.ite_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rosh_snapshots_updated_at BEFORE UPDATE ON public.rosh_completion_snapshots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_tokens_updated_at BEFORE UPDATE ON public.form_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faculty_annotations_updated_at BEFORE UPDATE ON public.faculty_annotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



