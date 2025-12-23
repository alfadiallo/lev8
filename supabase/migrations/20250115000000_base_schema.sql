-- Base Schema Migration
-- Creates core tables: health_systems, programs, user_profiles, residents, faculty, etc.
-- Run this BEFORE the learning_modules migration

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
    pgm_director_id UUID, -- Will reference user_profiles once created
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
    class_year VARCHAR NOT NULL,
    start_date DATE,
    graduation_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- 4. USER PROFILES (Linked to Supabase Auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY, -- References Supabase Auth users
    email VARCHAR NOT NULL,
    full_name VARCHAR,
    phone VARCHAR,
    role VARCHAR NOT NULL CHECK (role IN ('resident', 'faculty', 'program_director', 'super_admin')),
    institution_id UUID NOT NULL REFERENCES public.health_systems(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(email, institution_id)
);

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
-- 7. DEVICE TRUSTS (for 2FA bypass)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.device_trusts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR NOT NULL,
    ip_address VARCHAR,
    user_agent TEXT,
    trust_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, device_fingerprint)
);

-- ============================================================================
-- 8. MODULE BUCKETS
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
-- 9. VOICE JOURNAL (Grow Module)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.grow_voice_journal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    audio_blob_url TEXT NOT NULL,
    transcription TEXT,
    claude_summary TEXT,
    transcription_confidence DECIMAL(3,2),
    recording_duration_seconds INTEGER,
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- 10. UPDATE PROGRAMS FOREIGN KEY (now that user_profiles exists)
-- ============================================================================
DO $$ 
BEGIN
  -- Only add the constraint if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'programs_pgm_director_id_fkey'
    AND table_name = 'programs'
  ) THEN
    ALTER TABLE public.programs 
    ADD CONSTRAINT programs_pgm_director_id_fkey 
    FOREIGN KEY (pgm_director_id) 
    REFERENCES public.user_profiles(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_institution ON public.user_profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_residents_user_id ON public.residents(user_id);
CREATE INDEX IF NOT EXISTS idx_residents_program ON public.residents(program_id);
CREATE INDEX IF NOT EXISTS idx_faculty_user_id ON public.faculty(user_id);
CREATE INDEX IF NOT EXISTS idx_device_trusts_user ON public.device_trusts(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_journal_resident ON public.grow_voice_journal(resident_id);



