-- ============================================================================
-- GRANT STUDIO CREATOR ACCESS TO ALL EXISTING USERS
-- This migration adds approved studio_creators entries for all users with profiles
-- ============================================================================

-- Insert studio_creators for all user_profiles that don't already have one
INSERT INTO public.studio_creators (user_id, status, approved_at, content_count, display_name, affiliation)
SELECT 
    up.id,
    'approved',
    NOW(),
    0,
    COALESCE(up.full_name, up.email),
    COALESCE(
        (SELECT hs.name FROM public.health_systems hs WHERE hs.id = up.institution_id),
        'Medical Educator'
    )
FROM public.user_profiles up
WHERE EXISTS (SELECT 1 FROM auth.users au WHERE au.id = up.id)
ON CONFLICT (user_id) DO UPDATE SET
    status = 'approved',
    approved_at = COALESCE(public.studio_creators.approved_at, NOW());

-- Log count
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.studio_creators WHERE status = 'approved';
    RAISE NOTICE '✅ % users now have Studio creator access', v_count;
END $$;
