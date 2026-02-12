-- Allow studio_creator and other app roles on user_profiles.role
-- (Base schema only had resident, faculty, program_director, super_admin)

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN (
    'resident',
    'faculty',
    'program_director',
    'assistant_program_director',
    'clerkship_director',
    'studio_creator',
    'super_admin',
    'admin'
  ));

COMMENT ON COLUMN public.user_profiles.role IS 'Platform role: resident (Learn only), studio_creator (Learn + Studio), faculty+, super_admin, admin';
