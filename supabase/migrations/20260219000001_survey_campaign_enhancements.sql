-- Survey Campaign Enhancements
-- Adds rater_type and guidance_min to survey_respondents,
-- required flag to survey_resident_assignments,
-- and updates views for campaign completion tracking.

-- ============================================================================
-- 1. ENHANCE SURVEY_RESPONDENTS
-- ============================================================================

-- Rater type: carries the Core Faculty / Teaching Faculty / Self distinction
-- through the survey layer (mirrors structured_ratings.rater_type)
ALTER TABLE public.survey_respondents
ADD COLUMN IF NOT EXISTS rater_type TEXT;

-- Constrain to valid values (allow NULL for legacy rows)
DO $$ BEGIN
  ALTER TABLE public.survey_respondents
  ADD CONSTRAINT check_respondent_rater_type
  CHECK (rater_type IS NULL OR rater_type IN ('core_faculty', 'teaching_faculty', 'self'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Soft guidance minimum: recommended number of residents to evaluate
-- (e.g., 3 for teaching faculty). NOT enforced -- just displayed in the UI.
ALTER TABLE public.survey_respondents
ADD COLUMN IF NOT EXISTS guidance_min INTEGER DEFAULT NULL;

-- Index for filtering by rater_type within a survey
CREATE INDEX IF NOT EXISTS idx_survey_respondents_rater_type
ON public.survey_respondents(survey_id, rater_type);

-- ============================================================================
-- 2. ENHANCE SURVEY_RESIDENT_ASSIGNMENTS
-- ============================================================================

-- Required flag: true for Core Faculty (must rate all residents),
-- false for Teaching Faculty (open roster, rate at will)
ALTER TABLE public.survey_resident_assignments
ADD COLUMN IF NOT EXISTS required BOOLEAN DEFAULT true;

-- ============================================================================
-- 3. UPDATE COMPLETION VIEWS
-- ============================================================================

-- Must DROP then CREATE because we're adding columns (CREATE OR REPLACE
-- cannot change column names/order of an existing view).
DROP VIEW IF EXISTS public.survey_completion_summary;
DROP VIEW IF EXISTS public.educator_survey_progress;

CREATE VIEW public.survey_completion_summary AS
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
    END AS completion_percentage,
    -- Rater type breakdown
    COUNT(sr.id) FILTER (WHERE sr.rater_type = 'self') AS self_total,
    COUNT(sr.id) FILTER (WHERE sr.rater_type = 'self' AND sr.status = 'completed') AS self_completed,
    COUNT(sr.id) FILTER (WHERE sr.rater_type = 'core_faculty') AS core_faculty_total,
    COUNT(sr.id) FILTER (WHERE sr.rater_type = 'core_faculty' AND sr.status = 'completed') AS core_faculty_completed,
    COUNT(sr.id) FILTER (WHERE sr.rater_type = 'teaching_faculty') AS teaching_faculty_total,
    COUNT(sr.id) FILTER (WHERE sr.rater_type = 'teaching_faculty' AND sr.status = 'completed') AS teaching_faculty_completed
FROM public.surveys s
LEFT JOIN public.survey_respondents sr ON sr.survey_id = s.id
GROUP BY s.id, s.title, s.survey_type, s.status, s.deadline, s.program_id;

CREATE VIEW public.educator_survey_progress AS
SELECT
    sra.survey_id,
    sr.id AS respondent_id,
    sr.email AS faculty_email,
    sr.name AS faculty_name,
    sr.rater_type,
    sr.status AS respondent_status,
    sr.guidance_min,
    COUNT(sra.id) AS total_residents_assigned,
    COUNT(sra.id) FILTER (WHERE sra.status = 'completed') AS residents_completed,
    COUNT(sra.id) FILTER (WHERE sra.status = 'pending') AS residents_remaining,
    COUNT(sra.id) FILTER (WHERE sra.required = true) AS required_assignments,
    COUNT(sra.id) FILTER (WHERE sra.required = true AND sra.status = 'completed') AS required_completed,
    COUNT(sra.id) FILTER (WHERE sra.required = false AND sra.status = 'completed') AS optional_completed
FROM public.survey_resident_assignments sra
JOIN public.survey_respondents sr ON sr.id = sra.respondent_id
GROUP BY sra.survey_id, sr.id, sr.email, sr.name, sr.rater_type, sr.status, sr.guidance_min;

-- ============================================================================
-- 4. CAMPAIGN DETAIL VIEW (new)
-- ============================================================================
-- Provides a single query for the completion matrix dashboard

DROP VIEW IF EXISTS public.campaign_respondent_detail;
CREATE VIEW public.campaign_respondent_detail AS
SELECT
    sr.survey_id,
    sr.id AS respondent_id,
    sr.email,
    sr.name,
    sr.role,
    sr.rater_type,
    sr.status,
    sr.started_at,
    sr.completed_at,
    sr.reminder_count,
    sr.last_reminded_at,
    sr.guidance_min,
    sr.user_profile_id,
    -- Assignment stats (NULL for self-assessment respondents with no assignments table usage)
    agg.total_assigned,
    agg.completed_assigned,
    agg.required_assigned,
    agg.required_completed_assigned
FROM public.survey_respondents sr
LEFT JOIN LATERAL (
    SELECT
        COUNT(*) AS total_assigned,
        COUNT(*) FILTER (WHERE sra.status = 'completed') AS completed_assigned,
        COUNT(*) FILTER (WHERE sra.required = true) AS required_assigned,
        COUNT(*) FILTER (WHERE sra.required = true AND sra.status = 'completed') AS required_completed_assigned
    FROM public.survey_resident_assignments sra
    WHERE sra.respondent_id = sr.id
) agg ON true;

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.survey_respondents.rater_type IS 'Respondent evaluation type: core_faculty (rates all residents, required), teaching_faculty (open roster, optional), self (self-assessment)';
COMMENT ON COLUMN public.survey_respondents.guidance_min IS 'Soft recommendation for minimum residents to evaluate (displayed in UI, not enforced)';
COMMENT ON COLUMN public.survey_resident_assignments.required IS 'Whether this assignment must be completed for the survey to be considered done. True for core faculty, false for teaching faculty open roster.';
