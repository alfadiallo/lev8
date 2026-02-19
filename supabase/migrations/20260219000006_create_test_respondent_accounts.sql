-- ============================================================================
-- CREATE TEST RESPONDENT ACCOUNTS FOR SURVEY QA
-- ============================================================================
-- Creates/updates 3 test identities for Progress Check survey testing:
--   1) alfaomardiallo@gmail.com -> Core Faculty
--   2) hello@sofloem.com        -> Teaching Faculty
--   3) alfa@virtualsim.ai       -> Resident
--
-- Notes:
-- - Idempotent: safe to run multiple times
-- - Program context is derived from existing Progress Check PD account
--   (findme@alfadiallo.com), with fallback to Emergency Medicine program.
-- ============================================================================

DO $$
DECLARE
  v_program_id UUID;
  v_health_system_id UUID;
  v_class_id UUID;

  v_core_email TEXT := 'alfaomardiallo@gmail.com';
  v_teaching_email TEXT := 'hello@sofloem.com';
  v_resident_email TEXT := 'alfa@virtualsim.ai';

  v_core_profile_id UUID;
  v_teaching_profile_id UUID;
  v_resident_profile_id UUID;
BEGIN
  -- --------------------------------------------------------------------------
  -- 1) Resolve target program + health system + class
  -- --------------------------------------------------------------------------
  SELECT eur.program_id
  INTO v_program_id
  FROM public.eqpqiq_user_roles eur
  WHERE eur.user_email = 'findme@alfadiallo.com'
    AND eur.tool = 'progress_check'
    AND eur.is_active = true
  ORDER BY eur.is_admin DESC, eur.created_at DESC
  LIMIT 1;

  IF v_program_id IS NULL THEN
    SELECT p.id
    INTO v_program_id
    FROM public.programs p
    WHERE p.name ILIKE '%Emergency Medicine%'
    ORDER BY p.created_at DESC
    LIMIT 1;
  END IF;

  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve program_id for test respondent accounts';
  END IF;

  SELECT p.health_system_id
  INTO v_health_system_id
  FROM public.programs p
  WHERE p.id = v_program_id;

  SELECT c.id
  INTO v_class_id
  FROM public.classes c
  WHERE c.program_id = v_program_id
    AND c.is_active = true
  ORDER BY c.graduation_year ASC
  LIMIT 1;

  -- --------------------------------------------------------------------------
  -- 2) Core Faculty profile + faculty row + progress_check role
  -- --------------------------------------------------------------------------
  SELECT up.id
  INTO v_core_profile_id
  FROM public.user_profiles up
  WHERE LOWER(COALESCE(up.email, '')) = LOWER(v_core_email)
     OR LOWER(COALESCE(up.personal_email, '')) = LOWER(v_core_email)
     OR LOWER(COALESCE(up.institutional_email, '')) = LOWER(v_core_email)
  LIMIT 1;

  IF v_core_profile_id IS NULL THEN
    v_core_profile_id := gen_random_uuid();
    INSERT INTO public.user_profiles (
      id, email, personal_email, institutional_email, full_name, role,
      institution_id, faculty_type, account_status
    )
    VALUES (
      v_core_profile_id, v_core_email, v_core_email, NULL, 'Alfa Test Core Faculty',
      'faculty', v_health_system_id, 'core', 'active'
    );
  ELSE
    UPDATE public.user_profiles
    SET
      email = v_core_email,
      personal_email = COALESCE(personal_email, v_core_email),
      role = 'faculty',
      institution_id = v_health_system_id,
      faculty_type = 'core',
      account_status = 'active'
    WHERE id = v_core_profile_id;
  END IF;

  INSERT INTO public.faculty (user_id, full_name, credentials, email, program_id, is_active)
  VALUES (NULL, 'Alfa Test Core Faculty', 'MD', v_core_email, v_program_id, true)
  ON CONFLICT (email) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    credentials = EXCLUDED.credentials,
    program_id = EXCLUDED.program_id,
    is_active = true;

  UPDATE public.eqpqiq_user_roles
  SET
    role = 'faculty',
    program_id = v_program_id,
    health_system_id = v_health_system_id,
    personal_email = v_core_email,
    is_active = true,
    is_admin = false
  WHERE user_email = v_core_email
    AND tool = 'progress_check';

  IF NOT FOUND THEN
    INSERT INTO public.eqpqiq_user_roles (
      user_email, personal_email, tool, program_id, health_system_id, role, is_admin, is_active
    )
    VALUES (
      v_core_email, v_core_email, 'progress_check', v_program_id, v_health_system_id, 'faculty', false, true
    );
  END IF;

  -- --------------------------------------------------------------------------
  -- 3) Teaching Faculty profile + faculty row + progress_check role
  -- --------------------------------------------------------------------------
  SELECT up.id
  INTO v_teaching_profile_id
  FROM public.user_profiles up
  WHERE LOWER(COALESCE(up.email, '')) = LOWER(v_teaching_email)
     OR LOWER(COALESCE(up.personal_email, '')) = LOWER(v_teaching_email)
     OR LOWER(COALESCE(up.institutional_email, '')) = LOWER(v_teaching_email)
  LIMIT 1;

  IF v_teaching_profile_id IS NULL THEN
    v_teaching_profile_id := gen_random_uuid();
    INSERT INTO public.user_profiles (
      id, email, personal_email, institutional_email, full_name, role,
      institution_id, faculty_type, account_status
    )
    VALUES (
      v_teaching_profile_id, v_teaching_email, v_teaching_email, NULL, 'Alfa Test Teaching Faculty',
      'faculty', v_health_system_id, 'teaching', 'active'
    );
  ELSE
    UPDATE public.user_profiles
    SET
      email = v_teaching_email,
      personal_email = COALESCE(personal_email, v_teaching_email),
      role = 'faculty',
      institution_id = v_health_system_id,
      faculty_type = 'teaching',
      account_status = 'active'
    WHERE id = v_teaching_profile_id;
  END IF;

  INSERT INTO public.faculty (user_id, full_name, credentials, email, program_id, is_active)
  VALUES (NULL, 'Alfa Test Teaching Faculty', 'MD', v_teaching_email, v_program_id, true)
  ON CONFLICT (email) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    credentials = EXCLUDED.credentials,
    program_id = EXCLUDED.program_id,
    is_active = true;

  UPDATE public.eqpqiq_user_roles
  SET
    role = 'faculty',
    program_id = v_program_id,
    health_system_id = v_health_system_id,
    personal_email = v_teaching_email,
    is_active = true,
    is_admin = false
  WHERE user_email = v_teaching_email
    AND tool = 'progress_check';

  IF NOT FOUND THEN
    INSERT INTO public.eqpqiq_user_roles (
      user_email, personal_email, tool, program_id, health_system_id, role, is_admin, is_active
    )
    VALUES (
      v_teaching_email, v_teaching_email, 'progress_check', v_program_id, v_health_system_id, 'faculty', false, true
    );
  END IF;

  -- --------------------------------------------------------------------------
  -- 4) Resident profile + resident row + progress_check role
  -- --------------------------------------------------------------------------
  SELECT up.id
  INTO v_resident_profile_id
  FROM public.user_profiles up
  WHERE LOWER(COALESCE(up.email, '')) = LOWER(v_resident_email)
     OR LOWER(COALESCE(up.personal_email, '')) = LOWER(v_resident_email)
     OR LOWER(COALESCE(up.institutional_email, '')) = LOWER(v_resident_email)
  LIMIT 1;

  IF v_resident_profile_id IS NULL THEN
    v_resident_profile_id := gen_random_uuid();
    INSERT INTO public.user_profiles (
      id, email, personal_email, institutional_email, full_name, role,
      institution_id, faculty_type, account_status
    )
    VALUES (
      v_resident_profile_id, v_resident_email, v_resident_email, NULL, 'Alfa Test Resident',
      'resident', v_health_system_id, NULL, 'active'
    );
  ELSE
    UPDATE public.user_profiles
    SET
      email = v_resident_email,
      personal_email = COALESCE(personal_email, v_resident_email),
      role = 'resident',
      institution_id = v_health_system_id,
      account_status = 'active'
    WHERE id = v_resident_profile_id;
  END IF;

  INSERT INTO public.residents (user_id, program_id, class_id)
  VALUES (v_resident_profile_id, v_program_id, v_class_id)
  ON CONFLICT (user_id) DO UPDATE
  SET
    program_id = EXCLUDED.program_id,
    class_id = COALESCE(EXCLUDED.class_id, public.residents.class_id);

  UPDATE public.eqpqiq_user_roles
  SET
    role = 'resident',
    program_id = v_program_id,
    health_system_id = v_health_system_id,
    personal_email = v_resident_email,
    is_active = true,
    is_admin = false
  WHERE user_email = v_resident_email
    AND tool = 'progress_check';

  IF NOT FOUND THEN
    INSERT INTO public.eqpqiq_user_roles (
      user_email, personal_email, tool, program_id, health_system_id, role, is_admin, is_active
    )
    VALUES (
      v_resident_email, v_resident_email, 'progress_check', v_program_id, v_health_system_id, 'resident', false, true
    );
  END IF;

  RAISE NOTICE 'Created/updated test survey accounts in program % (class %)', v_program_id, v_class_id;
END $$;
