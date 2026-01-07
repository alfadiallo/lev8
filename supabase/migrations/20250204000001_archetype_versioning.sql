-- ============================================================
-- ITE Archetype Evolution & Versioning Schema v3
-- Memorial Healthcare System
-- Migration: 20250204000001_archetype_versioning.sql
-- ============================================================

-- ============================================================
-- 1. METHODOLOGY VERSIONS TABLE
-- Stores each version of the archetype methodology
-- ============================================================

CREATE TABLE IF NOT EXISTS public.archetype_methodology_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Version identification
  version TEXT NOT NULL UNIQUE,           -- "1.0.0", "1.1.0", etc.
  name TEXT NOT NULL,                      -- "Memorial Baseline"
  
  -- Lifecycle
  effective_date DATE NOT NULL,
  retired_date DATE,                       -- NULL if currently active
  is_current BOOLEAN DEFAULT FALSE,
  
  -- What changed
  changelog JSONB NOT NULL DEFAULT '[]',   -- Array of change descriptions
  
  -- Statistical basis
  based_on_residents INT NOT NULL,
  based_on_classes INT[] NOT NULL,         -- Array of graduation years
  
  -- Validation metrics (populated after outcomes known)
  accuracy_rate DECIMAL(4,3),              -- e.g., 0.85 for 85%
  inter_rater_agreement DECIMAL(4,3),
  
  -- The actual archetype definitions at this version
  archetypes JSONB NOT NULL,               -- Full archetype definitions
  
  -- Metadata
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one current version
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_current_version 
  ON public.archetype_methodology_versions(is_current) 
  WHERE is_current = TRUE;

-- ============================================================
-- 2. RESIDENT CLASSIFICATIONS TABLE (Enhanced)
-- Tracks both original and current classification
-- ============================================================

CREATE TABLE IF NOT EXISTS public.resident_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  
  -- The immutable scores (snapshot at time of classification)
  pgy1_percentile DECIMAL(5,2),
  pgy2_percentile DECIMAL(5,2),
  pgy3_percentile DECIMAL(5,2),
  
  -- Computed deltas
  delta_12 DECIMAL(5,2),  -- PGY2 - PGY1
  delta_23 DECIMAL(5,2),  -- PGY3 - PGY2
  delta_total DECIMAL(5,2), -- PGY3 - PGY1
  
  -- How many years of data available
  data_years INT NOT NULL DEFAULT 0,
  
  -- ============================================================
  -- ORIGINAL CLASSIFICATION (IMMUTABLE)
  -- Never changes once set - represents first classification
  -- ============================================================
  original_archetype_id TEXT NOT NULL,
  original_archetype_name TEXT NOT NULL,
  original_confidence DECIMAL(4,3) NOT NULL,
  original_risk_level TEXT CHECK (original_risk_level IN ('Low', 'Moderate', 'High')),
  original_is_provisional BOOLEAN DEFAULT FALSE,
  original_methodology_version TEXT NOT NULL,
  original_classified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  original_classified_by TEXT NOT NULL DEFAULT 'system',  -- 'system' or user_id
  original_note TEXT,
  
  -- ============================================================
  -- CURRENT CLASSIFICATION (MUTABLE)
  -- Updated when methodology evolves or faculty overrides
  -- ============================================================
  current_archetype_id TEXT NOT NULL,
  current_archetype_name TEXT NOT NULL,
  current_confidence DECIMAL(4,3) NOT NULL,
  current_risk_level TEXT CHECK (current_risk_level IN ('Low', 'Moderate', 'High')),
  current_is_provisional BOOLEAN DEFAULT FALSE,
  current_methodology_version TEXT NOT NULL,
  current_last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_note TEXT,
  
  -- Recommendations for this classification
  recommendations JSONB DEFAULT '[]',
  
  -- Alternative archetypes considered
  alternatives JSONB DEFAULT '[]',
  
  -- ============================================================
  -- SIMILAR RESIDENTS (Cached)
  -- ============================================================
  similar_residents JSONB DEFAULT '[]',
  
  -- ============================================================
  -- DRIFT TRACKING
  -- ============================================================
  has_version_drift BOOLEAN DEFAULT FALSE,    -- TRUE if original != current archetype
  drift_reason TEXT,                          -- 'methodology_update', 'faculty_override', 'new_score', etc.
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(resident_id)
);

-- Index for drift analysis
CREATE INDEX IF NOT EXISTS idx_classifications_drift ON public.resident_classifications(has_version_drift) WHERE has_version_drift = TRUE;
CREATE INDEX IF NOT EXISTS idx_classifications_resident ON public.resident_classifications(resident_id);
CREATE INDEX IF NOT EXISTS idx_classifications_archetype ON public.resident_classifications(current_archetype_id);

-- ============================================================
-- 3. CLASSIFICATION HISTORY TABLE
-- Audit trail of all classification changes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.classification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classification_id UUID NOT NULL REFERENCES public.resident_classifications(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  
  -- What was the classification
  archetype_id TEXT NOT NULL,
  archetype_name TEXT NOT NULL,
  confidence DECIMAL(4,3) NOT NULL,
  risk_level TEXT,
  is_provisional BOOLEAN DEFAULT FALSE,
  methodology_version TEXT NOT NULL,
  
  -- Scores at time of this classification
  pgy1_percentile DECIMAL(5,2),
  pgy2_percentile DECIMAL(5,2),
  pgy3_percentile DECIMAL(5,2),
  data_years INT,
  
  -- Why did this change happen
  trigger TEXT NOT NULL CHECK (trigger IN (
    'initial',              -- First classification
    'pgy2_score_added',     -- PGY2 score triggered reclassification
    'pgy3_score_added',     -- PGY3 score triggered reclassification
    'methodology_update',   -- New methodology version applied
    'faculty_override',     -- Faculty manually changed
    'retrospective_analysis' -- Re-run for comparison only (not live)
  )),
  
  -- Who/what made the change
  triggered_by TEXT,        -- 'system', user_id, or version number
  notes TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for history queries
CREATE INDEX IF NOT EXISTS idx_history_resident ON public.classification_history(resident_id);
CREATE INDEX IF NOT EXISTS idx_history_classification ON public.classification_history(classification_id);

-- ============================================================
-- 4. EVOLUTION TRIGGERS TABLE
-- Tracks when the system suggests methodology review
-- ============================================================

CREATE TABLE IF NOT EXISTS public.evolution_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Trigger details
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'annual_review',        -- After each class graduates
    'threshold_breach',     -- Variable rate too high, etc.
    'pattern_discovery',    -- New pattern detected in Variable cases
    'outcome_feedback'      -- Board results suggest risk level changes
  )),
  
  details TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  
  -- Supporting data
  affected_residents UUID[],
  supporting_metrics JSONB,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'pending',              -- Awaiting review
    'under_review',         -- Being analyzed
    'implemented',          -- Changes made to methodology
    'dismissed'             -- Reviewed but no action taken
  )) DEFAULT 'pending',
  
  -- Resolution
  resolution_notes TEXT,
  resolved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resulting_version TEXT,   -- If implemented, which version was created
  
  -- Timestamps
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_triggers_status ON public.evolution_triggers(status);

-- ============================================================
-- 5. PATTERN CLUSTERS TABLE
-- Tracks emerging patterns in Variable cases
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pattern_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cluster characteristics
  delta12_bucket INT NOT NULL,              -- Rounded to nearest 10
  delta23_bucket INT NOT NULL,
  suggested_name TEXT,
  
  -- Members
  resident_ids UUID[] NOT NULL,
  member_count INT NOT NULL,
  
  -- Centroid
  avg_pgy1 DECIMAL(5,2),
  avg_pgy2 DECIMAL(5,2),
  avg_pgy3 DECIMAL(5,2),
  avg_delta12 DECIMAL(5,2),
  avg_delta23 DECIMAL(5,2),
  
  -- Status
  status TEXT CHECK (status IN (
    'detected',             -- Just found
    'under_review',         -- Being evaluated
    'promoted',             -- Became new archetype
    'dismissed'             -- Not worth tracking
  )) DEFAULT 'detected',
  
  -- If promoted, link to new archetype
  promoted_to_archetype TEXT,
  promoted_in_version TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. CLASSIFICATION OUTCOMES TABLE
-- Links board results to classifications for validation
-- ============================================================

CREATE TABLE IF NOT EXISTS public.classification_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  classification_id UUID REFERENCES public.resident_classifications(id) ON DELETE SET NULL,
  
  -- Board outcomes
  passed_boards BOOLEAN,
  board_score INT,
  attempts INT DEFAULT 1,
  
  -- Career outcome
  career_path TEXT,         -- Fellowship, community practice, etc.
  
  -- Archetype at time of outcome
  archetype_at_outcome TEXT NOT NULL,
  methodology_version_at_outcome TEXT NOT NULL,
  
  -- Validation flag
  archetype_was_predictive BOOLEAN,  -- Did risk level match outcome?
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outcomes_resident ON public.classification_outcomes(resident_id);

-- ============================================================
-- 7. VIEWS
-- ============================================================

-- View: Version comparison for a resident
CREATE OR REPLACE VIEW public.resident_version_comparison AS
SELECT 
  rc.resident_id,
  up.full_name AS resident_name,
  c.graduation_year,
  rc.pgy1_percentile,
  rc.pgy2_percentile,
  rc.pgy3_percentile,
  rc.data_years,
  rc.original_archetype_name AS original_archetype,
  rc.original_methodology_version AS original_version,
  rc.original_is_provisional,
  rc.current_archetype_name AS current_archetype,
  rc.current_methodology_version AS current_version,
  rc.current_is_provisional,
  rc.has_version_drift,
  rc.drift_reason,
  rc.recommendations,
  CASE 
    WHEN rc.has_version_drift THEN 
      'Changed from "' || rc.original_archetype_name || '" to "' || rc.current_archetype_name || '"'
    ELSE 
      'Consistent across versions'
  END AS drift_summary
FROM public.resident_classifications rc
JOIN public.residents r ON rc.resident_id = r.id
JOIN public.user_profiles up ON r.user_id = up.id
LEFT JOIN public.classes c ON r.class_id = c.id;

-- View: Methodology evolution summary
CREATE OR REPLACE VIEW public.methodology_evolution_summary AS
SELECT 
  v.version,
  v.name,
  v.effective_date,
  v.retired_date,
  v.is_current,
  v.based_on_residents,
  v.based_on_classes,
  v.accuracy_rate,
  jsonb_array_length(v.changelog) AS changes_count,
  jsonb_array_length(v.archetypes) AS archetypes_count,
  (
    SELECT COUNT(*) 
    FROM public.resident_classifications rc 
    WHERE rc.current_methodology_version = v.version
  ) AS residents_classified
FROM public.archetype_methodology_versions v
ORDER BY v.effective_date DESC;

-- View: Evolution trigger dashboard
CREATE OR REPLACE VIEW public.pending_evolution_triggers AS
SELECT 
  et.id,
  et.trigger_type,
  et.details,
  et.recommendation,
  et.status,
  et.triggered_at,
  array_length(et.affected_residents, 1) AS affected_count,
  EXTRACT(DAY FROM NOW() - et.triggered_at) AS days_pending
FROM public.evolution_triggers et
WHERE et.status IN ('pending', 'under_review')
ORDER BY et.triggered_at;

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.archetype_methodology_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classification_outcomes ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users
CREATE POLICY "Allow read access for authenticated users" ON public.archetype_methodology_versions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON public.resident_classifications
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON public.classification_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON public.evolution_triggers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON public.pattern_clusters
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON public.classification_outcomes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Write access for authenticated users (classifications, history)
CREATE POLICY "Allow insert/update for authenticated users" ON public.resident_classifications
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON public.classification_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 9. TRIGGERS
-- ============================================================

-- Trigger: Log classification changes to history
CREATE OR REPLACE FUNCTION public.log_classification_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if archetype actually changed
  IF OLD.current_archetype_id IS DISTINCT FROM NEW.current_archetype_id THEN
    INSERT INTO public.classification_history (
      classification_id,
      resident_id,
      archetype_id,
      archetype_name,
      confidence,
      risk_level,
      is_provisional,
      methodology_version,
      pgy1_percentile,
      pgy2_percentile,
      pgy3_percentile,
      data_years,
      trigger,
      triggered_by
    ) VALUES (
      NEW.id,
      NEW.resident_id,
      NEW.current_archetype_id,
      NEW.current_archetype_name,
      NEW.current_confidence,
      NEW.current_risk_level,
      NEW.current_is_provisional,
      NEW.current_methodology_version,
      NEW.pgy1_percentile,
      NEW.pgy2_percentile,
      NEW.pgy3_percentile,
      NEW.data_years,
      CASE 
        WHEN NEW.current_methodology_version != OLD.current_methodology_version THEN 'methodology_update'
        WHEN NEW.data_years > OLD.data_years THEN 
          CASE NEW.data_years
            WHEN 2 THEN 'pgy2_score_added'
            WHEN 3 THEN 'pgy3_score_added'
            ELSE 'methodology_update'
          END
        ELSE 'faculty_override'
      END,
      'system'
    );
    
    -- Update drift tracking
    NEW.has_version_drift := (NEW.current_archetype_id != NEW.original_archetype_id);
    NEW.drift_reason := CASE 
      WHEN NEW.current_methodology_version != OLD.current_methodology_version THEN 'methodology_update'
      WHEN NEW.data_years > OLD.data_years THEN 'new_score'
      ELSE 'faculty_override'
    END;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_classification_update ON public.resident_classifications;
CREATE TRIGGER on_classification_update
  BEFORE UPDATE ON public.resident_classifications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_classification_change();

-- Trigger: Update is_current flag when new version added
CREATE OR REPLACE FUNCTION public.update_current_version_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = TRUE THEN
    UPDATE public.archetype_methodology_versions
    SET is_current = FALSE, retired_date = NEW.effective_date
    WHERE is_current = TRUE AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_methodology_version ON public.archetype_methodology_versions;
CREATE TRIGGER on_new_methodology_version
  BEFORE INSERT ON public.archetype_methodology_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_current_version_flag();

-- ============================================================
-- 10. SEED INITIAL METHODOLOGY VERSION
-- ============================================================

INSERT INTO public.archetype_methodology_versions (
  version, name, effective_date, is_current, changelog,
  based_on_residents, based_on_classes, archetypes
) VALUES (
  '1.0.0',
  'Memorial Baseline',
  '2025-01-15',
  TRUE,
  '["Initial release based on Classes 2024-2025", "9 base archetypes defined", "Thresholds set from 20-resident sample"]'::jsonb,
  20,
  ARRAY[2024, 2025],
  '[
    {"id": "elite_performer", "name": "Elite Performer", "riskLevel": "Low", "color": "#1ABC9C", "description": "Started elite (85%+), maintained elite through PGY2 (85%+), ended above average (50%+)", "criteria": {"pgy1": {"min": 85}, "pgy2": {"min": 85}, "pgy3": {"min": 50}}, "exemplars": ["Matthew Bidwell", "Jesse Shulman", "Steven Gayda"], "recommendations": ["Consider for leadership opportunities", "Discuss fellowship interests", "Potential teaching/mentorship role"]},
    {"id": "elite_late_struggle", "name": "Elite → Late Struggle", "riskLevel": "Moderate", "color": "#E67E22", "description": "Started elite, maintained through PGY2, but significant PGY3 decline (<50%)", "criteria": {"pgy1": {"min": 75}, "pgy2": {"min": 80}, "pgy3": {"max": 50}}, "exemplars": ["Daniel Levi", "Rolando Zamora", "Eduardo Diaz"], "recommendations": ["Investigate PGY3 performance drop factors", "Assess burnout or external stressors", "Consider board prep resources", "Schedule check-in meetings"]},
    {"id": "breakthrough_performer", "name": "Breakthrough Performer", "riskLevel": "Low", "color": "#3498DB", "description": "Major improvement PGY1→PGY2 (+25 pts), sustained at PGY3 (70%+)", "criteria": {"delta12": {"min": 25}, "pgy3": {"min": 70}}, "exemplars": ["Joris Hoogendoorn", "Sebastian Fresquet"], "recommendations": ["Document what strategies worked for improvement", "Consider peer mentorship role", "Strong momentum - maintain engagement"]},
    {"id": "peak_decline", "name": "Peak & Decline", "riskLevel": "High", "color": "#E74C3C", "description": "Improved PGY1→PGY2 (+10pts), then significant PGY3 drop (-30pts)", "criteria": {"delta12": {"min": 10}, "delta23": {"max": -30}}, "exemplars": ["Kevin Abadi", "Francisca Aguilar", "Sarah Eldin"], "recommendations": ["URGENT: Schedule PD meeting", "Assess for burnout or personal issues", "Board prep support critical", "Consider tutoring resources", "Weekly check-ins recommended"]},
    {"id": "sophomore_slump_recovery", "name": "Sophomore Slump → Strong Recovery", "riskLevel": "Low", "color": "#F39C12", "description": "Dropped at PGY2 (-15pts), then strong PGY3 recovery (+40pts)", "criteria": {"delta12": {"max": -15}, "delta23": {"min": 40}}, "exemplars": ["Sara Greenwald", "Ambika Shivarajpur"], "recommendations": ["Reassure - strong recovery pattern demonstrated", "Document what drove PGY3 success", "Connect with current PGY2s showing similar PGY2 dip"]},
    {"id": "late_bloomer", "name": "Late Bloomer", "riskLevel": "Low", "color": "#9B59B6", "description": "Low start (≤40%), gradual or late improvement through PGY3", "criteria": {"pgy1": {"max": 40}, "delta23": {"min": 15}}, "exemplars": ["Hadley Modeen", "Larissa Tavares", "Jennifer Truong"], "recommendations": ["Positive trajectory - encourage continuation", "Many late bloomers accelerate further", "Continue current support approach"]},
    {"id": "steady_climber", "name": "Steady Climber", "riskLevel": "Low", "color": "#27AE60", "description": "Consistent improvement each year (positive deltas)", "criteria": {"delta12": {"min": 0}, "delta23": {"min": 0}, "deltaTotal": {"min": 10}}, "exemplars": ["Carly Whittaker"], "recommendations": ["Positive consistent trajectory", "Continue current approach", "May benefit from stretch goals"]},
    {"id": "continuous_decline", "name": "Continuous Decline", "riskLevel": "High", "color": "#C0392B", "description": "Declining trajectory each year (negative deltas)", "criteria": {"delta12": {"max": 0}, "delta23": {"max": 0}, "deltaTotal": {"max": -20}}, "exemplars": ["Nadine Ajami"], "recommendations": ["URGENT: Intensive support needed", "Weekly check-ins mandatory", "Assign dedicated mentor", "Assess for underlying issues", "Board prep intervention critical"]},
    {"id": "variable", "name": "Variable", "riskLevel": "Moderate", "color": "#7F8C8D", "description": "Pattern does not fit standard archetypes - unique trajectory", "criteria": {}, "exemplars": ["Ryan Kelly", "Jalyn Joseph"], "recommendations": ["Monitor trajectory closely", "Individualized approach needed", "Document unique factors"]}
  ]'::jsonb
) ON CONFLICT (version) DO NOTHING;




