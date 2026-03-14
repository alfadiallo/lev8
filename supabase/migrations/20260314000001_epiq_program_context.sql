-- Add institution and program context to epiq_profiles for scope headers.

ALTER TABLE public.epiq_profiles
  ADD COLUMN IF NOT EXISTS institution_name TEXT DEFAULT 'Grey Sloan Memorial Hospital',
  ADD COLUMN IF NOT EXISTS program_name TEXT DEFAULT 'Emergency Medicine Residency';

UPDATE public.epiq_profiles
SET institution_name = 'Grey Sloan Memorial Hospital',
    program_name = 'Emergency Medicine Residency'
WHERE institution_name IS NULL;
