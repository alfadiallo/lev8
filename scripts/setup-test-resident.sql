-- ============================================================================
-- SETUP TEST RESIDENT: Kenholton90@gmail.com
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================================

-- Step 1: Create auth user (run in Supabase Dashboard > Authentication > Users > Add User)
-- Email: Kenholton90@gmail.com
-- Password: Test1234
-- Auto Confirm: YES (check the box)

-- After creating the user in the Auth dashboard, get the user ID and run the rest:

-- Step 2: Get the user ID (run this after creating auth user)
-- SELECT id FROM auth.users WHERE email = 'Kenholton90@gmail.com';
-- Copy the UUID result and replace 'USER_ID_HERE' below

-- ============================================================================
-- IMPORTANT: Replace USER_ID_HERE with the actual UUID from Step 2
-- ============================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_hs_id UUID;
    v_program_id UUID;
BEGIN
    -- Get the user ID (case-insensitive match)
    SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER('kenholton90@gmail.com');
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User kenholton90@gmail.com not found in auth.users. Create them first in Authentication > Users';
    END IF;
    
    -- Get MHS health system ID
    SELECT id INTO v_hs_id FROM public.health_systems WHERE slug = 'mhs';
    
    IF v_hs_id IS NULL THEN
        RAISE EXCEPTION 'MHS health system not found. Run migrations first.';
    END IF;
    
    -- Get EM program ID
    SELECT id INTO v_program_id FROM public.programs WHERE slug = 'em' AND health_system_id = v_hs_id;
    
    IF v_program_id IS NULL THEN
        RAISE EXCEPTION 'EM program not found. Run migrations first.';
    END IF;
    
    -- Create user_profile (using correct schema: full_name, institution_id required)
    INSERT INTO public.user_profiles (id, email, full_name, role, institution_id, created_at, updated_at)
    VALUES (v_user_id, 'kenholton90@gmail.com', 'Ken Holton', 'resident', v_hs_id, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        full_name = 'Ken Holton',
        role = 'resident',
        updated_at = NOW();
    
    RAISE NOTICE 'Created/updated user_profile for %', v_user_id;
    
    -- Create organization_membership for MHS EM
    INSERT INTO public.organization_memberships (user_id, health_system_id, program_id, role, is_primary, granted_at)
    VALUES (v_user_id, v_hs_id, v_program_id, 'resident', true, NOW())
    ON CONFLICT (user_id, health_system_id, program_id) DO UPDATE SET
        role = 'resident',
        is_primary = true;
    
    RAISE NOTICE 'Created/updated organization_membership for MHS EM';
    
    -- Create studio_creators entry (approved for immediate access)
    INSERT INTO public.studio_creators (user_id, status, approved_at, content_count)
    VALUES (v_user_id, 'approved', NOW(), 0)
    ON CONFLICT (user_id) DO UPDATE SET
        status = 'approved',
        approved_at = NOW();
    
    RAISE NOTICE 'Created/updated studio_creators entry (approved)';
    
    RAISE NOTICE '✅ Setup complete for Kenholton90@gmail.com';
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Access: MHS EM (resident) + Studio (creator)';
    RAISE NOTICE 'Password: Test1234';
END $$;

-- Verify the setup
SELECT 
    'user_profile' as table_name,
    up.id,
    up.email,
    up.full_name,
    up.role
FROM public.user_profiles up
WHERE LOWER(up.email) = LOWER('kenholton90@gmail.com');

SELECT 
    'organization_membership' as table_name,
    om.user_id,
    hs.name as org_name,
    p.name as program_name,
    om.role,
    om.is_primary
FROM public.organization_memberships om
JOIN public.health_systems hs ON om.health_system_id = hs.id
LEFT JOIN public.programs p ON om.program_id = p.id
WHERE om.user_id = (SELECT id FROM auth.users WHERE LOWER(email) = LOWER('kenholton90@gmail.com'));

SELECT 
    'studio_creator' as table_name,
    sc.user_id,
    sc.status,
    sc.approved_at
FROM public.studio_creators sc
WHERE sc.user_id = (SELECT id FROM auth.users WHERE LOWER(email) = LOWER('kenholton90@gmail.com'));
