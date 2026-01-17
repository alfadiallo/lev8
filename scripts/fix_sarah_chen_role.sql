INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    institution_id,
    source
) VALUES (
    gen_random_uuid(),
    'sarah.chen@hospital.edu',
    'Sarah Chen',
    'program_director',
    (SELECT id FROM health_systems LIMIT 1), -- Assign to the first available health system (likely County General)
    'lev8'
) ON CONFLICT (email) DO UPDATE SET
    role = 'program_director',
    full_name = 'Sarah Chen';
