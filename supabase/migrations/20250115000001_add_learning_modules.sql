-- Migration: Add Learning Modules Schema
-- Creates all tables needed for Clinical Cases, Difficult Conversations, EKG & ACLS, and Running the Board modules
-- Includes RBAC support via modules table with available_to_roles

-- ============================================================================
-- 1. MODULES TABLE (Core module registry with RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.health_systems(id) ON DELETE CASCADE,
    bucket_id UUID NOT NULL REFERENCES public.module_buckets(id) ON DELETE CASCADE,
    slug VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    available_to_roles VARCHAR[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(institution_id, slug)
);

-- ============================================================================
-- 2. CLINICAL CASES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clinical_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.health_systems(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT,
    difficulty VARCHAR CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    specialty VARCHAR,
    estimated_duration_minutes INTEGER,
    case_data JSONB NOT NULL DEFAULT '{}',
    created_by_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.clinical_cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    progress_data JSONB DEFAULT '{}',
    score DECIMAL(5,2),
    completed BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- 3. VIGNETTES (Difficult Conversations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vignettes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.health_systems(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR NOT NULL,
    subcategory VARCHAR,
    difficulty VARCHAR[] DEFAULT '{}',
    estimated_duration_minutes INTEGER,
    vignette_data JSONB NOT NULL DEFAULT '{}',
    created_by_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Training sessions (extends existing pattern from virtual-sim)
CREATE TABLE IF NOT EXISTS public.training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    vignette_id TEXT,
    vignette_title TEXT NOT NULL,
    module_type VARCHAR NOT NULL CHECK (module_type IN ('vignette', 'clinical_case', 'acls', 'running_board')),
    difficulty VARCHAR NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE,
    messages JSONB NOT NULL DEFAULT '[]',
    metrics JSONB NOT NULL DEFAULT '{}',
    session_data JSONB DEFAULT '{}',
    completed BOOLEAN DEFAULT false,
    ai_provider TEXT,
    session_duration_seconds INTEGER,
    viewable_by_roles VARCHAR[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.session_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
    empathy_score DECIMAL(5,2),
    clarity_score DECIMAL(5,2),
    de_escalation_score DECIMAL(5,2),
    total_messages INTEGER DEFAULT 0,
    user_messages INTEGER DEFAULT 0,
    avatar_messages INTEGER DEFAULT 0,
    escalation_triggers_hit TEXT[],
    keywords_matched JSONB,
    personality_alignment_score DECIMAL(5,2),
    emotional_tone TEXT,
    module_specific_metrics JSONB DEFAULT '{}',
    accessible_to_roles VARCHAR[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- 4. EKG & ACLS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.acls_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.health_systems(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT,
    scenario_data JSONB NOT NULL DEFAULT '{}',
    created_by_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.acls_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES public.acls_scenarios(id) ON DELETE CASCADE,
    current_state JSONB DEFAULT '{}',
    context_data JSONB DEFAULT '{}',
    choices_made JSONB DEFAULT '[]',
    performance_metrics JSONB DEFAULT '{}',
    completed BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- 5. RUNNING THE BOARD
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.running_board_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.health_systems(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    description TEXT,
    patient_count INTEGER NOT NULL,
    difficulty VARCHAR CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
    config_data JSONB NOT NULL DEFAULT '{}',
    created_by_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.running_board_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.running_board_configs(id) ON DELETE CASCADE,
    patient_states JSONB DEFAULT '[]',
    actions_taken JSONB DEFAULT '[]',
    performance_metrics JSONB DEFAULT '{}',
    completed BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_modules_institution_id ON public.modules(institution_id);
CREATE INDEX IF NOT EXISTS idx_modules_bucket_id ON public.modules(bucket_id);
CREATE INDEX IF NOT EXISTS idx_modules_slug ON public.modules(slug);
CREATE INDEX IF NOT EXISTS idx_modules_available_to_roles ON public.modules USING GIN(available_to_roles);

CREATE INDEX IF NOT EXISTS idx_clinical_cases_institution_id ON public.clinical_cases(institution_id);
CREATE INDEX IF NOT EXISTS idx_clinical_cases_created_by ON public.clinical_cases(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_case_attempts_case_id ON public.case_attempts(case_id);
CREATE INDEX IF NOT EXISTS idx_case_attempts_user_id ON public.case_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_vignettes_institution_id ON public.vignettes(institution_id);
CREATE INDEX IF NOT EXISTS idx_vignettes_category ON public.vignettes(category);
CREATE INDEX IF NOT EXISTS idx_vignettes_created_by ON public.vignettes(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON public.training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_module_type ON public.training_sessions(module_type);
CREATE INDEX IF NOT EXISTS idx_training_sessions_start_time ON public.training_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_session_analytics_session_id ON public.session_analytics(session_id);

CREATE INDEX IF NOT EXISTS idx_acls_scenarios_institution_id ON public.acls_scenarios(institution_id);
CREATE INDEX IF NOT EXISTS idx_acls_sessions_user_id ON public.acls_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_acls_sessions_scenario_id ON public.acls_sessions(scenario_id);

CREATE INDEX IF NOT EXISTS idx_running_board_configs_institution_id ON public.running_board_configs(institution_id);
CREATE INDEX IF NOT EXISTS idx_running_board_sessions_user_id ON public.running_board_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_running_board_sessions_config_id ON public.running_board_sessions(config_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vignettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acls_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acls_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.running_board_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.running_board_sessions ENABLE ROW LEVEL SECURITY;

-- Modules: Users can see modules where their role is in available_to_roles
CREATE POLICY modules_role_access ON public.modules
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (
            -- Check if user's role is in available_to_roles array
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.role = ANY(modules.available_to_roles)
            )
            OR
            -- Super admins can see all modules
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.role = 'super_admin'
            )
        )
    );

-- Clinical Cases: Users can see active cases from their institution
CREATE POLICY clinical_cases_access ON public.clinical_cases
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        is_active = true AND
        (
            -- Same institution
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.institution_id = clinical_cases.institution_id
            )
            OR
            -- Public cases
            is_public = true
        )
    );

-- Case Attempts: Users can only see their own attempts, educators can see their program's attempts
CREATE POLICY case_attempts_access ON public.case_attempts
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (
            -- Own attempts
            user_id = auth.uid()
            OR
            -- Educators can see attempts from their program
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                LEFT JOIN public.faculty f ON f.user_id = up.id
                LEFT JOIN public.residents r ON r.user_id = case_attempts.user_id
                WHERE up.id = auth.uid()
                AND up.role IN ('faculty', 'program_director', 'super_admin')
                AND (f.program_id = r.program_id OR up.role = 'super_admin')
            )
        )
    );

CREATE POLICY case_attempts_insert ON public.case_attempts
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY case_attempts_update ON public.case_attempts
    FOR UPDATE
    USING (user_id = auth.uid());

-- Vignettes: Similar to clinical cases
CREATE POLICY vignettes_access ON public.vignettes
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        is_active = true AND
        (
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.institution_id = vignettes.institution_id
            )
            OR
            is_public = true
        )
    );

-- Training Sessions: Users see own sessions, educators see program sessions
CREATE POLICY training_sessions_access ON public.training_sessions
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (
            -- Own sessions
            user_id = auth.uid()
            OR
            -- Educators can see sessions from their program
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                LEFT JOIN public.faculty f ON f.user_id = up.id
                LEFT JOIN public.residents r ON r.user_id = training_sessions.user_id
                WHERE up.id = auth.uid()
                AND up.role IN ('faculty', 'program_director', 'super_admin')
                AND (f.program_id = r.program_id OR up.role = 'super_admin')
            )
            OR
            -- Check viewable_by_roles
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.role = ANY(training_sessions.viewable_by_roles)
            )
        )
    );

CREATE POLICY training_sessions_insert ON public.training_sessions
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY training_sessions_update ON public.training_sessions
    FOR UPDATE
    USING (user_id = auth.uid());

-- Session Analytics: Similar access as training sessions
CREATE POLICY session_analytics_access ON public.session_analytics
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (
            -- Can see if user owns the session
            EXISTS (
                SELECT 1 FROM public.training_sessions
                WHERE training_sessions.id = session_analytics.session_id
                AND training_sessions.user_id = auth.uid()
            )
            OR
            -- Educators can see analytics from their program
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                LEFT JOIN public.faculty f ON f.user_id = up.id
                LEFT JOIN public.training_sessions ts ON ts.id = session_analytics.session_id
                LEFT JOIN public.residents r ON r.user_id = ts.user_id
                WHERE up.id = auth.uid()
                AND up.role IN ('faculty', 'program_director', 'super_admin')
                AND (f.program_id = r.program_id OR up.role = 'super_admin')
            )
            OR
            -- Check accessible_to_roles
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.role = ANY(session_analytics.accessible_to_roles)
            )
        )
    );

-- ACLS Scenarios: Similar to clinical cases
CREATE POLICY acls_scenarios_access ON public.acls_scenarios
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        is_active = true AND
        (
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.institution_id = acls_scenarios.institution_id
            )
            OR
            is_public = true
        )
    );

-- ACLS Sessions: Similar to training sessions
CREATE POLICY acls_sessions_access ON public.acls_sessions
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (
            user_id = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                LEFT JOIN public.faculty f ON f.user_id = up.id
                LEFT JOIN public.residents r ON r.user_id = acls_sessions.user_id
                WHERE up.id = auth.uid()
                AND up.role IN ('faculty', 'program_director', 'super_admin')
                AND (f.program_id = r.program_id OR up.role = 'super_admin')
            )
        )
    );

CREATE POLICY acls_sessions_insert ON public.acls_sessions
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY acls_sessions_update ON public.acls_sessions
    FOR UPDATE
    USING (user_id = auth.uid());

-- Running Board Configs: Similar to clinical cases
CREATE POLICY running_board_configs_access ON public.running_board_configs
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        is_active = true AND
        (
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.institution_id = running_board_configs.institution_id
            )
            OR
            is_public = true
        )
    );

-- Running Board Sessions: Similar to training sessions
CREATE POLICY running_board_sessions_access ON public.running_board_sessions
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (
            user_id = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                LEFT JOIN public.faculty f ON f.user_id = up.id
                LEFT JOIN public.residents r ON r.user_id = running_board_sessions.user_id
                WHERE up.id = auth.uid()
                AND up.role IN ('faculty', 'program_director', 'super_admin')
                AND (f.program_id = r.program_id OR up.role = 'super_admin')
            )
        )
    );

CREATE POLICY running_board_sessions_insert ON public.running_board_sessions
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY running_board_sessions_update ON public.running_board_sessions
    FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_cases_updated_at BEFORE UPDATE ON public.clinical_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_attempts_updated_at BEFORE UPDATE ON public.case_attempts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vignettes_updated_at BEFORE UPDATE ON public.vignettes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON public.training_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_acls_scenarios_updated_at BEFORE UPDATE ON public.acls_scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_acls_sessions_updated_at BEFORE UPDATE ON public.acls_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_running_board_configs_updated_at BEFORE UPDATE ON public.running_board_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_running_board_sessions_updated_at BEFORE UPDATE ON public.running_board_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Create module entries for Learn bucket
-- ============================================================================
-- Note: This assumes module_buckets already exist. Run after seed-basic-data.sql

-- Insert modules for the Learn bucket
-- Get the Learn bucket ID (assuming it exists)
DO $$
DECLARE
    learn_bucket_id UUID;
    v_institution_id UUID := 'a0000000-0000-0000-0000-000000000001';
BEGIN
    -- Get Learn bucket ID
    SELECT id INTO learn_bucket_id
    FROM public.module_buckets
    WHERE module_buckets.institution_id = v_institution_id
    AND name = 'Learn'
    LIMIT 1;

    -- Only insert if bucket exists
    IF learn_bucket_id IS NOT NULL THEN
        -- Clinical Cases
        INSERT INTO public.modules (institution_id, bucket_id, slug, name, description, available_to_roles, is_active)
        VALUES (
            v_institution_id,
            learn_bucket_id,
            'clinical-cases',
            'Clinical Cases',
            'Practice with real clinical scenarios and patient cases',
            ARRAY['resident', 'faculty', 'program_director', 'super_admin'],
            true
        )
        ON CONFLICT (institution_id, slug) DO NOTHING;

        -- Difficult Conversations
        INSERT INTO public.modules (institution_id, bucket_id, slug, name, description, available_to_roles, is_active)
        VALUES (
            v_institution_id,
            learn_bucket_id,
            'difficult-conversations',
            'Difficult Conversations',
            'Practice essential communication skills for challenging medical situations',
            ARRAY['resident', 'faculty', 'program_director', 'super_admin'],
            true
        )
        ON CONFLICT (institution_id, slug) DO NOTHING;

        -- EKG & ACLS
        INSERT INTO public.modules (institution_id, bucket_id, slug, name, description, available_to_roles, is_active)
        VALUES (
            v_institution_id,
            learn_bucket_id,
            'ekg-acls',
            'EKG & ACLS',
            'Advanced cardiac life support training with interactive EKG simulations',
            ARRAY['resident', 'faculty', 'program_director', 'super_admin'],
            true
        )
        ON CONFLICT (institution_id, slug) DO NOTHING;

        -- Running the Board
        INSERT INTO public.modules (institution_id, bucket_id, slug, name, description, available_to_roles, is_active)
        VALUES (
            v_institution_id,
            learn_bucket_id,
            'running-board',
            'Running the Board',
            'Multi-patient emergency department simulation',
            ARRAY['resident', 'faculty', 'program_director', 'super_admin'],
            true
        )
        ON CONFLICT (institution_id, slug) DO NOTHING;
    END IF;
END $$;


