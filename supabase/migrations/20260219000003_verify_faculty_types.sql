-- ============================================================================
-- FACULTY TYPE VERIFICATION
-- ============================================================================
-- All 14 MHS EM faculty were defaulted to 'core' in the original migration.
-- This migration documents the correct roles/credentials and confirms types.
--
-- Core Faculty: Rate ALL residents in a class (required)
-- Teaching Faculty: Open roster, rate any residents (recommended min 3)
-- ============================================================================

-- MHS EM Faculty Roster:
--   1. Leon Melnitsky, DO              -> core (Program Director)
--   2. Hanan Atia, MD                  -> core (Assistant Program Director)
--   3. Alfa Diallo, MD, MPH            -> core
--   4. Brian Kohen, MD                 -> core
--   5. David Hooke, DO                 -> core
--   6. Donny Perez, DO                 -> core
--   7. Eric Boccio, MD                 -> core
--   8. Franz C Mendoza-Garcia, MD      -> core
--   9. Jheanelle McKay, MD             -> core
--  10. Lara Goldstein, MD, PhD         -> core
--  11. Michael Remaly, DO              -> core
--  12. Sandra Lopez, MD                -> core
--  13. Steven Katz, MD                 -> core
--  14. Yehuda Wenger, MD               -> core

-- Fix "Hudi Wenger" display name to "Yehuda Wenger, MD"
UPDATE public.user_profiles
SET full_name = 'Yehuda Wenger, MD'
WHERE full_name ILIKE '%Hudi Wenger%';

UPDATE public.faculty
SET full_name = 'Yehuda Wenger, MD', credentials = 'MD'
WHERE full_name ILIKE '%Hudi Wenger%';

-- Ensure credentials are set for Donny Perez and Franz Mendoza-Garcia
UPDATE public.faculty
SET credentials = 'DO'
WHERE full_name ILIKE '%Donny Perez%' AND (credentials IS NULL OR credentials = '');

UPDATE public.faculty
SET credentials = 'MD'
WHERE full_name ILIKE '%Franz%Mendoza%' AND (credentials IS NULL OR credentials = '');

-- To switch any faculty to 'teaching' in the future, run:
-- UPDATE public.user_profiles SET faculty_type = 'teaching'
-- WHERE full_name ILIKE '%Name%' AND faculty_type = 'core';

-- Verify:
-- SELECT f.full_name, f.credentials, up.faculty_type, up.email
-- FROM faculty f JOIN user_profiles up ON f.user_id = up.id
-- WHERE f.is_active = true ORDER BY f.full_name;
