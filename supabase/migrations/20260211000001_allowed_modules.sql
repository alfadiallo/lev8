-- Add per-user module access list to user_profiles
-- When non-null and non-empty, overrides role-based module visibility.
-- Slugs: learn, reflect, understand, studio, truths, expectations

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS allowed_modules TEXT[] DEFAULT NULL;

COMMENT ON COLUMN public.user_profiles.allowed_modules IS 'Optional per-user module allow list. When set, user can only access these modules. NULL = use role-based defaults.';
