-- =====================================================
-- PULSE CHECK MODULE - Database Schema
-- Provider Performance Evaluation System
-- =====================================================

-- Sites/Locations (hospitals, clinics, etc.)
CREATE TABLE IF NOT EXISTS pulsecheck_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    region TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments within sites
CREATE TABLE IF NOT EXISTS pulsecheck_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES pulsecheck_sites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialty TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_id, name)
);

-- Medical Directors (can have multiple per department)
CREATE TABLE IF NOT EXISTS pulsecheck_directors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID REFERENCES user_profiles(id),
    department_id UUID NOT NULL REFERENCES pulsecheck_departments(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('regional_director', 'medical_director', 'associate_medical_director', 'assistant_medical_director', 'admin_assistant')),
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for director lookups
CREATE INDEX IF NOT EXISTS idx_pulsecheck_directors_email ON pulsecheck_directors(email);
CREATE INDEX IF NOT EXISTS idx_pulsecheck_directors_department ON pulsecheck_directors(department_id);

-- Providers (Physicians and APCs)
CREATE TABLE IF NOT EXISTS pulsecheck_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('physician', 'apc')),
    credential TEXT, -- MD, DO, PA, NP, etc.
    primary_department_id UUID NOT NULL REFERENCES pulsecheck_departments(id) ON DELETE CASCADE,
    primary_director_id UUID REFERENCES pulsecheck_directors(id),
    hire_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email)
);

-- Create index for provider lookups
CREATE INDEX IF NOT EXISTS idx_pulsecheck_providers_email ON pulsecheck_providers(email);
CREATE INDEX IF NOT EXISTS idx_pulsecheck_providers_department ON pulsecheck_providers(primary_department_id);
CREATE INDEX IF NOT EXISTS idx_pulsecheck_providers_director ON pulsecheck_providers(primary_director_id);

-- Rating cycles (quarterly, annual, etc.)
CREATE TABLE IF NOT EXISTS pulsecheck_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    reminder_cadence TEXT CHECK (reminder_cadence IN ('daily', 'weekly', 'biweekly', 'none')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    created_by UUID REFERENCES pulsecheck_directors(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual ratings
CREATE TABLE IF NOT EXISTS pulsecheck_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id UUID NOT NULL REFERENCES pulsecheck_cycles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES pulsecheck_providers(id) ON DELETE CASCADE,
    director_id UUID NOT NULL REFERENCES pulsecheck_directors(id) ON DELETE CASCADE,
    
    -- EQ scores (1-5)
    eq_empathy_rapport INT CHECK (eq_empathy_rapport BETWEEN 1 AND 5),
    eq_communication INT CHECK (eq_communication BETWEEN 1 AND 5),
    eq_stress_management INT CHECK (eq_stress_management BETWEEN 1 AND 5),
    eq_self_awareness INT CHECK (eq_self_awareness BETWEEN 1 AND 5),
    eq_adaptability INT CHECK (eq_adaptability BETWEEN 1 AND 5),
    
    -- PQ scores (1-5)
    pq_reliability INT CHECK (pq_reliability BETWEEN 1 AND 5),
    pq_integrity INT CHECK (pq_integrity BETWEEN 1 AND 5),
    pq_teachability INT CHECK (pq_teachability BETWEEN 1 AND 5),
    pq_documentation INT CHECK (pq_documentation BETWEEN 1 AND 5),
    pq_leadership INT CHECK (pq_leadership BETWEEN 1 AND 5),
    
    -- IQ scores (1-5)
    iq_clinical_management INT CHECK (iq_clinical_management BETWEEN 1 AND 5),
    iq_evidence_based INT CHECK (iq_evidence_based BETWEEN 1 AND 5),
    iq_procedural INT CHECK (iq_procedural BETWEEN 1 AND 5),
    
    -- Notes and status
    notes TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,
    goals TEXT,
    
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate ratings for same provider/cycle/director
    UNIQUE(cycle_id, provider_id, director_id)
);

-- Create indexes for rating lookups
CREATE INDEX IF NOT EXISTS idx_pulsecheck_ratings_cycle ON pulsecheck_ratings(cycle_id);
CREATE INDEX IF NOT EXISTS idx_pulsecheck_ratings_provider ON pulsecheck_ratings(provider_id);
CREATE INDEX IF NOT EXISTS idx_pulsecheck_ratings_director ON pulsecheck_ratings(director_id);
CREATE INDEX IF NOT EXISTS idx_pulsecheck_ratings_status ON pulsecheck_ratings(status);

-- Reminder tracking
CREATE TABLE IF NOT EXISTS pulsecheck_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id UUID NOT NULL REFERENCES pulsecheck_cycles(id) ON DELETE CASCADE,
    director_id UUID NOT NULL REFERENCES pulsecheck_directors(id) ON DELETE CASCADE,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    pending_count INT NOT NULL DEFAULT 0,
    completed_count INT NOT NULL DEFAULT 0,
    email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import history for tracking bulk uploads
CREATE TABLE IF NOT EXISTS pulsecheck_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imported_by UUID NOT NULL REFERENCES pulsecheck_directors(id),
    filename TEXT NOT NULL,
    total_rows INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    error_count INT NOT NULL DEFAULT 0,
    duplicate_count INT NOT NULL DEFAULT 0,
    errors JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Views for computed totals
-- =====================================================

-- View for ratings with computed totals
CREATE OR REPLACE VIEW pulsecheck_ratings_with_totals AS
SELECT 
    r.*,
    -- EQ Total (average of 5 attributes)
    CASE 
        WHEN r.eq_empathy_rapport IS NOT NULL 
             AND r.eq_communication IS NOT NULL 
             AND r.eq_stress_management IS NOT NULL 
             AND r.eq_self_awareness IS NOT NULL 
             AND r.eq_adaptability IS NOT NULL 
        THEN ROUND((r.eq_empathy_rapport + r.eq_communication + r.eq_stress_management + r.eq_self_awareness + r.eq_adaptability) / 5.0, 1)
        ELSE NULL
    END as eq_total,
    -- PQ Total (average of 5 attributes)
    CASE 
        WHEN r.pq_reliability IS NOT NULL 
             AND r.pq_integrity IS NOT NULL 
             AND r.pq_teachability IS NOT NULL 
             AND r.pq_documentation IS NOT NULL 
             AND r.pq_leadership IS NOT NULL 
        THEN ROUND((r.pq_reliability + r.pq_integrity + r.pq_teachability + r.pq_documentation + r.pq_leadership) / 5.0, 1)
        ELSE NULL
    END as pq_total,
    -- IQ Total (average of 3 attributes)
    CASE 
        WHEN r.iq_clinical_management IS NOT NULL 
             AND r.iq_evidence_based IS NOT NULL 
             AND r.iq_procedural IS NOT NULL 
        THEN ROUND((r.iq_clinical_management + r.iq_evidence_based + r.iq_procedural) / 3.0, 1)
        ELSE NULL
    END as iq_total,
    -- Overall Total
    CASE 
        WHEN r.eq_empathy_rapport IS NOT NULL 
             AND r.eq_communication IS NOT NULL 
             AND r.eq_stress_management IS NOT NULL 
             AND r.eq_self_awareness IS NOT NULL 
             AND r.eq_adaptability IS NOT NULL
             AND r.pq_reliability IS NOT NULL 
             AND r.pq_integrity IS NOT NULL 
             AND r.pq_teachability IS NOT NULL 
             AND r.pq_documentation IS NOT NULL 
             AND r.pq_leadership IS NOT NULL
             AND r.iq_clinical_management IS NOT NULL 
             AND r.iq_evidence_based IS NOT NULL 
             AND r.iq_procedural IS NOT NULL 
        THEN ROUND((
            r.eq_empathy_rapport + r.eq_communication + r.eq_stress_management + r.eq_self_awareness + r.eq_adaptability +
            r.pq_reliability + r.pq_integrity + r.pq_teachability + r.pq_documentation + r.pq_leadership +
            r.iq_clinical_management + r.iq_evidence_based + r.iq_procedural
        ) / 13.0, 1)
        ELSE NULL
    END as overall_total,
    p.name as provider_name,
    p.email as provider_email,
    p.provider_type,
    d.name as director_name,
    d.email as director_email,
    c.name as cycle_name,
    c.due_date as cycle_due_date
FROM pulsecheck_ratings r
JOIN pulsecheck_providers p ON r.provider_id = p.id
JOIN pulsecheck_directors d ON r.director_id = d.id
JOIN pulsecheck_cycles c ON r.cycle_id = c.id;

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE pulsecheck_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulsecheck_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulsecheck_directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulsecheck_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulsecheck_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulsecheck_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulsecheck_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulsecheck_imports ENABLE ROW LEVEL SECURITY;

-- For now, allow service role full access (API routes use service key)
-- More granular policies can be added as needed

CREATE POLICY "Service role has full access to pulsecheck_sites"
    ON pulsecheck_sites FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to pulsecheck_departments"
    ON pulsecheck_departments FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to pulsecheck_directors"
    ON pulsecheck_directors FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to pulsecheck_providers"
    ON pulsecheck_providers FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to pulsecheck_cycles"
    ON pulsecheck_cycles FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to pulsecheck_ratings"
    ON pulsecheck_ratings FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to pulsecheck_reminders"
    ON pulsecheck_reminders FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to pulsecheck_imports"
    ON pulsecheck_imports FOR ALL
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- Functions
-- =====================================================

-- Function to get pending ratings count for a director
CREATE OR REPLACE FUNCTION get_pending_pulsecheck_count(director_uuid UUID, cycle_uuid UUID)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM pulsecheck_ratings
        WHERE director_id = director_uuid
          AND cycle_id = cycle_uuid
          AND status != 'completed'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_pulsecheck_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_pulsecheck_sites_updated_at
    BEFORE UPDATE ON pulsecheck_sites
    FOR EACH ROW EXECUTE FUNCTION update_pulsecheck_updated_at();

CREATE TRIGGER update_pulsecheck_departments_updated_at
    BEFORE UPDATE ON pulsecheck_departments
    FOR EACH ROW EXECUTE FUNCTION update_pulsecheck_updated_at();

CREATE TRIGGER update_pulsecheck_directors_updated_at
    BEFORE UPDATE ON pulsecheck_directors
    FOR EACH ROW EXECUTE FUNCTION update_pulsecheck_updated_at();

CREATE TRIGGER update_pulsecheck_providers_updated_at
    BEFORE UPDATE ON pulsecheck_providers
    FOR EACH ROW EXECUTE FUNCTION update_pulsecheck_updated_at();

CREATE TRIGGER update_pulsecheck_cycles_updated_at
    BEFORE UPDATE ON pulsecheck_cycles
    FOR EACH ROW EXECUTE FUNCTION update_pulsecheck_updated_at();

CREATE TRIGGER update_pulsecheck_ratings_updated_at
    BEFORE UPDATE ON pulsecheck_ratings
    FOR EACH ROW EXECUTE FUNCTION update_pulsecheck_updated_at();
