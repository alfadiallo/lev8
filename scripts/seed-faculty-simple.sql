-- ============================================================================
-- SEED FACULTY DATA (SIMPLIFIED)
-- ============================================================================
-- Creates 13 faculty members for Memorial Healthcare System EM program
-- Note: user_id will be NULL until faculty members sign up through auth

DO $$
DECLARE
  v_program_id UUID;
  v_program_name TEXT;
BEGIN
  -- Try to find Emergency Medicine program (try exact name first)
  SELECT id, name INTO v_program_id, v_program_name
  FROM public.programs
  WHERE name = 'Emergency Medicine Residency'
  LIMIT 1;

  -- If not found, try case-insensitive search
  IF v_program_id IS NULL THEN
    SELECT id, name INTO v_program_id, v_program_name
    FROM public.programs
    WHERE name ILIKE '%Emergency%Medicine%'
    LIMIT 1;
  END IF;

  -- If still not found, get the first program (fallback)
  IF v_program_id IS NULL THEN
    SELECT id, name INTO v_program_id, v_program_name
    FROM public.programs
    LIMIT 1;
  END IF;

  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'No programs found in database. Please create a program first.';
  END IF;

  RAISE NOTICE 'Using program: % (ID: %)', v_program_name, v_program_id;

  -- Insert all 13 faculty members
  INSERT INTO public.faculty (full_name, credentials, email, program_id, is_active)
  VALUES 
    ('Hanan Atia', 'MD', 'hatia@mhs.net', v_program_id, true),
    ('Alfa Diallo', 'MD, MPH', 'adiallo@mhs.net', v_program_id, true),
    ('Lara Goldstein', 'MD, PhD', 'lgoldstein@mhs.net', v_program_id, true),
    ('David Hooke', 'DO', 'dhooke@mhs.net', v_program_id, true),
    ('Brian Kohen', 'MD', 'bkohen@mhs.net', v_program_id, true),
    ('Randy Katz', 'DO', 'rkatz@mhs.net', v_program_id, true),
    ('Steven Katz', 'MD', 'skatz@mhs.net', v_program_id, true),
    ('Sandra Lopez', 'MD', 'slopez@mhs.net', v_program_id, true),
    ('Leon Melnitsky', 'DO', 'lmelnitsky@mhs.net', v_program_id, true),
    ('Franz Mendoza-Garcia', 'MD', 'fmendoza@mhs.net', v_program_id, true),
    ('Jheanelle McKay', 'MD', 'jmckay@mhs.net', v_program_id, true),
    ('Donny Perez', 'DO', 'dperez@mhs.net', v_program_id, true),
    ('Hudi Wenger', 'MD', 'hwenger@mhs.net', v_program_id, true)
  ON CONFLICT (email) DO NOTHING;

  RAISE NOTICE 'Successfully seeded 13 faculty members';
END $$;

-- Verification query
SELECT 
  full_name,
  credentials,
  email,
  is_active,
  CASE WHEN user_id IS NULL THEN 'Not linked' ELSE 'Linked' END as auth_status
FROM public.faculty
ORDER BY full_name;

