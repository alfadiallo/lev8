-- Update role labels: Intern -> PGY 1, R1 -> PGY 2, R2 -> PGY 3, R3 -> PGY 4

-- Drop the old CHECK constraint
ALTER TABLE public.epiq_profiles DROP CONSTRAINT IF EXISTS epiq_profiles_role_check;

-- Update the role values
UPDATE public.epiq_profiles SET role = 'PGY 1' WHERE role = 'Intern';
UPDATE public.epiq_profiles SET role = 'PGY 2' WHERE role = 'R1';
UPDATE public.epiq_profiles SET role = 'PGY 3' WHERE role = 'R2';
UPDATE public.epiq_profiles SET role = 'PGY 4' WHERE role = 'R3';

-- Add updated CHECK constraint
ALTER TABLE public.epiq_profiles
    ADD CONSTRAINT epiq_profiles_role_check
    CHECK (role IN ('MS3', 'MS4', 'PGY 1', 'PGY 2', 'PGY 3', 'PGY 4'));
