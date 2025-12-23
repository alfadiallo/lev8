-- ============================================================================
-- Setup Base Schema for MED-001 Vignette
-- Creates all required tables if they don't exist
-- Run this FIRST before importing vignettes
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. HEALTH SYSTEMS (Institutions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.health_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    abbreviation VARCHAR,
    location VARCHAR,
    contact_email VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- 2. PROGRAMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    health_system_id UUID NOT NULL REFERENCES public.health_systems(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    specialty VARCHAR,
    pgm_director_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(health_system_id, name)
);

-- ============================================================================
-- 3. ACADEMIC CLASSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.academic_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    class_year VARCHAR(10) NOT NULL, -- Changed from VARCHAR to VARCHAR(10) to allow 'PGY-1', 'PGY-2', etc.
    start_date DATE,
    graduation_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Fix existing table if class_year is too short
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academic_classes') THEN
        -- Check current column definition
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'academic_classes' 
            AND column_name = 'class_year'
            AND character_maximum_length IS NOT NULL
            AND character_maximum_length < 10
        ) THEN
            -- Alter column to allow longer values
            ALTER TABLE public.academic_classes 
            ALTER COLUMN class_year TYPE VARCHAR(10);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 4. USER PROFILES (Linked to Supabase Auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY, -- References Supabase Auth users
    email VARCHAR NOT NULL,
    full_name VARCHAR,
    phone VARCHAR,
    role VARCHAR NOT NULL CHECK (role IN ('resident', 'faculty', 'program_director', 'super_admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add institution_id column if it doesn't exist
DO $$
DECLARE
    default_inst_id UUID;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'institution_id'
    ) THEN
        -- Ensure health_systems has at least one row
        SELECT id INTO default_inst_id FROM public.health_systems LIMIT 1;
        
        IF default_inst_id IS NULL THEN
            -- Create a default health system
            INSERT INTO public.health_systems (id, name, abbreviation, location)
            VALUES (gen_random_uuid(), 'Default Institution', 'DEFAULT', 'Unknown')
            RETURNING id INTO default_inst_id;
        END IF;
        
        -- Add column as nullable first
        ALTER TABLE public.user_profiles 
        ADD COLUMN institution_id UUID;
        
        -- Update existing rows
        UPDATE public.user_profiles 
        SET institution_id = default_inst_id 
        WHERE institution_id IS NULL;
        
        -- Make it NOT NULL
        ALTER TABLE public.user_profiles 
        ALTER COLUMN institution_id SET NOT NULL;
        
        -- Add foreign key constraint
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_institution_id_fkey 
        FOREIGN KEY (institution_id) REFERENCES public.health_systems(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND constraint_name = 'user_profiles_email_institution_id_key'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_email_institution_id_key 
        UNIQUE(email, institution_id);
    END IF;
END $$;

-- ============================================================================
-- 5. RESIDENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.academic_classes(id) ON DELETE RESTRICT,
    medical_school VARCHAR,
    specialty VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- 6. FACULTY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
    title VARCHAR,
    department VARCHAR,
    is_evaluator BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- 7. MODULE BUCKETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.module_buckets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.health_systems(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(institution_id, name)
);

-- ============================================================================
-- 8. MODULES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.health_systems(id) ON DELETE CASCADE,
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

-- Make institution_id nullable if table already exists (for global modules)
-- This must run even if the table was just created, as the constraint might exist
DO $$
BEGIN
    -- Always try to drop NOT NULL constraint if it exists
    BEGIN
        ALTER TABLE public.modules ALTER COLUMN institution_id DROP NOT NULL;
        RAISE NOTICE 'Made modules.institution_id nullable';
    EXCEPTION
        WHEN OTHERS THEN
            -- Constraint might not exist, or column might already be nullable
            RAISE NOTICE 'modules.institution_id is already nullable or constraint does not exist';
    END;
END $$;

-- ============================================================================
-- 9. VIGNETTES (Difficult Conversations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vignettes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.health_systems(id) ON DELETE CASCADE,
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

-- Make institution_id nullable if table already exists (for global vignettes)
-- This must run even if the table was just created, as the constraint might exist
DO $$
BEGIN
    -- Always try to drop NOT NULL constraint if it exists
    BEGIN
        ALTER TABLE public.vignettes ALTER COLUMN institution_id DROP NOT NULL;
        RAISE NOTICE 'Made vignettes.institution_id nullable';
    EXCEPTION
        WHEN OTHERS THEN
            -- Constraint might not exist, or column might already be nullable
            RAISE NOTICE 'vignettes.institution_id is already nullable or constraint does not exist';
    END;
END $$;

-- ============================================================================
-- 10. TRAINING SESSIONS
-- ============================================================================
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

-- ============================================================================
-- 11. SESSION ANALYTICS
-- ============================================================================
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
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_institution ON public.user_profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_vignettes_institution ON public.vignettes(institution_id);
CREATE INDEX IF NOT EXISTS idx_vignettes_category ON public.vignettes(category);
CREATE INDEX IF NOT EXISTS idx_vignettes_active ON public.vignettes(is_active);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user ON public.training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_vignette ON public.training_sessions(vignette_id);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I;
            CREATE TRIGGER update_%s_updated_at
                BEFORE UPDATE ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', r.table_name, r.table_name, r.table_name, r.table_name);
    END LOOP;
END $$;

SELECT '✅ Base schema setup complete!' as status;

