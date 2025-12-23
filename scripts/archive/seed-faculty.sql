-- ============================================================================
-- SEED FACULTY DATA
-- ============================================================================
-- Creates 13 faculty members for Memorial Healthcare System EM program
-- Note: This creates faculty records without auth users
-- Auth users should be created through Supabase Auth separately

-- Get the Memorial Healthcare System EM program ID
DO $$
DECLARE
  v_program_id UUID;
BEGIN
  -- Get the program ID
  SELECT id INTO v_program_id
  FROM public.programs
  WHERE name = 'Emergency Medicine'
  LIMIT 1;

  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'Emergency Medicine program not found';
  END IF;

  -- Faculty 1: Hanan Atia, MD
  INSERT INTO public.faculty (full_name, credentials, email, program_id)
  VALUES ('Hanan Atia', 'MD', 'hatia@mhs.net', v_program_id)
  ON CONFLICT DO NOTHING;

  -- Faculty 2: Alfa Diallo, MD, MPH
  INSERT INTO public.faculty (full_name, credentials, email, program_id)
  VALUES ('Alfa Diallo', 'MD, MPH', 'adiallo@mhs.net', v_program_id)
  ON CONFLICT DO NOTHING;

  -- Faculty 3: Lara Goldstein, MD, PhD
  INSERT INTO auth.users (id, email) 
  VALUES (gen_random_uuid(), 'lgoldstein@mhs.net')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'lgoldstein@mhs.net';
  END IF;

  INSERT INTO public.user_profiles (user_id, full_name, email, role)
  VALUES (v_user_id, 'Lara Goldstein', 'lgoldstein@mhs.net', 'faculty')
  ON CONFLICT (user_id) DO UPDATE SET role = 'faculty';

  INSERT INTO public.faculty (user_id, full_name, credentials, email, program_id)
  VALUES (v_user_id, 'Lara Goldstein', 'MD, PhD', 'lgoldstein@mhs.net', v_program_id)
  ON CONFLICT DO NOTHING;

  -- Faculty 4: David Hooke, DO
  INSERT INTO auth.users (id, email) 
  VALUES (gen_random_uuid(), 'dhooke@mhs.net')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'dhooke@mhs.net';
  END IF;

  INSERT INTO public.user_profiles (user_id, full_name, email, role)
  VALUES (v_user_id, 'David Hooke', 'dhooke@mhs.net', 'faculty')
  ON CONFLICT (user_id) DO UPDATE SET role = 'faculty';

  INSERT INTO public.faculty (user_id, full_name, credentials, email, program_id)
  VALUES (v_user_id, 'David Hooke', 'DO', 'dhooke@mhs.net', v_program_id)
  ON CONFLICT DO NOTHING;

  -- Faculty 5: Brian Kohen, MD
  INSERT INTO auth.users (id, email) 
  VALUES (gen_random_uuid(), 'bkohen@mhs.net')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'bkohen@mhs.net';
  END IF;

  INSERT INTO public.user_profiles (user_id, full_name, email, role)
  VALUES (v_user_id, 'Brian Kohen', 'bkohen@mhs.net', 'faculty')
  ON CONFLICT (user_id) DO UPDATE SET role = 'faculty';

  INSERT INTO public.faculty (user_id, full_name, credentials, email, program_id)
  VALUES (v_user_id, 'Brian Kohen', 'MD', 'bkohen@mhs.net', v_program_id)
  ON CONFLICT DO NOTHING;

  -- Faculty 6: Randy Katz, DO
  INSERT INTO auth.users (id, email) 
  VALUES (gen_random_uuid(), 'rkatz@mhs.net')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'rkatz@mhs.net';
  END IF;

  INSERT INTO public.user_profiles (user_id, full_name, email, role)
  VALUES (v_user_id, 'Randy Katz', 'rkatz@mhs.net', 'faculty')
  ON CONFLICT (user_id) DO UPDATE SET role = 'faculty';

  INSERT INTO public.faculty (user_id, full_name, credentials, email, program_id)
  VALUES (v_user_id, 'Randy Katz', 'DO', 'rkatz@mhs.net', v_program_id)
  ON CONFLICT DO NOTHING;

  -- Faculty 7: Steven Katz, MD
  INSERT INTO auth.users (id, email) 
  VALUES (gen_random_uuid(), 'skatz@mhs.net')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'skatz@mhs.net';
  END IF;

  INSERT INTO public.user_profiles (user_id, full_name, email, role)
  VALUES (v_user_id, 'Steven Katz', 'skatz@mhs.net', 'faculty')
  ON CONFLICT (user_id) DO UPDATE SET role = 'faculty';

  INSERT INTO public.faculty (user_id, full_name, credentials, email, program_id)
  VALUES (v_user_id, 'Steven Katz', 'MD', 'skatz@mhs.net', v_program_id)
  ON CONFLICT DO NOTHING;

  -- Faculty 8: Sandra Lopez, MD
  INSERT INTO auth.users (id, email) 
  VALUES (gen_random_uuid(), 'slopez@mhs.net')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'slopez@mhs.net';
  END IF;

  INSERT INTO public.user_profiles (user_id, full_name, email, role)
  VALUES (v_user_id, 'Sandra Lopez', 'slopez@mhs.net', 'faculty')
  ON CONFLICT (user_id) DO UPDATE SET role = 'faculty';

  INSERT INTO public.faculty (user_id, full_name, credentials, email, program_id)
  VALUES (v_user_id, 'Sandra Lopez', 'MD', 'slopez@mhs.net', v_program_id)
  ON CONFLICT DO NOTHING;

  -- Faculty 9: Leon Melnitsky, DO
  INSERT INTO auth.users (id, email) 
  VALUES (gen_random_uuid(), 'lmelnitsky@mhs.net')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'lmelnitsky@mhs.net';
  END IF;

  INSERT INTO public.user_profiles (user_id, full_name, email, role)
  VALUES (v_user_id, 'Leon Melnitsky', 'lmelnitsky@mhs.net', 'faculty')
  ON CONFLICT (user_id) DO UPDATE SET role = 'faculty';

  INSERT INTO public.faculty (user_id, full_name, credentials, email, program_id)
  VALUES (v_user_id, 'Leon Melnitsky', 'DO', 'lmelnitsky@mhs.net', v_program_id)
  ON CONFLICT DO NOTHING;

  -- Faculty 10: Franz C Mendoza-Garcia, MD
  INSERT INTO auth.users (id, email) 
  VALUES (gen_random_uuid(), 'fmendoza@mhs.net')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'fmendoza@mhs.net';
  END IF;

  INSERT INTO public.user_profiles (user_id, full_name, email, role)
  VALUES (v_user_id, 'Franz Mendoza-Garcia', 'fmendoza@mhs.net', 'faculty')
  ON CONFLICT (user_id) DO UPDATE SET role = 'faculty';

  INSERT INTO public.faculty (user_id, full_name, credentials, email, program_id)
  VALUES (v_user_id, 'Franz Mendoza-Garcia', 'MD', 'fmendoza@mhs.net', v_program_id)
  ON CONFLICT DO NOTHING;

  -- Faculty 11: Jheanelle McKay, MD
  INSERT INTO auth.users (id, email) 
  VALUES (gen_random_uuid(), 'jmckay@mhs.net')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'jmckay@mhs.net';
  END IF;

  INSERT INTO public.user_profiles (user_id, full_name, email, role)
  VALUES (v_user_id, 'Jheanelle McKay', 'jmckay@mhs.net', 'faculty')
  ON CONFLICT (user_id) DO UPDATE SET role = 'faculty';

  INSERT INTO public.faculty (user_id, full_name, credentials, email, program_id)
  VALUES (v_user_id, 'Jheanelle McKay', 'MD', 'jmckay@mhs.net', v_program_id)
  ON CONFLICT DO NOTHING;

  -- Faculty 12: Donny Perez, DO
  INSERT INTO auth.users (id, email) 
  VALUES (gen_random_uuid(), 'dperez@mhs.net')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'dperez@mhs.net';
  END IF;

  INSERT INTO public.user_profiles (user_id, full_name, email, role)
  VALUES (v_user_id, 'Donny Perez', 'dperez@mhs.net', 'faculty')
  ON CONFLICT (user_id) DO UPDATE SET role = 'faculty';

  INSERT INTO public.faculty (user_id, full_name, credentials, email, program_id)
  VALUES (v_user_id, 'Donny Perez', 'DO', 'dperez@mhs.net', v_program_id)
  ON CONFLICT DO NOTHING;

  -- Faculty 13: Hudi Wenger, MD
  INSERT INTO auth.users (id, email) 
  VALUES (gen_random_uuid(), 'hwenger@mhs.net')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'hwenger@mhs.net';
  END IF;

  INSERT INTO public.user_profiles (user_id, full_name, email, role)
  VALUES (v_user_id, 'Hudi Wenger', 'hwenger@mhs.net', 'faculty')
  ON CONFLICT (user_id) DO UPDATE SET role = 'faculty';

  INSERT INTO public.faculty (user_id, full_name, credentials, email, program_id)
  VALUES (v_user_id, 'Hudi Wenger', 'MD', 'hwenger@mhs.net', v_program_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Successfully seeded 13 faculty members';
END $$;

-- Verification query
SELECT 
  f.full_name,
  f.credentials,
  f.email,
  up.role,
  f.is_active
FROM public.faculty f
JOIN public.user_profiles up ON f.user_id = up.user_id
ORDER BY f.full_name;

