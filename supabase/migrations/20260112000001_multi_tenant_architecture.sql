-- ============================================================================
-- MULTI-TENANT ARCHITECTURE MIGRATION
-- Adds slugs to health_systems/programs for URL routing
-- Creates organization_memberships for explicit access tracking
-- Creates studio_creators for Studio access control
-- ============================================================================

-- ============================================================================
-- 1. ADD SLUGS TO HEALTH_SYSTEMS (Organizations)
-- ============================================================================

-- Add slug column for URL routing (e.g., 'mhs', 'emory')
ALTER TABLE public.health_systems
ADD COLUMN IF NOT EXISTS slug VARCHAR(50) UNIQUE;

-- Add settings column for org-specific configuration
ALTER TABLE public.health_systems
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Add is_active column
ALTER TABLE public.health_systems
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_health_systems_slug ON public.health_systems(slug);

COMMENT ON COLUMN public.health_systems.slug IS 'URL-friendly identifier for routing (e.g., mhs, emory)';
COMMENT ON COLUMN public.health_systems.settings IS 'Organization-specific settings (theme, features, etc.)';

-- ============================================================================
-- 2. ADD SLUGS TO PROGRAMS (Departments)
-- ============================================================================

-- Add slug column for URL routing (e.g., 'em', 'im', 'neuro')
ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS slug VARCHAR(50);

-- Add is_active column
ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create unique constraint on org + slug combination
ALTER TABLE public.programs
DROP CONSTRAINT IF EXISTS programs_health_system_slug_unique;

ALTER TABLE public.programs
ADD CONSTRAINT programs_health_system_slug_unique 
UNIQUE (health_system_id, slug);

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_programs_slug ON public.programs(slug);

COMMENT ON COLUMN public.programs.slug IS 'URL-friendly identifier within org (e.g., em, im)';

-- ============================================================================
-- 3. CREATE ORGANIZATION_MEMBERSHIPS TABLE
-- For explicit user-organization-program membership tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    health_system_id UUID NOT NULL REFERENCES public.health_systems(id) ON DELETE CASCADE,
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'super_admin',
        'admin',
        'program_director', 
        'assistant_program_director',
        'clerkship_director',
        'faculty', 
        'resident',
        'viewer'
    )),
    is_primary BOOLEAN DEFAULT false,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, health_system_id, program_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON public.organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_health_system ON public.organization_memberships(health_system_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_program ON public.organization_memberships(program_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_role ON public.organization_memberships(role);

COMMENT ON TABLE public.organization_memberships IS 'Explicit user memberships in organizations and programs';
COMMENT ON COLUMN public.organization_memberships.is_primary IS 'Primary org/program for user (for default routing)';
COMMENT ON COLUMN public.organization_memberships.expires_at IS 'Optional expiration for time-limited access';

-- ============================================================================
-- 4. CREATE STUDIO_CREATORS TABLE
-- For Studio access independent of organization membership
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.studio_creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    display_name VARCHAR(255),
    bio TEXT,
    affiliation VARCHAR(255),
    specialty VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    content_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_studio_creators_user ON public.studio_creators(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_creators_status ON public.studio_creators(status);

COMMENT ON TABLE public.studio_creators IS 'Studio content creators - separate from program memberships';
COMMENT ON COLUMN public.studio_creators.status IS 'Approval status: pending, approved, rejected, suspended';

-- ============================================================================
-- 5. CREATE STUDIO_CONTENT TABLE
-- Base table for all Studio-created content
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.studio_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.studio_creators(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('running_board_case', 'clinical_case', 'conversation', 'ekg_scenario')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    specialty VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    content_data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    version INT DEFAULT 1,
    published_at TIMESTAMPTZ,
    view_count INT DEFAULT 0,
    use_count INT DEFAULT 0,
    rating_avg DECIMAL(3,2),
    rating_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_studio_content_creator ON public.studio_content(creator_id);
CREATE INDEX IF NOT EXISTS idx_studio_content_type ON public.studio_content(content_type);
CREATE INDEX IF NOT EXISTS idx_studio_content_specialty ON public.studio_content(specialty);
CREATE INDEX IF NOT EXISTS idx_studio_content_status ON public.studio_content(status);
CREATE INDEX IF NOT EXISTS idx_studio_content_published ON public.studio_content(published_at DESC) WHERE status = 'published';

COMMENT ON TABLE public.studio_content IS 'All content created in Studio environment';
COMMENT ON COLUMN public.studio_content.content_data IS 'Type-specific content JSON (e.g., running board case data)';

-- ============================================================================
-- 6. TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS org_memberships_updated_at ON public.organization_memberships;
CREATE TRIGGER org_memberships_updated_at
    BEFORE UPDATE ON public.organization_memberships
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS studio_creators_updated_at ON public.studio_creators;
CREATE TRIGGER studio_creators_updated_at
    BEFORE UPDATE ON public.studio_creators
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS studio_content_updated_at ON public.studio_content;
CREATE TRIGGER studio_content_updated_at
    BEFORE UPDATE ON public.studio_content
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 7. HELPER FUNCTIONS FOR MULTI-TENANT ACCESS
-- ============================================================================

-- Check if user has access to a specific org/program
CREATE OR REPLACE FUNCTION public.has_org_access(
    p_health_system_slug VARCHAR,
    p_program_slug VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_health_system_id UUID;
    v_program_id UUID;
BEGIN
    -- Get health system ID
    SELECT id INTO v_health_system_id 
    FROM public.health_systems 
    WHERE slug = p_health_system_slug AND is_active = true;
    
    IF v_health_system_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- If no program specified, check org-level access
    IF p_program_slug IS NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM public.organization_memberships
            WHERE user_id = auth.uid()
            AND health_system_id = v_health_system_id
            AND (expires_at IS NULL OR expires_at > now())
        );
    END IF;
    
    -- Get program ID
    SELECT id INTO v_program_id 
    FROM public.programs 
    WHERE health_system_id = v_health_system_id 
    AND slug = p_program_slug 
    AND is_active = true;
    
    IF v_program_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check program-level access
    RETURN EXISTS (
        SELECT 1 FROM public.organization_memberships
        WHERE user_id = auth.uid()
        AND health_system_id = v_health_system_id
        AND (program_id = v_program_id OR program_id IS NULL)
        AND (expires_at IS NULL OR expires_at > now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has Studio access
CREATE OR REPLACE FUNCTION public.has_studio_access()
RETURNS BOOLEAN AS $$
BEGIN
    -- Studio access if: approved creator OR has any org membership
    RETURN EXISTS (
        SELECT 1 FROM public.studio_creators
        WHERE user_id = auth.uid() AND status = 'approved'
    ) OR EXISTS (
        SELECT 1 FROM public.organization_memberships
        WHERE user_id = auth.uid()
        AND (expires_at IS NULL OR expires_at > now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's primary organization/program
CREATE OR REPLACE FUNCTION public.get_user_primary_org()
RETURNS TABLE(
    health_system_id UUID,
    health_system_slug VARCHAR,
    health_system_name VARCHAR,
    program_id UUID,
    program_slug VARCHAR,
    program_name VARCHAR,
    role VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hs.id as health_system_id,
        hs.slug as health_system_slug,
        hs.name as health_system_name,
        p.id as program_id,
        p.slug as program_slug,
        p.name as program_name,
        om.role
    FROM public.organization_memberships om
    JOIN public.health_systems hs ON hs.id = om.health_system_id
    LEFT JOIN public.programs p ON p.id = om.program_id
    WHERE om.user_id = auth.uid()
    AND (om.expires_at IS NULL OR om.expires_at > now())
    ORDER BY om.is_primary DESC, om.created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.has_org_access(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_studio_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_primary_org() TO authenticated;

-- ============================================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_content ENABLE ROW LEVEL SECURITY;

-- Organization Memberships: Users can see their own, admins can see all in their org
DROP POLICY IF EXISTS "org_memberships_select" ON public.organization_memberships;
CREATE POLICY "org_memberships_select" ON public.organization_memberships
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR health_system_id IN (
            SELECT health_system_id FROM public.organization_memberships
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'program_director', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "org_memberships_insert" ON public.organization_memberships;
CREATE POLICY "org_memberships_insert" ON public.organization_memberships
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Only admins/PDs can add memberships
        health_system_id IN (
            SELECT health_system_id FROM public.organization_memberships
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'program_director', 'super_admin')
        )
        OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
    );

DROP POLICY IF EXISTS "org_memberships_update" ON public.organization_memberships;
CREATE POLICY "org_memberships_update" ON public.organization_memberships
    FOR UPDATE TO authenticated
    USING (
        health_system_id IN (
            SELECT health_system_id FROM public.organization_memberships
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'program_director', 'super_admin')
        )
        OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
    );

DROP POLICY IF EXISTS "org_memberships_delete" ON public.organization_memberships;
CREATE POLICY "org_memberships_delete" ON public.organization_memberships
    FOR DELETE TO authenticated
    USING (
        health_system_id IN (
            SELECT health_system_id FROM public.organization_memberships
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'program_director', 'super_admin')
        )
        OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
    );

-- Studio Creators: Users can see their own, super_admin can see all
DROP POLICY IF EXISTS "studio_creators_select" ON public.studio_creators;
CREATE POLICY "studio_creators_select" ON public.studio_creators
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
        OR status = 'approved' -- Approved creators are publicly visible
    );

DROP POLICY IF EXISTS "studio_creators_insert" ON public.studio_creators;
CREATE POLICY "studio_creators_insert" ON public.studio_creators
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "studio_creators_update" ON public.studio_creators;
CREATE POLICY "studio_creators_update" ON public.studio_creators
    FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid()
        OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
    );

-- Studio Content: Creators see their own, published content visible to all with Studio access
DROP POLICY IF EXISTS "studio_content_select" ON public.studio_content;
CREATE POLICY "studio_content_select" ON public.studio_content
    FOR SELECT TO authenticated
    USING (
        -- Creators see their own content
        creator_id IN (SELECT id FROM public.studio_creators WHERE user_id = auth.uid())
        -- Published content visible to anyone with Studio access
        OR (status = 'published' AND has_studio_access())
        -- Super admin sees all
        OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
    );

DROP POLICY IF EXISTS "studio_content_insert" ON public.studio_content;
CREATE POLICY "studio_content_insert" ON public.studio_content
    FOR INSERT TO authenticated
    WITH CHECK (
        creator_id IN (
            SELECT id FROM public.studio_creators 
            WHERE user_id = auth.uid() AND status = 'approved'
        )
    );

DROP POLICY IF EXISTS "studio_content_update" ON public.studio_content;
CREATE POLICY "studio_content_update" ON public.studio_content
    FOR UPDATE TO authenticated
    USING (
        creator_id IN (SELECT id FROM public.studio_creators WHERE user_id = auth.uid())
        OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
    );

DROP POLICY IF EXISTS "studio_content_delete" ON public.studio_content;
CREATE POLICY "studio_content_delete" ON public.studio_content
    FOR DELETE TO authenticated
    USING (
        creator_id IN (SELECT id FROM public.studio_creators WHERE user_id = auth.uid())
        OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
    );

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.has_org_access IS 'Check if current user has access to org/program by slug';
COMMENT ON FUNCTION public.has_studio_access IS 'Check if current user has Studio access (creator OR org member)';
COMMENT ON FUNCTION public.get_user_primary_org IS 'Get user primary organization and program for default routing';

-- ============================================================================
-- 10. HELPER FUNCTION: Increment content count for creator
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_content_count(creator_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.studio_creators
    SET content_count = content_count + 1,
        updated_at = now()
    WHERE id = creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_content_count(UUID) TO authenticated;
