-- ============================================================================
-- STUDIO: CURRICULUM MAPPING & VERSIONING
-- Adds curriculum reference tables, versioning, and updates studio_content
-- ============================================================================

-- ============================================================================
-- 1. SPECIALTY CURRICULA (EM, IM, Neuro, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.specialty_curricula (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialty VARCHAR(100) NOT NULL,          -- 'emergency_medicine', 'internal_medicine'
    name VARCHAR(255) NOT NULL,               -- '18-Month EM Curriculum'
    version VARCHAR(50) NOT NULL DEFAULT 'v1', -- 'v3'
    total_months INT NOT NULL,                -- 18
    description TEXT,
    source_reference TEXT,                    -- 'Based on 2022 Model of Clinical Practice'
    data JSONB,                               -- Full curriculum JSON if needed
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(specialty, version)
);

CREATE INDEX IF NOT EXISTS idx_specialty_curricula_specialty ON public.specialty_curricula(specialty);

COMMENT ON TABLE public.specialty_curricula IS 'Specialty-specific didactic curricula (e.g., 18-month EM curriculum)';

-- ============================================================================
-- 2. CURRICULUM TOPICS (Month/Week breakdown)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.curriculum_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_id UUID NOT NULL REFERENCES public.specialty_curricula(id) ON DELETE CASCADE,
    month INT NOT NULL CHECK (month >= 1),
    week INT NOT NULL CHECK (week >= 1 AND week <= 5),
    month_name VARCHAR(255),                  -- 'Resuscitation & Acute Signs/Symptoms'
    core_content TEXT,                        -- 'Approach to critically ill patient; ABCDE'
    tintinalli_chapters TEXT[],               -- ARRAY['Ch 11', 'Ch 12', 'Ch 13']
    rosh_topics TEXT[],                       -- ARRAY['Shock', 'Sepsis']
    ultrasound_competency TEXT,
    procedures_sim TEXT,
    conference_type VARCHAR(100),             -- 'Journal Club', 'M&M', 'Case Conference'
    learning_objectives TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(curriculum_id, month, week)
);

CREATE INDEX IF NOT EXISTS idx_curriculum_topics_curriculum ON public.curriculum_topics(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_topics_month_week ON public.curriculum_topics(month, week);

COMMENT ON TABLE public.curriculum_topics IS 'Weekly topics within a specialty curriculum';

-- ============================================================================
-- 3. UPDATE STUDIO_CONTENT FOR CURRICULUM MAPPING
-- ============================================================================

-- Add curriculum mapping column
ALTER TABLE public.studio_content
ADD COLUMN IF NOT EXISTS curriculum_mapping JSONB;
-- Example: { "curriculum_id": "uuid", "topic_id": "uuid", "month": 2, "week": 1 }

-- Add forked_from reference
ALTER TABLE public.studio_content
ADD COLUMN IF NOT EXISTS forked_from UUID REFERENCES public.studio_content(id) ON DELETE SET NULL;

-- Add current_version tracking
ALTER TABLE public.studio_content
ADD COLUMN IF NOT EXISTS current_version INT DEFAULT 1;

-- Add complexity/difficulty level
ALTER TABLE public.studio_content
ADD COLUMN IF NOT EXISTS complexity INT CHECK (complexity >= 1 AND complexity <= 5);

-- Add learning objectives
ALTER TABLE public.studio_content
ADD COLUMN IF NOT EXISTS learning_objectives TEXT[];

-- Add tags for searchability
ALTER TABLE public.studio_content
ADD COLUMN IF NOT EXISTS tags TEXT[];

CREATE INDEX IF NOT EXISTS idx_studio_content_curriculum ON public.studio_content USING GIN (curriculum_mapping);
CREATE INDEX IF NOT EXISTS idx_studio_content_tags ON public.studio_content USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_studio_content_forked_from ON public.studio_content(forked_from);

-- ============================================================================
-- 4. STUDIO CONTENT VERSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.studio_content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES public.studio_content(id) ON DELETE CASCADE,
    version INT NOT NULL,
    data JSONB NOT NULL,                      -- Snapshot of content at this version
    curriculum_mapping JSONB,                 -- Snapshot of mapping at this version
    change_summary TEXT,                      -- 'Added deterioration phase, fixed vitals'
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_id, version)
);

CREATE INDEX IF NOT EXISTS idx_studio_content_versions_content ON public.studio_content_versions(content_id);

COMMENT ON TABLE public.studio_content_versions IS 'Immutable version history for published studio content';

-- ============================================================================
-- 5. STUDIO CONTENT USAGE (Track which programs use which content)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.studio_content_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES public.studio_content(id) ON DELETE CASCADE,
    content_version INT NOT NULL,
    health_system_id UUID NOT NULL REFERENCES public.health_systems(id) ON DELETE CASCADE,
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    pulled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pulled_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(content_id, health_system_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_studio_content_usage_content ON public.studio_content_usage(content_id);
CREATE INDEX IF NOT EXISTS idx_studio_content_usage_program ON public.studio_content_usage(health_system_id, program_id);

COMMENT ON TABLE public.studio_content_usage IS 'Tracks which programs have pulled studio content';

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

ALTER TABLE public.specialty_curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_content_usage ENABLE ROW LEVEL SECURITY;

-- Curricula are readable by all authenticated users
CREATE POLICY "specialty_curricula_select_authenticated" ON public.specialty_curricula
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Topics are readable by all authenticated users
CREATE POLICY "curriculum_topics_select_authenticated" ON public.curriculum_topics
    FOR SELECT TO authenticated
    USING (true);

-- Content versions readable by content owner or if content is published
CREATE POLICY "studio_content_versions_select" ON public.studio_content_versions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.studio_content sc
            WHERE sc.id = content_id
            AND (sc.creator_id = auth.uid() OR sc.status = 'published')
        )
    );

-- Usage tracking readable by org admins or super admins
CREATE POLICY "studio_content_usage_select" ON public.studio_content_usage
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'super_admin')
        OR EXISTS (
            SELECT 1 FROM public.organization_memberships om
            WHERE om.user_id = auth.uid()
            AND om.health_system_id = studio_content_usage.health_system_id
            AND om.role IN ('admin', 'program_director')
        )
    );

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to create a new version when publishing
CREATE OR REPLACE FUNCTION public.create_content_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only create version when status changes to 'published'
    IF NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published') THEN
        INSERT INTO public.studio_content_versions (
            content_id,
            version,
            data,
            curriculum_mapping,
            change_summary,
            created_by
        ) VALUES (
            NEW.id,
            NEW.current_version,
            NEW.data,
            NEW.curriculum_mapping,
            'Published version ' || NEW.current_version,
            NEW.creator_id
        );
        
        -- Increment version for next publish
        NEW.current_version := NEW.current_version + 1;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger for auto-versioning
DROP TRIGGER IF EXISTS trg_create_content_version ON public.studio_content;
CREATE TRIGGER trg_create_content_version
    BEFORE UPDATE ON public.studio_content
    FOR EACH ROW
    EXECUTE FUNCTION public.create_content_version();

-- Function to fork content
CREATE OR REPLACE FUNCTION public.fork_studio_content(
    source_content_id UUID,
    new_creator_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_content_id UUID;
    source_content RECORD;
BEGIN
    -- Get the source content
    SELECT * INTO source_content
    FROM public.studio_content
    WHERE id = source_content_id AND status = 'published';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source content not found or not published';
    END IF;
    
    -- Create the forked content
    INSERT INTO public.studio_content (
        creator_id,
        content_type,
        title,
        description,
        status,
        is_global,
        data,
        curriculum_mapping,
        complexity,
        learning_objectives,
        tags,
        forked_from,
        current_version
    ) VALUES (
        new_creator_id,
        source_content.content_type,
        source_content.title || ' (Fork)',
        source_content.description,
        'draft',
        false,
        source_content.data,
        source_content.curriculum_mapping,
        source_content.complexity,
        source_content.learning_objectives,
        source_content.tags,
        source_content_id,
        1
    ) RETURNING id INTO new_content_id;
    
    RETURN new_content_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fork_studio_content(UUID, UUID) TO authenticated;

-- ============================================================================
-- 8. UPDATED_AT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS specialty_curricula_updated_at ON public.specialty_curricula;
CREATE TRIGGER specialty_curricula_updated_at
    BEFORE UPDATE ON public.specialty_curricula
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
