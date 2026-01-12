-- ============================================================================
-- SEED MEMORIAL HEALTHCARE SYSTEM SLUGS
-- Migrates existing Memorial data to use the new multi-tenant URL structure
-- ============================================================================

-- Update Memorial Healthcare System with slug
UPDATE public.health_systems
SET slug = 'mhs',
    settings = jsonb_build_object(
        'theme', 'default',
        'features', jsonb_build_object(
            'running_board', true,
            'clinical_cases', true,
            'voice_journal', true,
            'swot_analysis', true
        )
    )
WHERE name ILIKE '%memorial%' 
   OR abbreviation ILIKE '%mhs%';

-- Update Emergency Medicine program with slug
UPDATE public.programs
SET slug = 'em'
WHERE specialty ILIKE '%emergency%'
   OR name ILIKE '%emergency%';

-- Update Internal Medicine program with slug (if exists)
UPDATE public.programs
SET slug = 'im'
WHERE specialty ILIKE '%internal%'
   OR name ILIKE '%internal medicine%';

-- Update Neurology program with slug (if exists)
UPDATE public.programs
SET slug = 'neuro'
WHERE specialty ILIKE '%neurology%'
   OR name ILIKE '%neuro%';

-- ============================================================================
-- MIGRATE EXISTING USER ACCESS TO organization_memberships
-- Creates membership records based on existing user_profiles/residents/faculty
-- ============================================================================

-- Insert memberships for existing users based on their institution_id
-- This creates org-level access for all existing users
-- Only include users that exist in auth.users (some user_profiles may be orphaned)
INSERT INTO public.organization_memberships (user_id, health_system_id, program_id, role, is_primary, granted_at)
SELECT DISTINCT
    up.id as user_id,
    up.institution_id as health_system_id,
    COALESCE(r.program_id, f.program_id) as program_id,
    up.role,
    true as is_primary,
    now() as granted_at
FROM public.user_profiles up
LEFT JOIN public.residents r ON r.user_id = up.id
LEFT JOIN public.faculty f ON f.user_id = up.id
WHERE up.institution_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = up.id)
ON CONFLICT (user_id, health_system_id, program_id) DO NOTHING;

-- ============================================================================
-- VERIFY MIGRATION
-- ============================================================================

-- Log migration status
DO $$
DECLARE
    v_hs_count INT;
    v_prog_count INT;
    v_membership_count INT;
BEGIN
    SELECT COUNT(*) INTO v_hs_count FROM public.health_systems WHERE slug IS NOT NULL;
    SELECT COUNT(*) INTO v_prog_count FROM public.programs WHERE slug IS NOT NULL;
    SELECT COUNT(*) INTO v_membership_count FROM public.organization_memberships;
    
    RAISE NOTICE 'Migration complete:';
    RAISE NOTICE '  - Health systems with slugs: %', v_hs_count;
    RAISE NOTICE '  - Programs with slugs: %', v_prog_count;
    RAISE NOTICE '  - Organization memberships created: %', v_membership_count;
END $$;
