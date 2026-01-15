-- ============================================================================
-- INTERVIEW MODULE - MVP Tables
-- EQ/PQ/IQ Interview Rating Tool for eqpqiq.com
-- ============================================================================

-- ============================================================================
-- 1. INTERVIEW SESSIONS
-- Can be group (linked to program) or individual (standalone)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Session Type
    session_type VARCHAR NOT NULL DEFAULT 'individual' 
        CHECK (session_type IN ('group', 'individual')),
    
    -- Group sessions: linked to season and program
    season_id UUID, -- NULL for individual sessions (FK added when seasons table exists)
    program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
    
    -- Creator info (for both types)
    created_by_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    creator_email VARCHAR, -- For individual/email-only sessions
    
    -- Session details
    session_name VARCHAR NOT NULL,
    session_date DATE,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'review', 'submitted', 'archived')),
    
    -- Sharing
    share_token VARCHAR UNIQUE,
    is_public BOOLEAN DEFAULT false,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for looking up sessions by creator
CREATE INDEX IF NOT EXISTS idx_interview_sessions_creator 
    ON public.interview_sessions(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_creator_email 
    ON public.interview_sessions(creator_email);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_share_token 
    ON public.interview_sessions(share_token);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_program 
    ON public.interview_sessions(program_id);

-- ============================================================================
-- 2. INTERVIEW CANDIDATES
-- Candidates being evaluated in a session
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.interview_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    
    -- Basic info
    candidate_name VARCHAR NOT NULL,
    candidate_email VARCHAR,
    
    -- Application Data (for advanced use)
    step_2_score INTEGER,
    sloe_a_score NUMERIC(3,1),
    sloe_b_score NUMERIC(3,1),
    
    -- Flags
    did_rotate BOOLEAN DEFAULT false,
    rotation_score INTEGER,
    is_local BOOLEAN DEFAULT false,
    beast_mode BOOLEAN DEFAULT false,
    failed_step BOOLEAN DEFAULT false,
    repeated_year BOOLEAN DEFAULT false,
    single_sloe BOOLEAN DEFAULT false,
    sent_thank_you BOOLEAN DEFAULT false,
    attended_social BOOLEAN DEFAULT false,
    
    -- Flexible additional data
    candidate_data JSONB DEFAULT '{}',
    
    -- Calculated Interview Scores (denormalized for performance)
    eq_total INTEGER,
    pq_total INTEGER,
    iq_total INTEGER,
    interview_total INTEGER,
    
    -- Calculated Touchpoint Scores (for future)
    rotation_total INTEGER,
    social_total INTEGER,
    touchpoint_total INTEGER,
    
    -- Final Composite Score
    composite_score INTEGER,
    
    -- Future AI scoring
    ai_eq_score INTEGER,
    ai_pq_score INTEGER,
    ai_iq_score INTEGER,
    interview_recording_url TEXT,
    recording_consent BOOLEAN DEFAULT false,
    
    -- Ordering
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interview_candidates_session 
    ON public.interview_candidates(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_candidates_email 
    ON public.interview_candidates(candidate_email);

-- ============================================================================
-- 3. INTERVIEW RATINGS
-- Each interviewer's EQ/PQ/IQ scores for each candidate
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.interview_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.interview_candidates(id) ON DELETE CASCADE,
    
    -- Interviewer info
    interviewer_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    interviewer_email VARCHAR NOT NULL,
    interviewer_name VARCHAR,
    
    -- Scores (0-100 scale)
    eq_score INTEGER CHECK (eq_score BETWEEN 0 AND 100),
    pq_score INTEGER CHECK (pq_score BETWEEN 0 AND 100),
    iq_score INTEGER CHECK (iq_score BETWEEN 0 AND 100),
    
    -- Notes
    notes TEXT,
    
    -- Question tracking (optional)
    questions_asked TEXT[],
    question_notes JSONB DEFAULT '{}',
    
    -- Revision tracking
    is_revised BOOLEAN DEFAULT false,
    revised_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- One rating per interviewer per candidate
    UNIQUE(candidate_id, interviewer_email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interview_ratings_candidate 
    ON public.interview_ratings(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_ratings_interviewer 
    ON public.interview_ratings(interviewer_user_id);
CREATE INDEX IF NOT EXISTS idx_interview_ratings_interviewer_email 
    ON public.interview_ratings(interviewer_email);

-- ============================================================================
-- 4. INTERVIEW SESSION INTERVIEWERS
-- Track who is part of a session (for group sessions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.interview_session_interviewers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    interviewer_email VARCHAR NOT NULL,
    interviewer_name VARCHAR,
    role VARCHAR DEFAULT 'interviewer' CHECK (role IN ('interviewer', 'coordinator', 'program_director')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(session_id, interviewer_email)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_interview_session_interviewers_session 
    ON public.interview_session_interviewers(session_id);

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Function to recalculate candidate totals from all ratings
CREATE OR REPLACE FUNCTION recalculate_candidate_totals(p_candidate_id UUID)
RETURNS void AS $$
DECLARE
    v_eq_total INTEGER;
    v_pq_total INTEGER;
    v_iq_total INTEGER;
BEGIN
    -- Sum all ratings for this candidate
    SELECT 
        COALESCE(SUM(eq_score), 0),
        COALESCE(SUM(pq_score), 0),
        COALESCE(SUM(iq_score), 0)
    INTO v_eq_total, v_pq_total, v_iq_total
    FROM public.interview_ratings
    WHERE candidate_id = p_candidate_id;
    
    -- Update candidate totals
    UPDATE public.interview_candidates
    SET 
        eq_total = v_eq_total,
        pq_total = v_pq_total,
        iq_total = v_iq_total,
        interview_total = v_eq_total + v_pq_total + v_iq_total,
        updated_at = now()
    WHERE id = p_candidate_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-recalculate on rating changes
CREATE OR REPLACE FUNCTION trigger_recalculate_candidate_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_candidate_totals(OLD.candidate_id);
        RETURN OLD;
    ELSE
        PERFORM recalculate_candidate_totals(NEW.candidate_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_recalculate_candidate_totals ON public.interview_ratings;
CREATE TRIGGER tr_recalculate_candidate_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.interview_ratings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_candidate_totals();

-- Function to generate a unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS VARCHAR AS $$
BEGIN
    RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_session_interviewers ENABLE ROW LEVEL SECURITY;

-- Interview Sessions Policies
-- Authenticated users can see sessions they created or are part of
CREATE POLICY "Users can view own sessions" ON public.interview_sessions
    FOR SELECT
    USING (
        created_by_user_id = auth.uid()
        OR creator_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
        OR id IN (
            SELECT session_id FROM public.interview_session_interviewers 
            WHERE user_id = auth.uid()
        )
        OR is_public = true
    );

CREATE POLICY "Users can create sessions" ON public.interview_sessions
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own sessions" ON public.interview_sessions
    FOR UPDATE
    USING (
        created_by_user_id = auth.uid()
        OR creator_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete own sessions" ON public.interview_sessions
    FOR DELETE
    USING (
        created_by_user_id = auth.uid()
        OR creator_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    );

-- Interview Candidates Policies
CREATE POLICY "Users can view candidates in accessible sessions" ON public.interview_candidates
    FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM public.interview_sessions WHERE
                created_by_user_id = auth.uid()
                OR creator_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
                OR id IN (
                    SELECT session_id FROM public.interview_session_interviewers 
                    WHERE user_id = auth.uid()
                )
                OR is_public = true
        )
    );

CREATE POLICY "Users can create candidates in own sessions" ON public.interview_candidates
    FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT id FROM public.interview_sessions WHERE
                created_by_user_id = auth.uid()
                OR creator_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can update candidates in own sessions" ON public.interview_candidates
    FOR UPDATE
    USING (
        session_id IN (
            SELECT id FROM public.interview_sessions WHERE
                created_by_user_id = auth.uid()
                OR creator_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can delete candidates in own sessions" ON public.interview_candidates
    FOR DELETE
    USING (
        session_id IN (
            SELECT id FROM public.interview_sessions WHERE
                created_by_user_id = auth.uid()
                OR creator_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
        )
    );

-- Interview Ratings Policies
CREATE POLICY "Users can view ratings in accessible sessions" ON public.interview_ratings
    FOR SELECT
    USING (
        candidate_id IN (
            SELECT ic.id FROM public.interview_candidates ic
            JOIN public.interview_sessions s ON ic.session_id = s.id
            WHERE s.created_by_user_id = auth.uid()
                OR s.creator_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
                OR s.id IN (
                    SELECT session_id FROM public.interview_session_interviewers 
                    WHERE user_id = auth.uid()
                )
                OR s.is_public = true
        )
    );

CREATE POLICY "Users can create own ratings" ON public.interview_ratings
    FOR INSERT
    WITH CHECK (
        interviewer_user_id = auth.uid()
        OR interviewer_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update own ratings" ON public.interview_ratings
    FOR UPDATE
    USING (
        interviewer_user_id = auth.uid()
        OR interviewer_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete own ratings" ON public.interview_ratings
    FOR DELETE
    USING (
        interviewer_user_id = auth.uid()
        OR interviewer_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    );

-- Interview Session Interviewers Policies
CREATE POLICY "Users can view interviewers in accessible sessions" ON public.interview_session_interviewers
    FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM public.interview_sessions WHERE
                created_by_user_id = auth.uid()
                OR creator_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
                OR id IN (
                    SELECT session_id FROM public.interview_session_interviewers 
                    WHERE user_id = auth.uid()
                )
        )
    );

CREATE POLICY "Session owners can manage interviewers" ON public.interview_session_interviewers
    FOR ALL
    USING (
        session_id IN (
            SELECT id FROM public.interview_sessions WHERE
                created_by_user_id = auth.uid()
                OR creator_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
        )
    );

-- ============================================================================
-- 7. SERVICE ROLE BYPASS
-- Allow service role to bypass RLS for API operations
-- ============================================================================
-- Note: Service role automatically bypasses RLS in Supabase

COMMENT ON TABLE public.interview_sessions IS 'Interview sessions for EQ/PQ/IQ candidate evaluation';
COMMENT ON TABLE public.interview_candidates IS 'Candidates being evaluated in interview sessions';
COMMENT ON TABLE public.interview_ratings IS 'Individual interviewer ratings for candidates';
COMMENT ON TABLE public.interview_session_interviewers IS 'Interviewers participating in a session';
