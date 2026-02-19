-- ============================================================================
-- Migration: MHS EM Access Control & Survey Campaigns
--
-- 1. Grant program_director CCC access to MHS EM leadership
-- 2. Create Spring 2026 survey campaigns for all 3 active classes
-- ============================================================================

-- ============================================================================
-- Part 1: Access Control — eqpqiq_user_roles for MHS EM Leadership
-- ============================================================================

DO $$
DECLARE
  v_program_id UUID;
BEGIN
  SELECT p.id INTO v_program_id
  FROM programs p
  JOIN health_systems hs ON p.health_system_id = hs.id
  LIMIT 1;

  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'No program found — cannot set up access roles';
  END IF;

  -- Leon Melnitsky — Program Director
  INSERT INTO eqpqiq_user_roles (user_email, personal_email, tool, program_id, role, is_admin, is_active)
  VALUES ('lmelnitsky@gmail.com', 'lmelnitsky@gmail.com', 'ccc', v_program_id, 'program_director', true, true)
  ON CONFLICT DO NOTHING;

  -- Hanan Atia — Program Director
  INSERT INTO eqpqiq_user_roles (user_email, personal_email, tool, program_id, role, is_admin, is_active)
  VALUES ('hananatia@gmail.com', 'hananatia@gmail.com', 'ccc', v_program_id, 'program_director', true, true)
  ON CONFLICT DO NOTHING;

  -- Yehuda (Hudi) Wenger — Program Director
  INSERT INTO eqpqiq_user_roles (user_email, personal_email, tool, program_id, role, is_admin, is_active)
  VALUES ('yehudawenger@gmail.com', 'yehudawenger@gmail.com', 'ccc', v_program_id, 'program_director', true, true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Access roles created for MHS EM leadership (program_id: %)', v_program_id;
END $$;


-- ============================================================================
-- Part 2: Spring 2026 Survey Campaigns (6 total: Educator + Learner × 3 classes)
-- ============================================================================

DO $$
DECLARE
  v_program_id UUID;
  v_class_2026_id UUID;
  v_class_2027_id UUID;
  v_class_2028_id UUID;
  v_admin_email TEXT := 'findme@alfadiallo.com';
BEGIN
  SELECT p.id INTO v_program_id FROM programs p LIMIT 1;

  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'No program found';
  END IF;

  -- Look up class IDs by graduation year
  SELECT id INTO v_class_2026_id FROM classes WHERE graduation_year = 2026 LIMIT 1;
  SELECT id INTO v_class_2027_id FROM classes WHERE graduation_year = 2027 LIMIT 1;
  SELECT id INTO v_class_2028_id FROM classes WHERE graduation_year = 2028 LIMIT 1;

  -- ──────────────────────────────────────────────
  -- Class of 2026 (PGY-3) — Educator Survey
  -- ──────────────────────────────────────────────
  INSERT INTO surveys (
    survey_type, title, description,
    program_id, class_id, period_label, academic_year,
    audience_filter, status, created_by_email
  ) VALUES (
    'educator_assessment',
    'Spring 2026 Faculty Evaluation — Class of 2026 (PGY-3)',
    'Faculty evaluation of PGY-3 residents for the Spring 2026 period. Each faculty member rates all residents in this class.',
    v_program_id, v_class_2026_id, 'PGY 3 Spring', '2025-2026',
    '{"type": "all_faculty"}'::jsonb, 'draft', v_admin_email
  );

  -- Class of 2026 (PGY-3) — Learner Survey
  INSERT INTO surveys (
    survey_type, title, description,
    program_id, class_id, period_label, academic_year,
    audience_filter, status, created_by_email
  ) VALUES (
    'learner_self_assessment',
    'Spring 2026 Self-Assessment — Class of 2026 (PGY-3)',
    'Resident self-assessment for PGY-3 residents for the Spring 2026 period.',
    v_program_id, v_class_2026_id, 'PGY 3 Spring', '2025-2026',
    '{"type": "class", "class_year": 2026}'::jsonb, 'draft', v_admin_email
  );

  -- ──────────────────────────────────────────────
  -- Class of 2027 (PGY-2) — Educator Survey
  -- ──────────────────────────────────────────────
  INSERT INTO surveys (
    survey_type, title, description,
    program_id, class_id, period_label, academic_year,
    audience_filter, status, created_by_email
  ) VALUES (
    'educator_assessment',
    'Spring 2026 Faculty Evaluation — Class of 2027 (PGY-2)',
    'Faculty evaluation of PGY-2 residents for the Spring 2026 period. Each faculty member rates all residents in this class.',
    v_program_id, v_class_2027_id, 'PGY 2 Spring', '2025-2026',
    '{"type": "all_faculty"}'::jsonb, 'draft', v_admin_email
  );

  -- Class of 2027 (PGY-2) — Learner Survey
  INSERT INTO surveys (
    survey_type, title, description,
    program_id, class_id, period_label, academic_year,
    audience_filter, status, created_by_email
  ) VALUES (
    'learner_self_assessment',
    'Spring 2026 Self-Assessment — Class of 2027 (PGY-2)',
    'Resident self-assessment for PGY-2 residents for the Spring 2026 period.',
    v_program_id, v_class_2027_id, 'PGY 2 Spring', '2025-2026',
    '{"type": "class", "class_year": 2027}'::jsonb, 'draft', v_admin_email
  );

  -- ──────────────────────────────────────────────
  -- Class of 2028 (PGY-1) — Educator Survey
  -- ──────────────────────────────────────────────
  INSERT INTO surveys (
    survey_type, title, description,
    program_id, class_id, period_label, academic_year,
    audience_filter, status, created_by_email
  ) VALUES (
    'educator_assessment',
    'Spring 2026 Faculty Evaluation — Class of 2028 (PGY-1)',
    'Faculty evaluation of PGY-1 residents for the Spring 2026 period. Each faculty member rates all residents in this class.',
    v_program_id, v_class_2028_id, 'PGY 1 Spring', '2025-2026',
    '{"type": "all_faculty"}'::jsonb, 'draft', v_admin_email
  );

  -- Class of 2028 (PGY-1) — Learner Survey
  INSERT INTO surveys (
    survey_type, title, description,
    program_id, class_id, period_label, academic_year,
    audience_filter, status, created_by_email
  ) VALUES (
    'learner_self_assessment',
    'Spring 2026 Self-Assessment — Class of 2028 (PGY-1)',
    'Resident self-assessment for PGY-1 residents for the Spring 2026 period.',
    v_program_id, v_class_2028_id, 'PGY 1 Spring', '2025-2026',
    '{"type": "class", "class_year": 2028}'::jsonb, 'draft', v_admin_email
  );

  RAISE NOTICE 'Created 6 Spring 2026 survey campaigns for MHS EM';
END $$;
