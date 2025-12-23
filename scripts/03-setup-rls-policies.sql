-- ============================================================================
-- Row Level Security (RLS) Policies
-- Enable RLS and create policies for secure data access
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.health_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vignettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HEALTH SYSTEMS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS health_systems_select ON public.health_systems;
CREATE POLICY health_systems_select ON public.health_systems
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PROGRAMS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS programs_select ON public.programs;
CREATE POLICY programs_select ON public.programs
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.institution_id = programs.health_system_id
        )
    );

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
CREATE POLICY user_profiles_select ON public.user_profiles
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (
            id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid()
                AND up.institution_id = user_profiles.institution_id
            )
        )
    );

-- ============================================================================
-- VIGNETTES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS vignettes_access ON public.vignettes;
CREATE POLICY vignettes_access ON public.vignettes
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        is_active = true AND
        (
            -- Global vignettes (institution_id IS NULL) are available to everyone
            vignettes.institution_id IS NULL
            OR
            -- Institution-specific vignettes are available to users from that institution
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.institution_id = vignettes.institution_id
            )
            OR
            -- Public vignettes are available to everyone
            is_public = true
        )
    );

-- Allow educators to manage vignettes
-- Global vignettes (institution_id IS NULL) can be managed by any educator
-- Institution-specific vignettes can only be managed by educators from that institution
DROP POLICY IF EXISTS vignettes_manage ON public.vignettes;
CREATE POLICY vignettes_manage ON public.vignettes
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND up.role IN ('faculty', 'program_director', 'super_admin')
            AND (
                vignettes.institution_id IS NULL -- Global vignettes: any educator can manage
                OR up.institution_id = vignettes.institution_id -- Institution-specific: only educators from that institution
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND up.role IN ('faculty', 'program_director', 'super_admin')
            AND (
                vignettes.institution_id IS NULL -- Global vignettes: any educator can manage
                OR up.institution_id = vignettes.institution_id -- Institution-specific: only educators from that institution
            )
        )
    );

-- ============================================================================
-- TRAINING SESSIONS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS training_sessions_select ON public.training_sessions;
CREATE POLICY training_sessions_select ON public.training_sessions
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid()
                AND up.role IN ('faculty', 'program_director', 'super_admin')
                AND EXISTS (
                    SELECT 1 FROM public.user_profiles up2
                    WHERE up2.id = training_sessions.user_id
                    AND up2.institution_id = up.institution_id
                )
            )
        )
    );

DROP POLICY IF EXISTS training_sessions_insert ON public.training_sessions;
CREATE POLICY training_sessions_insert ON public.training_sessions
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS training_sessions_update ON public.training_sessions;
CREATE POLICY training_sessions_update ON public.training_sessions
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- SESSION ANALYTICS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS session_analytics_select ON public.session_analytics;
CREATE POLICY session_analytics_select ON public.session_analytics
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (
            EXISTS (
                SELECT 1 FROM public.training_sessions ts
                WHERE ts.id = session_analytics.session_id
                AND ts.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid()
                AND up.role IN ('faculty', 'program_director', 'super_admin')
            )
        )
    );

SELECT '✅ RLS policies created!' as status;

