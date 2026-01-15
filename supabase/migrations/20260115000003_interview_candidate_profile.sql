-- ============================================================================
-- INTERVIEW CANDIDATE PROFILE ENHANCEMENTS
-- Add medical school field and demo flags for testing
-- ============================================================================

-- ============================================================================
-- 1. ADD MEDICAL SCHOOL TO CANDIDATES
-- Aligns with lev8's residents.medical_school field
-- ============================================================================
ALTER TABLE public.interview_candidates 
ADD COLUMN IF NOT EXISTS medical_school VARCHAR;

-- Index for searching by medical school
CREATE INDEX IF NOT EXISTS idx_interview_candidates_medical_school 
    ON public.interview_candidates(medical_school);

-- ============================================================================
-- 2. ADD IS_DEMO FLAGS
-- Mark demo/test records for easy identification and cleanup
-- ============================================================================

-- Interview tables
ALTER TABLE public.interview_sessions 
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

ALTER TABLE public.interview_candidates 
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Lev8 core tables (for demo health systems/programs)
ALTER TABLE public.health_systems 
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Index for filtering demo data
CREATE INDEX IF NOT EXISTS idx_interview_sessions_is_demo 
    ON public.interview_sessions(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_interview_candidates_is_demo 
    ON public.interview_candidates(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_health_systems_is_demo 
    ON public.health_systems(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_programs_is_demo 
    ON public.programs(is_demo) WHERE is_demo = true;

-- ============================================================================
-- 3. ADD ADDITIONAL CANDIDATE PROFILE FIELDS
-- Common application data for medical students
-- ============================================================================

-- Application/interview metadata
ALTER TABLE public.interview_candidates
ADD COLUMN IF NOT EXISTS graduation_year INTEGER;

ALTER TABLE public.interview_candidates
ADD COLUMN IF NOT EXISTS usmle_step1_score INTEGER;

ALTER TABLE public.interview_candidates
ADD COLUMN IF NOT EXISTS usmle_step2_score INTEGER;

ALTER TABLE public.interview_candidates
ADD COLUMN IF NOT EXISTS interview_date DATE;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON COLUMN public.interview_candidates.medical_school IS 'Medical school the candidate attended - matches lev8 residents.medical_school';
COMMENT ON COLUMN public.interview_candidates.is_demo IS 'Flag to identify demo/test data';
COMMENT ON COLUMN public.interview_sessions.is_demo IS 'Flag to identify demo/test sessions';
COMMENT ON COLUMN public.health_systems.is_demo IS 'Flag to identify demo/test health systems';
COMMENT ON COLUMN public.programs.is_demo IS 'Flag to identify demo/test programs';
