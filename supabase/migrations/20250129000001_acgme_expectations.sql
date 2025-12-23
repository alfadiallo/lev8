-- ACGME Expectations Module Migration
-- Creates tables for ACGME compliance tracking and management
-- Part of the "Expectations" pillar for program leadership

-- ============================================================================
-- 1. ACGME REQUIREMENTS CATALOG
-- Master list of all ACGME requirements (imported from JSON catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.acgme_requirements (
  id TEXT PRIMARY KEY, -- e.g., "CPR-1.1", "CPR-2.3.a"
  scope TEXT NOT NULL CHECK (scope IN ('UNIVERSAL', 'EM_SPECIFIC', 'FELLOWSHIP')),
  section TEXT NOT NULL, -- e.g., "1", "2", "3"
  category TEXT NOT NULL, -- e.g., "Oversight", "Personnel", "Curriculum"
  title TEXT NOT NULL,
  text TEXT NOT NULL, -- Full requirement text
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Critical', 'High', 'Medium', 'Low')),
  owner TEXT NOT NULL CHECK (owner IN ('DIO', 'PD', 'PC', 'APD', 'Faculty', 'Resident')),
  compliance_logic TEXT, -- Optional: automated compliance check logic
  evidence_needed TEXT, -- What evidence demonstrates compliance
  source_file TEXT, -- Original source document
  parent_id TEXT REFERENCES public.acgme_requirements(id), -- For sub-requirements
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acgme_requirements_scope ON public.acgme_requirements(scope);
CREATE INDEX IF NOT EXISTS idx_acgme_requirements_section ON public.acgme_requirements(section);
CREATE INDEX IF NOT EXISTS idx_acgme_requirements_category ON public.acgme_requirements(category);
CREATE INDEX IF NOT EXISTS idx_acgme_requirements_risk ON public.acgme_requirements(risk_level);
CREATE INDEX IF NOT EXISTS idx_acgme_requirements_owner ON public.acgme_requirements(owner);

-- ============================================================================
-- 2. PROGRAM COMPLIANCE STATUS
-- Tracks each program's compliance status for each requirement
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.acgme_compliance_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  requirement_id TEXT NOT NULL REFERENCES public.acgme_requirements(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('compliant', 'at_risk', 'non_compliant', 'not_assessed', 'not_applicable')),
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_review_date DATE,
  assessed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(program_id, requirement_id)
);

CREATE INDEX IF NOT EXISTS idx_compliance_status_program ON public.acgme_compliance_status(program_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status_requirement ON public.acgme_compliance_status(requirement_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status_status ON public.acgme_compliance_status(status);

-- ============================================================================
-- 3. COMPLIANCE EVIDENCE
-- Documents and records that support compliance claims
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.acgme_compliance_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_status_id UUID NOT NULL REFERENCES public.acgme_compliance_status(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('document', 'policy', 'meeting_minutes', 'survey_result', 'attestation', 'screenshot', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT, -- Supabase storage path
  file_type TEXT, -- pdf, docx, etc.
  file_size_bytes INTEGER,
  external_url TEXT, -- For linked evidence
  effective_date DATE,
  expiration_date DATE,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_status ON public.acgme_compliance_evidence(compliance_status_id);
CREATE INDEX IF NOT EXISTS idx_compliance_evidence_type ON public.acgme_compliance_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_compliance_evidence_expiration ON public.acgme_compliance_evidence(expiration_date);

-- ============================================================================
-- 4. ACTION ITEMS / REMEDIATION PLANS
-- Tasks to address non-compliance or at-risk items
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.acgme_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_status_id UUID NOT NULL REFERENCES public.acgme_compliance_status(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  completed_date DATE,
  completion_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_items_compliance ON public.acgme_action_items(compliance_status_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON public.acgme_action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_assigned ON public.acgme_action_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_action_items_due ON public.acgme_action_items(due_date);

-- ============================================================================
-- 5. COMPLIANCE HISTORY / AUDIT LOG
-- Track changes to compliance status over time
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.acgme_compliance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_status_id UUID NOT NULL REFERENCES public.acgme_compliance_status(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_history_status ON public.acgme_compliance_history(compliance_status_id);
CREATE INDEX IF NOT EXISTS idx_compliance_history_date ON public.acgme_compliance_history(created_at);

-- ============================================================================
-- 6. SITE VISIT TRACKING
-- Track ACGME site visits and outcomes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.acgme_site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  visit_type TEXT NOT NULL CHECK (visit_type IN ('initial', 'continued', 'focused', 'self_study')),
  visit_date DATE NOT NULL,
  outcome TEXT CHECK (outcome IN ('continued_accreditation', 'continued_with_warning', 'probation', 'withdrawal', 'pending')),
  next_visit_date DATE,
  citations_count INTEGER DEFAULT 0,
  areas_for_improvement TEXT[], -- Array of areas noted
  commendations TEXT[], -- Array of strengths noted
  report_file_path TEXT, -- Supabase storage path
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_visits_program ON public.acgme_site_visits(program_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_date ON public.acgme_site_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_site_visits_outcome ON public.acgme_site_visits(outcome);

-- ============================================================================
-- 7. CITATIONS TRACKING
-- Track specific citations from site visits
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.acgme_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_visit_id UUID NOT NULL REFERENCES public.acgme_site_visits(id) ON DELETE CASCADE,
  requirement_id TEXT NOT NULL REFERENCES public.acgme_requirements(id),
  citation_text TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('citation', 'area_for_improvement', 'concern')),
  response_due_date DATE,
  response_submitted_date DATE,
  response_text TEXT,
  resolution_status TEXT CHECK (resolution_status IN ('pending', 'submitted', 'accepted', 'requires_followup', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citations_visit ON public.acgme_citations(site_visit_id);
CREATE INDEX IF NOT EXISTS idx_citations_requirement ON public.acgme_citations(requirement_id);
CREATE INDEX IF NOT EXISTS idx_citations_status ON public.acgme_citations(resolution_status);

-- ============================================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.acgme_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acgme_compliance_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acgme_compliance_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acgme_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acgme_compliance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acgme_site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acgme_citations ENABLE ROW LEVEL SECURITY;

-- Requirements catalog is read-only for all authenticated users
CREATE POLICY "Requirements readable by all authenticated users"
  ON public.acgme_requirements FOR SELECT
  TO authenticated
  USING (true);

-- Compliance status: Program admins and faculty can view their program's status
CREATE POLICY "Compliance status viewable by program members"
  ON public.acgme_compliance_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.role IN ('super_admin', 'program_director')
        OR (up.role = 'faculty' AND EXISTS (
          SELECT 1 FROM public.faculty f
          WHERE f.user_id = up.id
          AND f.program_id = acgme_compliance_status.program_id
        ))
      )
    )
  );

-- Compliance status: Only program admins can modify
CREATE POLICY "Compliance status modifiable by program admins"
  ON public.acgme_compliance_status FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'program_director')
    )
  );

-- Evidence: Same access as compliance status
CREATE POLICY "Evidence viewable by program members"
  ON public.acgme_compliance_evidence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.acgme_compliance_status cs
      JOIN public.user_profiles up ON up.id = auth.uid()
      WHERE cs.id = acgme_compliance_evidence.compliance_status_id
      AND (
        up.role IN ('super_admin', 'program_director')
        OR (up.role = 'faculty' AND EXISTS (
          SELECT 1 FROM public.faculty f
          WHERE f.user_id = up.id
          AND f.program_id = cs.program_id
        ))
      )
    )
  );

CREATE POLICY "Evidence modifiable by program admins"
  ON public.acgme_compliance_evidence FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'program_director')
    )
  );

-- Action items: Viewable by assigned user and program admins
CREATE POLICY "Action items viewable by relevant users"
  ON public.acgme_action_items FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'program_director')
    )
  );

CREATE POLICY "Action items modifiable by program admins"
  ON public.acgme_action_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'program_director')
    )
  );

-- History: Read-only for program admins
CREATE POLICY "History viewable by program admins"
  ON public.acgme_compliance_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'program_director')
    )
  );

-- Site visits: Program admins only
CREATE POLICY "Site visits viewable by program admins"
  ON public.acgme_site_visits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'program_director')
    )
  );

CREATE POLICY "Site visits modifiable by program admins"
  ON public.acgme_site_visits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'program_director')
    )
  );

-- Citations: Same as site visits
CREATE POLICY "Citations viewable by program admins"
  ON public.acgme_citations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'program_director')
    )
  );

CREATE POLICY "Citations modifiable by program admins"
  ON public.acgme_citations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'program_director')
    )
  );

-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Calculate overall compliance percentage for a program
CREATE OR REPLACE FUNCTION calculate_program_compliance(p_program_id UUID)
RETURNS TABLE (
  total_requirements INTEGER,
  compliant_count INTEGER,
  at_risk_count INTEGER,
  non_compliant_count INTEGER,
  not_assessed_count INTEGER,
  compliance_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_requirements,
    COUNT(*) FILTER (WHERE cs.status = 'compliant')::INTEGER as compliant_count,
    COUNT(*) FILTER (WHERE cs.status = 'at_risk')::INTEGER as at_risk_count,
    COUNT(*) FILTER (WHERE cs.status = 'non_compliant')::INTEGER as non_compliant_count,
    COUNT(*) FILTER (WHERE cs.status IN ('not_assessed', 'not_applicable'))::INTEGER as not_assessed_count,
    CASE 
      WHEN COUNT(*) FILTER (WHERE cs.status NOT IN ('not_assessed', 'not_applicable')) = 0 THEN 0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE cs.status = 'compliant')::DECIMAL / 
         COUNT(*) FILTER (WHERE cs.status NOT IN ('not_assessed', 'not_applicable'))::DECIMAL) * 100,
        2
      )
    END as compliance_percentage
  FROM public.acgme_requirements r
  LEFT JOIN public.acgme_compliance_status cs ON cs.requirement_id = r.id AND cs.program_id = p_program_id
  WHERE r.scope IN ('UNIVERSAL', 'EM_SPECIFIC'); -- Adjust based on program specialty
END;
$$ LANGUAGE plpgsql STABLE;

-- Get compliance breakdown by category
CREATE OR REPLACE FUNCTION get_compliance_by_category(p_program_id UUID)
RETURNS TABLE (
  category TEXT,
  total INTEGER,
  compliant INTEGER,
  at_risk INTEGER,
  non_compliant INTEGER,
  not_assessed INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.category,
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (WHERE cs.status = 'compliant')::INTEGER as compliant,
    COUNT(*) FILTER (WHERE cs.status = 'at_risk')::INTEGER as at_risk,
    COUNT(*) FILTER (WHERE cs.status = 'non_compliant')::INTEGER as non_compliant,
    COUNT(*) FILTER (WHERE cs.status IN ('not_assessed', 'not_applicable'))::INTEGER as not_assessed
  FROM public.acgme_requirements r
  LEFT JOIN public.acgme_compliance_status cs ON cs.requirement_id = r.id AND cs.program_id = p_program_id
  WHERE r.scope IN ('UNIVERSAL', 'EM_SPECIFIC')
  GROUP BY r.category
  ORDER BY r.category;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get upcoming deadlines (action items and evidence expirations)
CREATE OR REPLACE FUNCTION get_upcoming_deadlines(p_program_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  deadline_type TEXT,
  title TEXT,
  due_date DATE,
  requirement_id TEXT,
  requirement_title TEXT,
  priority TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Action items due
  SELECT
    'action_item'::TEXT as deadline_type,
    ai.title,
    ai.due_date,
    r.id as requirement_id,
    r.title as requirement_title,
    ai.priority
  FROM public.acgme_action_items ai
  JOIN public.acgme_compliance_status cs ON cs.id = ai.compliance_status_id
  JOIN public.acgme_requirements r ON r.id = cs.requirement_id
  WHERE cs.program_id = p_program_id
    AND ai.status IN ('pending', 'in_progress')
    AND ai.due_date <= CURRENT_DATE + p_days
  
  UNION ALL
  
  -- Evidence expiring
  SELECT
    'evidence_expiring'::TEXT as deadline_type,
    e.title,
    e.expiration_date as due_date,
    r.id as requirement_id,
    r.title as requirement_title,
    CASE 
      WHEN r.risk_level = 'Critical' THEN 'urgent'
      WHEN r.risk_level = 'High' THEN 'high'
      ELSE 'medium'
    END as priority
  FROM public.acgme_compliance_evidence e
  JOIN public.acgme_compliance_status cs ON cs.id = e.compliance_status_id
  JOIN public.acgme_requirements r ON r.id = cs.requirement_id
  WHERE cs.program_id = p_program_id
    AND e.expiration_date IS NOT NULL
    AND e.expiration_date <= CURRENT_DATE + p_days
  
  ORDER BY due_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 10. TRIGGERS FOR AUDIT LOGGING
-- ============================================================================

-- Trigger to log compliance status changes
CREATE OR REPLACE FUNCTION log_compliance_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.acgme_compliance_history (
      compliance_status_id,
      previous_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER compliance_status_change_trigger
  BEFORE UPDATE ON public.acgme_compliance_status
  FOR EACH ROW
  EXECUTE FUNCTION log_compliance_change();

-- Update timestamp trigger for other tables
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_acgme_requirements_timestamp
  BEFORE UPDATE ON public.acgme_requirements
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_acgme_evidence_timestamp
  BEFORE UPDATE ON public.acgme_compliance_evidence
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_acgme_action_items_timestamp
  BEFORE UPDATE ON public.acgme_action_items
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_acgme_site_visits_timestamp
  BEFORE UPDATE ON public.acgme_site_visits
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_acgme_citations_timestamp
  BEFORE UPDATE ON public.acgme_citations
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.acgme_requirements IS 'Master catalog of ACGME requirements from Common Program Requirements';
COMMENT ON TABLE public.acgme_compliance_status IS 'Program-specific compliance status for each requirement';
COMMENT ON TABLE public.acgme_compliance_evidence IS 'Supporting documents and evidence for compliance claims';
COMMENT ON TABLE public.acgme_action_items IS 'Remediation tasks and action items for non-compliant areas';
COMMENT ON TABLE public.acgme_compliance_history IS 'Audit log of compliance status changes';
COMMENT ON TABLE public.acgme_site_visits IS 'ACGME site visit records and outcomes';
COMMENT ON TABLE public.acgme_citations IS 'Specific citations from site visits linked to requirements';

