-- Survey System Migration
-- Creates tables for the EQ·PQ·IQ survey/form system:
--   surveys, survey_respondents, survey_resident_assignments, eqpqiq_user_roles
-- Supports Learner (self-assessment) and Educator (faculty rates residents) surveys
-- Token-based access: each respondent gets a unique URL, no login required

-- ============================================================================
-- 1. SURVEYS (Campaign definitions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Type and scope
    survey_type TEXT NOT NULL CHECK (survey_type IN (
        'learner_self_assessment',  -- Resident self-assesses
        'educator_assessment',      -- Faculty rates residents
        'program_intake',           -- New program onboarding
        'custom'                    -- Generic form (Phase 4)
    )),
    title TEXT NOT NULL,
    description TEXT,

    -- Program/class scoping
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    period_label TEXT,          -- e.g., "PGY-1 Spring" (ties to structured_ratings)
    academic_year TEXT,         -- e.g., "2025-2026"

    -- Audience targeting (stored for reference)
    audience_filter JSONB DEFAULT '{}',
    -- Examples:
    --   { "type": "all_faculty" }
    --   { "type": "class", "class_id": "uuid-here" }
    --   { "type": "pgy_level", "pgy": "PGY-3" }
    --   { "type": "custom", "emails": ["a@b.com", "c@d.com"] }

    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',      -- Being configured, not yet sent
        'active',     -- Distributed, accepting responses
        'closed',     -- Past deadline, no more responses
        'archived'    -- Historical record
    )),

    -- Deadline and reminders
    deadline TIMESTAMPTZ,                   -- Survey close date; locks after this
    auto_remind BOOLEAN DEFAULT false,      -- Enable automated periodic reminders
    remind_every_days INTEGER,              -- Reminder frequency in days (e.g., 3)
    max_reminders INTEGER DEFAULT 5,        -- Cap per respondent to prevent spam
    last_auto_remind_run TIMESTAMPTZ,       -- When the cron last processed this survey

    -- Admin
    created_by_email TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    -- Settings can include:
    --   custom_email_subject, custom_email_body, form_instructions,
    --   allow_edit_after_submit (boolean), require_comments (boolean)

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_surveys_program ON public.surveys(program_id);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON public.surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_type ON public.surveys(survey_type);
CREATE INDEX IF NOT EXISTS idx_surveys_deadline ON public.surveys(deadline) WHERE status = 'active';

-- ============================================================================
-- 2. SURVEY RESPONDENTS (Per-person survey copies with unique tokens)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.survey_respondents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Survey link
    survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,

    -- Respondent identity
    email TEXT NOT NULL,                    -- Institutional email (primary identifier)
    name TEXT,                              -- Display name
    phone TEXT,                             -- For SMS distribution
    user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,

    -- Token-based access (THE authentication mechanism)
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    -- Generates a 48-character hex string, cryptographically random
    -- URL: eqpqiq.com/survey/{token}

    -- Role context
    role TEXT NOT NULL CHECK (role IN ('resident', 'faculty')),

    -- Progress tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',     -- Not yet opened
        'started',     -- Opened and partially completed
        'completed'    -- All responses submitted
    )),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Auto-save for partial responses (resume where they left off)
    progress_data JSONB,
    -- For learner: { "current_section": "pq", "completed_sections": ["eq"], "partial_scores": {...} }
    -- For educator: { "current_resident_index": 3, "completed_residents": ["uuid1", "uuid2"], "partial_scores": {...} }

    -- Reminder tracking
    last_reminded_at TIMESTAMPTZ,
    reminder_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- One survey copy per email per survey
    UNIQUE(survey_id, email)
);

CREATE INDEX IF NOT EXISTS idx_survey_respondents_token ON public.survey_respondents(token);
CREATE INDEX IF NOT EXISTS idx_survey_respondents_survey ON public.survey_respondents(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_respondents_email ON public.survey_respondents(email);
CREATE INDEX IF NOT EXISTS idx_survey_respondents_status ON public.survey_respondents(survey_id, status);
CREATE INDEX IF NOT EXISTS idx_survey_respondents_pending ON public.survey_respondents(survey_id) 
    WHERE status != 'completed';

-- ============================================================================
-- 3. SURVEY RESIDENT ASSIGNMENTS (Educator surveys: which residents to rate)
-- ============================================================================
-- For educator_assessment surveys, each faculty respondent is assigned
-- a set of residents to rate. This tracks per-resident completion.
CREATE TABLE IF NOT EXISTS public.survey_resident_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Links
    survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
    respondent_id UUID NOT NULL REFERENCES public.survey_respondents(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,

    -- Completion tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    completed_at TIMESTAMPTZ,

    -- Link to the actual rating (once submitted)
    structured_rating_id UUID REFERENCES public.structured_ratings(id) ON DELETE SET NULL,

    -- Display order (for consistent ordering in the stepper UI)
    display_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),

    -- One assignment per faculty per resident per survey
    UNIQUE(survey_id, respondent_id, resident_id)
);

CREATE INDEX IF NOT EXISTS idx_survey_assignments_respondent ON public.survey_resident_assignments(respondent_id);
CREATE INDEX IF NOT EXISTS idx_survey_assignments_survey ON public.survey_resident_assignments(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_assignments_resident ON public.survey_resident_assignments(resident_id);
CREATE INDEX IF NOT EXISTS idx_survey_assignments_pending ON public.survey_resident_assignments(respondent_id)
    WHERE status = 'pending';

-- ============================================================================
-- 4. EQPQIQ USER ROLES (Unified cross-tool role tracking)
-- ============================================================================
-- Tracks what roles a user has across all eqpqiq tools.
-- Supplements per-tool tables (interview_session_interviewers, pulsecheck_directors)
-- with a single view of "what can this person do?"
CREATE TABLE IF NOT EXISTS public.eqpqiq_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity (email-based, since eqpqiq uses email auth)
    user_email TEXT NOT NULL,
    personal_email TEXT,             -- For cross-referencing across institutions

    -- Tool and scope
    tool TEXT NOT NULL CHECK (tool IN ('interview', 'ccc', 'pulsecheck')),
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    health_system_id UUID REFERENCES public.health_systems(id) ON DELETE CASCADE,

    -- Role
    role TEXT NOT NULL,
    -- Interview: 'program_director', 'faculty', 'coordinator', 'guest'
    -- CCC: 'program_director', 'faculty', 'resident'
    -- Pulse Check: 'regional_director', 'medical_director', 'associate_medical_director',
    --              'assistant_medical_director', 'admin_assistant'
    is_admin BOOLEAN DEFAULT false,   -- Quick check for admin-level access

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index using COALESCE to handle nullable program_id/health_system_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_eqpqiq_roles_unique 
ON public.eqpqiq_user_roles(
    user_email, 
    tool, 
    COALESCE(program_id, '00000000-0000-0000-0000-000000000000'::UUID), 
    COALESCE(health_system_id, '00000000-0000-0000-0000-000000000000'::UUID)
);

CREATE INDEX IF NOT EXISTS idx_eqpqiq_roles_email ON public.eqpqiq_user_roles(user_email);
CREATE INDEX IF NOT EXISTS idx_eqpqiq_roles_tool ON public.eqpqiq_user_roles(tool);
CREATE INDEX IF NOT EXISTS idx_eqpqiq_roles_program ON public.eqpqiq_user_roles(program_id);
CREATE INDEX IF NOT EXISTS idx_eqpqiq_roles_active ON public.eqpqiq_user_roles(user_email, tool) 
    WHERE is_active = true;

-- ============================================================================
-- 5. VIEWS
-- ============================================================================

-- Survey completion summary (for admin dashboard)
CREATE OR REPLACE VIEW public.survey_completion_summary AS
SELECT 
    s.id AS survey_id,
    s.title,
    s.survey_type,
    s.status AS survey_status,
    s.deadline,
    s.program_id,
    COUNT(sr.id) AS total_respondents,
    COUNT(sr.id) FILTER (WHERE sr.status = 'completed') AS completed_count,
    COUNT(sr.id) FILTER (WHERE sr.status = 'started') AS started_count,
    COUNT(sr.id) FILTER (WHERE sr.status = 'pending') AS pending_count,
    CASE 
        WHEN COUNT(sr.id) > 0 
        THEN ROUND(
            (COUNT(sr.id) FILTER (WHERE sr.status = 'completed')::NUMERIC / COUNT(sr.id)) * 100, 
            1
        )
        ELSE 0 
    END AS completion_percentage
FROM public.surveys s
LEFT JOIN public.survey_respondents sr ON sr.survey_id = s.id
GROUP BY s.id, s.title, s.survey_type, s.status, s.deadline, s.program_id;

-- Educator survey per-faculty progress (how many residents each faculty has rated)
CREATE OR REPLACE VIEW public.educator_survey_progress AS
SELECT
    sra.survey_id,
    sr.id AS respondent_id,
    sr.email AS faculty_email,
    sr.name AS faculty_name,
    sr.status AS respondent_status,
    COUNT(sra.id) AS total_residents_assigned,
    COUNT(sra.id) FILTER (WHERE sra.status = 'completed') AS residents_completed,
    COUNT(sra.id) FILTER (WHERE sra.status = 'pending') AS residents_remaining
FROM public.survey_resident_assignments sra
JOIN public.survey_respondents sr ON sr.id = sra.respondent_id
GROUP BY sra.survey_id, sr.id, sr.email, sr.name, sr.status;

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_respondents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_resident_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eqpqiq_user_roles ENABLE ROW LEVEL SECURITY;

-- Surveys: service role can do everything (API routes use service key)
-- Authenticated users can read surveys for their program
CREATE POLICY "surveys_service_all" ON public.surveys
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "survey_respondents_service_all" ON public.survey_respondents
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "survey_assignments_service_all" ON public.survey_resident_assignments
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "eqpqiq_roles_service_all" ON public.eqpqiq_user_roles
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE TRIGGER update_surveys_updated_at 
    BEFORE UPDATE ON public.surveys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_respondents_updated_at 
    BEFORE UPDATE ON public.survey_respondents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eqpqiq_roles_updated_at 
    BEFORE UPDATE ON public.eqpqiq_user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-close surveys past deadline
CREATE OR REPLACE FUNCTION auto_close_expired_surveys()
RETURNS void AS $$
BEGIN
    UPDATE public.surveys
    SET status = 'closed', updated_at = now()
    WHERE status = 'active'
      AND deadline IS NOT NULL
      AND deadline < now();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.surveys IS 'Survey campaigns for EQ/PQ/IQ data collection (Learner self-assessments, Educator assessments, intake forms)';
COMMENT ON TABLE public.survey_respondents IS 'Individual survey copies per respondent with unique token-based access (no login required)';
COMMENT ON TABLE public.survey_resident_assignments IS 'For educator surveys: tracks which residents each faculty member needs to rate';
COMMENT ON TABLE public.eqpqiq_user_roles IS 'Unified cross-tool role tracking for eqpqiq.com (Interview, CCC, Pulse Check)';

COMMENT ON COLUMN public.survey_respondents.token IS 'Cryptographic token for zero-friction access. URL: eqpqiq.com/survey/{token}';
COMMENT ON COLUMN public.survey_respondents.progress_data IS 'Auto-saved partial responses for resume-where-you-left-off functionality';
COMMENT ON COLUMN public.survey_resident_assignments.structured_rating_id IS 'Links to the structured_ratings row created when this assignment is completed';
COMMENT ON COLUMN public.surveys.audience_filter IS 'JSON describing target audience: all_faculty, class, pgy_level, or custom email list';
COMMENT ON COLUMN public.surveys.auto_remind IS 'When true, a daily cron job sends reminders to non-completers per remind_every_days schedule';
