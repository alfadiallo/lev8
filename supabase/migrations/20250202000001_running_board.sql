-- Running the Board - Multi-Patient ED Simulation Module
-- Creates tables for clinical cases, presets, sessions, actions, and debriefs
-- WITH Row Level Security for multi-tenant access

-- ============================================================================
-- STEP 1: CREATE ALL TABLES FIRST
-- ============================================================================

-- 1. CLINICAL CASES
CREATE TABLE IF NOT EXISTS public.running_board_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.health_systems(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    category VARCHAR NOT NULL CHECK (category IN ('Infectious', 'Cardiovascular', 'GI', 'Neuro', 'Trauma', 'OBGYN')),
    acuity_level INT NOT NULL CHECK (acuity_level BETWEEN 1 AND 5),
    tags TEXT[],
    patient_profile JSONB NOT NULL,
    timeline JSONB NOT NULL,
    debrief_points TEXT[],
    is_global BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PRESET SHIFT CONFIGURATIONS
CREATE TABLE IF NOT EXISTS public.running_board_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.health_systems(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    description TEXT,
    case_ids UUID[] NOT NULL,
    difficulty VARCHAR CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    is_global BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SIMULATION SESSIONS
CREATE TABLE IF NOT EXISTS public.running_board_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.health_systems(id) ON DELETE CASCADE,
    facilitator_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
    learner_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE RESTRICT,
    learner_pgy_level INT NOT NULL CHECK (learner_pgy_level BETWEEN 1 AND 5),
    preset_id UUID REFERENCES public.running_board_presets(id) ON DELETE SET NULL,
    status VARCHAR NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'in_progress', 'paused', 'completed', 'abandoned')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    total_duration_seconds INT,
    final_phase_reached INT,
    dark_mode_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. SESSION CASES
CREATE TABLE IF NOT EXISTS public.running_board_session_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.running_board_sessions(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES public.running_board_cases(id) ON DELETE RESTRICT,
    column_position INT NOT NULL CHECK (column_position BETWEEN 1 AND 4),
    UNIQUE(session_id, column_position)
);

-- 5. CHECKBOX ACTIONS
CREATE TABLE IF NOT EXISTS public.running_board_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.running_board_sessions(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES public.running_board_cases(id) ON DELETE RESTRICT,
    checklist_item_id VARCHAR NOT NULL,
    phase_id INT NOT NULL,
    is_critical BOOLEAN DEFAULT false,
    checked BOOLEAN DEFAULT false,
    checked_at TIMESTAMPTZ,
    unchecked_at TIMESTAMPTZ,
    elapsed_time_seconds INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. DEBRIEF RECORDS
CREATE TABLE IF NOT EXISTS public.running_board_debriefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.running_board_sessions(id) ON DELETE CASCADE UNIQUE,
    total_actions INT,
    completed_actions INT,
    critical_actions_total INT,
    critical_actions_missed INT,
    missed_critical_items JSONB,
    completion_percentage DECIMAL(5,2),
    strengths TEXT[],
    areas_for_improvement TEXT[],
    overall_score INT CHECK (overall_score BETWEEN 1 AND 5),
    facilitator_notes TEXT,
    discussion_points_covered TEXT[],
    recommended_cases UUID[],
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- STEP 2: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_rb_cases_global ON public.running_board_cases(is_global) WHERE is_global = true;
CREATE INDEX IF NOT EXISTS idx_rb_cases_institution ON public.running_board_cases(institution_id);
CREATE INDEX IF NOT EXISTS idx_rb_cases_category ON public.running_board_cases(category);
CREATE INDEX IF NOT EXISTS idx_rb_presets_global ON public.running_board_presets(is_global) WHERE is_global = true;
CREATE INDEX IF NOT EXISTS idx_rb_presets_institution ON public.running_board_presets(institution_id);
CREATE INDEX IF NOT EXISTS idx_rb_sessions_facilitator ON public.running_board_sessions(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_rb_sessions_learner ON public.running_board_sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_rb_sessions_status ON public.running_board_sessions(status);
CREATE INDEX IF NOT EXISTS idx_rb_sessions_created ON public.running_board_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rb_session_cases_session ON public.running_board_session_cases(session_id);
CREATE INDEX IF NOT EXISTS idx_rb_actions_session ON public.running_board_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_rb_actions_critical ON public.running_board_actions(session_id, is_critical) WHERE is_critical = true;

-- ============================================================================
-- STEP 3: CREATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_running_board_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS running_board_cases_updated_at ON public.running_board_cases;
CREATE TRIGGER running_board_cases_updated_at
    BEFORE UPDATE ON public.running_board_cases
    FOR EACH ROW EXECUTE FUNCTION public.update_running_board_updated_at();

DROP TRIGGER IF EXISTS running_board_debriefs_updated_at ON public.running_board_debriefs;
CREATE TRIGGER running_board_debriefs_updated_at
    BEFORE UPDATE ON public.running_board_debriefs
    FOR EACH ROW EXECUTE FUNCTION public.update_running_board_updated_at();

-- ============================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.running_board_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.running_board_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.running_board_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.running_board_session_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.running_board_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.running_board_debriefs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================================================

-- CASES: Global cases readable by all, institution cases by members
DROP POLICY IF EXISTS "rb_cases_select" ON public.running_board_cases;
CREATE POLICY "rb_cases_select" ON public.running_board_cases
    FOR SELECT TO authenticated
    USING (
        is_global = true 
        OR institution_id IN (SELECT institution_id FROM public.user_profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "rb_cases_insert" ON public.running_board_cases;
CREATE POLICY "rb_cases_insert" ON public.running_board_cases
    FOR INSERT TO authenticated
    WITH CHECK (
        institution_id IN (SELECT institution_id FROM public.user_profiles WHERE id = auth.uid())
    );

-- PRESETS: Same as cases
DROP POLICY IF EXISTS "rb_presets_select" ON public.running_board_presets;
CREATE POLICY "rb_presets_select" ON public.running_board_presets
    FOR SELECT TO authenticated
    USING (
        is_global = true 
        OR institution_id IN (SELECT institution_id FROM public.user_profiles WHERE id = auth.uid())
    );

-- SESSIONS: Facilitator or faculty/admins at institution
DROP POLICY IF EXISTS "rb_sessions_select" ON public.running_board_sessions;
CREATE POLICY "rb_sessions_select" ON public.running_board_sessions
    FOR SELECT TO authenticated
    USING (
        facilitator_id = auth.uid()
        OR institution_id IN (
            SELECT institution_id FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('faculty', 'program_director', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "rb_sessions_insert" ON public.running_board_sessions;
CREATE POLICY "rb_sessions_insert" ON public.running_board_sessions
    FOR INSERT TO authenticated
    WITH CHECK (facilitator_id = auth.uid());

DROP POLICY IF EXISTS "rb_sessions_update" ON public.running_board_sessions;
CREATE POLICY "rb_sessions_update" ON public.running_board_sessions
    FOR UPDATE TO authenticated
    USING (facilitator_id = auth.uid())
    WITH CHECK (facilitator_id = auth.uid());

-- SESSION CASES: Via parent session
DROP POLICY IF EXISTS "rb_session_cases_select" ON public.running_board_session_cases;
CREATE POLICY "rb_session_cases_select" ON public.running_board_session_cases
    FOR SELECT TO authenticated
    USING (
        session_id IN (
            SELECT id FROM public.running_board_sessions
            WHERE facilitator_id = auth.uid()
            OR institution_id IN (
                SELECT institution_id FROM public.user_profiles 
                WHERE id = auth.uid() AND role IN ('faculty', 'program_director', 'super_admin')
            )
        )
    );

DROP POLICY IF EXISTS "rb_session_cases_insert" ON public.running_board_session_cases;
CREATE POLICY "rb_session_cases_insert" ON public.running_board_session_cases
    FOR INSERT TO authenticated
    WITH CHECK (
        session_id IN (SELECT id FROM public.running_board_sessions WHERE facilitator_id = auth.uid())
    );

-- ACTIONS: Via parent session
DROP POLICY IF EXISTS "rb_actions_select" ON public.running_board_actions;
CREATE POLICY "rb_actions_select" ON public.running_board_actions
    FOR SELECT TO authenticated
    USING (
        session_id IN (
            SELECT id FROM public.running_board_sessions
            WHERE facilitator_id = auth.uid()
            OR institution_id IN (
                SELECT institution_id FROM public.user_profiles 
                WHERE id = auth.uid() AND role IN ('faculty', 'program_director', 'super_admin')
            )
        )
    );

DROP POLICY IF EXISTS "rb_actions_insert" ON public.running_board_actions;
CREATE POLICY "rb_actions_insert" ON public.running_board_actions
    FOR INSERT TO authenticated
    WITH CHECK (
        session_id IN (SELECT id FROM public.running_board_sessions WHERE facilitator_id = auth.uid())
    );

DROP POLICY IF EXISTS "rb_actions_update" ON public.running_board_actions;
CREATE POLICY "rb_actions_update" ON public.running_board_actions
    FOR UPDATE TO authenticated
    USING (
        session_id IN (SELECT id FROM public.running_board_sessions WHERE facilitator_id = auth.uid())
    );

-- DEBRIEFS: Via parent session
DROP POLICY IF EXISTS "rb_debriefs_select" ON public.running_board_debriefs;
CREATE POLICY "rb_debriefs_select" ON public.running_board_debriefs
    FOR SELECT TO authenticated
    USING (
        session_id IN (
            SELECT id FROM public.running_board_sessions
            WHERE facilitator_id = auth.uid()
            OR institution_id IN (
                SELECT institution_id FROM public.user_profiles 
                WHERE id = auth.uid() AND role IN ('faculty', 'program_director', 'super_admin')
            )
        )
    );

DROP POLICY IF EXISTS "rb_debriefs_insert" ON public.running_board_debriefs;
CREATE POLICY "rb_debriefs_insert" ON public.running_board_debriefs
    FOR INSERT TO authenticated
    WITH CHECK (
        session_id IN (SELECT id FROM public.running_board_sessions WHERE facilitator_id = auth.uid())
    );

DROP POLICY IF EXISTS "rb_debriefs_update" ON public.running_board_debriefs;
CREATE POLICY "rb_debriefs_update" ON public.running_board_debriefs
    FOR UPDATE TO authenticated
    USING (
        session_id IN (SELECT id FROM public.running_board_sessions WHERE facilitator_id = auth.uid())
    );





