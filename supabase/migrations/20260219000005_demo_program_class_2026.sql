-- ============================================================================
-- DEMO PROGRAM: Synthetic data for Progress Check demo accounts
--
-- Creates a dedicated demo program so demo accounts do NOT see real data.
-- Uses "Grey Sloan Memorial" as the fictional institution.
-- Contains:
--   - Demo health system + program (Emergency Medicine)
--   - One class: Class of 2026 (PGY-3) with 10 synthetic residents
--   - Demo faculty (3: 2 core, 1 teaching) — user_id NULL (no auth.users row)
--   - structured_ratings across ALL periods:
--       Orientation, PGY-1 Fall, PGY-1 Spring, PGY-2 Fall, PGY-2 Spring,
--       PGY-3 Fall, PGY-3 Spring
--   - Updates demo accounts in eqpqiq_user_roles to point at this program
--     and renames them from @mhw-em.edu to @greysloan.edu
-- ============================================================================

DO $$
DECLARE
  v_hs_id UUID := 'dddddddd-0000-0000-0000-000000000001';
  v_program_id UUID := 'dddddddd-0000-0000-0000-000000000002';
  v_class_id UUID := 'dddddddd-0000-0000-0000-000000002026';
  v_faculty_ids UUID[] := ARRAY[
    'dddddddd-f000-0000-0000-000000000001'::UUID,
    'dddddddd-f000-0000-0000-000000000002'::UUID,
    'dddddddd-f000-0000-0000-000000000003'::UUID
  ];
  v_resident_ids UUID[];
  v_profile_ids UUID[];
  r_id UUID;
  p_id UUID;
  i INT;
  j INT;
  v_period TEXT;
  v_eval_date DATE;
  v_pgy TEXT;
  v_base_eq NUMERIC;
  v_base_pq NUMERIC;
  v_base_iq NUMERIC;
  v_growth NUMERIC;
  v_periods TEXT[] := ARRAY[
    'Orientation', 'PGY-1 Fall', 'PGY-1 Spring',
    'PGY-2 Fall', 'PGY-2 Spring', 'PGY-3 Fall', 'PGY-3 Spring'
  ];
  v_eval_dates DATE[] := ARRAY[
    '2023-07-15'::DATE, '2023-11-15'::DATE, '2024-03-15'::DATE,
    '2024-11-15'::DATE, '2025-03-15'::DATE,
    '2025-11-15'::DATE, '2026-03-15'::DATE
  ];
  v_pgy_levels TEXT[] := ARRAY[
    'PGY-1', 'PGY-1', 'PGY-1', 'PGY-2', 'PGY-2', 'PGY-3', 'PGY-3'
  ];
BEGIN
  -- ========================================================================
  -- 0. Clean up any partial data from previous runs
  -- ========================================================================
  DELETE FROM public.structured_ratings WHERE resident_id IN (
    SELECT id FROM public.residents WHERE program_id = v_program_id
  );
  DELETE FROM public.survey_resident_assignments WHERE survey_id IN (
    SELECT id FROM public.surveys WHERE program_id = v_program_id
  );
  DELETE FROM public.survey_respondents WHERE survey_id IN (
    SELECT id FROM public.surveys WHERE program_id = v_program_id
  );
  DELETE FROM public.surveys WHERE program_id = v_program_id;
  DELETE FROM public.residents WHERE program_id = v_program_id;
  DELETE FROM public.user_profiles WHERE email LIKE 'demo-res-%@greysloan.edu';
  DELETE FROM public.faculty WHERE program_id = v_program_id;

  -- ========================================================================
  -- 1. Health System
  -- ========================================================================
  INSERT INTO public.health_systems (id, name, abbreviation, location)
  VALUES (v_hs_id, 'Grey Sloan Memorial Hospital', 'GSMH', 'Seattle, WA')
  ON CONFLICT (id) DO NOTHING;

  -- ========================================================================
  -- 2. Program
  -- ========================================================================
  INSERT INTO public.programs (id, health_system_id, name, specialty)
  VALUES (v_program_id, v_hs_id, 'Emergency Medicine Residency', 'Emergency Medicine')
  ON CONFLICT (id) DO NOTHING;

  -- ========================================================================
  -- 3. Class of 2026
  -- ========================================================================
  INSERT INTO public.classes (id, program_id, graduation_year, name, is_active)
  VALUES (v_class_id, v_program_id, 2026, 'Class of 2026', true)
  ON CONFLICT (id) DO NOTHING;

  -- ========================================================================
  -- 4. Faculty (user_id = NULL since no auth.users rows for demo)
  -- ========================================================================
  INSERT INTO public.faculty (id, user_id, full_name, credentials, email, program_id, is_active)
  VALUES
    (v_faculty_ids[1], NULL, 'Alex Rivera', 'MD', 'demo-fac-1@greysloan.edu', v_program_id, true),
    (v_faculty_ids[2], NULL, 'Jordan Kim', 'MD', 'demo-fac-2@greysloan.edu', v_program_id, true),
    (v_faculty_ids[3], NULL, 'Sam Patel', 'DO', 'demo-fac-3@greysloan.edu', v_program_id, true)
  ON CONFLICT (id) DO NOTHING;

  -- ========================================================================
  -- 5. Resident user_profiles + residents
  -- ========================================================================
  v_resident_ids := ARRAY[]::UUID[];
  v_profile_ids := ARRAY[]::UUID[];

  FOR i IN 1..10 LOOP
    r_id := gen_random_uuid();
    p_id := gen_random_uuid();
    v_resident_ids := v_resident_ids || r_id;
    v_profile_ids := v_profile_ids || p_id;

    INSERT INTO public.user_profiles (id, email, full_name, role, institution_id)
    VALUES (
      p_id,
      'demo-res-' || i || '@greysloan.edu',
      CASE i
        WHEN 1  THEN 'Resident Alpha'
        WHEN 2  THEN 'Resident Bravo'
        WHEN 3  THEN 'Resident Charlie'
        WHEN 4  THEN 'Resident Delta'
        WHEN 5  THEN 'Resident Echo'
        WHEN 6  THEN 'Resident Foxtrot'
        WHEN 7  THEN 'Resident Golf'
        WHEN 8  THEN 'Resident Hotel'
        WHEN 9  THEN 'Resident India'
        WHEN 10 THEN 'Resident Juliet'
      END,
      'resident',
      v_hs_id
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO public.residents (id, user_id, program_id, class_id, anon_code)
    VALUES (r_id, p_id, v_program_id, v_class_id, 'DEMO-' || LPAD(i::TEXT, 3, '0'))
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- ========================================================================
  -- 6. Seed structured_ratings for ALL 7 periods
  --    Per resident per period:
  --      2 core_faculty ratings (faculty 1 & 2)
  --      1 teaching_faculty rating (faculty 3) in 4 of 7 periods
  --      1 self rating
  --    Scores show realistic growth (base + ~3.5pts/period + noise)
  -- ========================================================================
  FOR i IN 1..10 LOOP
    v_base_eq := 40 + (i * 2.5);
    v_base_pq := 42 + (i * 2.0);
    v_base_iq := 38 + (i * 2.8);

    FOR j IN 1..7 LOOP
      v_period := v_periods[j];
      v_eval_date := v_eval_dates[j];
      v_pgy := v_pgy_levels[j];
      v_growth := (j - 1) * 3.5;

      -- Core faculty #1
      INSERT INTO public.structured_ratings (
        resident_id, rater_type, faculty_id, evaluation_date, pgy_level, period_label,
        eq_empathy_positive_interactions, eq_adaptability_self_awareness,
        eq_stress_management_resilience, eq_curiosity_growth_mindset,
        eq_effectiveness_communication,
        pq_work_ethic_reliability, pq_integrity_accountability,
        pq_teachability_receptiveness, pq_documentation,
        pq_leadership_relationships,
        iq_knowledge_base, iq_analytical_thinking,
        iq_commitment_learning, iq_clinical_flexibility,
        iq_performance_for_level,
        eq_avg, pq_avg, iq_avg
      ) VALUES (
        v_resident_ids[i], 'core_faculty', v_faculty_ids[1], v_eval_date, v_pgy, v_period,
        LEAST(100, ROUND(v_base_eq + v_growth + (random()*8-4))),
        LEAST(100, ROUND(v_base_eq + v_growth + 2 + (random()*8-4))),
        LEAST(100, ROUND(v_base_eq + v_growth - 1 + (random()*8-4))),
        LEAST(100, ROUND(v_base_eq + v_growth + 3 + (random()*8-4))),
        LEAST(100, ROUND(v_base_eq + v_growth + 1 + (random()*8-4))),
        LEAST(100, ROUND(v_base_pq + v_growth + (random()*8-4))),
        LEAST(100, ROUND(v_base_pq + v_growth + 2 + (random()*8-4))),
        LEAST(100, ROUND(v_base_pq + v_growth - 2 + (random()*8-4))),
        LEAST(100, ROUND(v_base_pq + v_growth + 1 + (random()*8-4))),
        LEAST(100, ROUND(v_base_pq + v_growth + 3 + (random()*8-4))),
        LEAST(100, ROUND(v_base_iq + v_growth + (random()*8-4))),
        LEAST(100, ROUND(v_base_iq + v_growth + 1 + (random()*8-4))),
        LEAST(100, ROUND(v_base_iq + v_growth + 4 + (random()*8-4))),
        LEAST(100, ROUND(v_base_iq + v_growth - 1 + (random()*8-4))),
        LEAST(100, ROUND(v_base_iq + v_growth + 2 + (random()*8-4))),
        LEAST(100, ROUND(v_base_eq + v_growth + 1)),
        LEAST(100, ROUND(v_base_pq + v_growth + 1)),
        LEAST(100, ROUND(v_base_iq + v_growth + 1))
      );

      -- Core faculty #2
      INSERT INTO public.structured_ratings (
        resident_id, rater_type, faculty_id, evaluation_date, pgy_level, period_label,
        eq_empathy_positive_interactions, eq_adaptability_self_awareness,
        eq_stress_management_resilience, eq_curiosity_growth_mindset,
        eq_effectiveness_communication,
        pq_work_ethic_reliability, pq_integrity_accountability,
        pq_teachability_receptiveness, pq_documentation,
        pq_leadership_relationships,
        iq_knowledge_base, iq_analytical_thinking,
        iq_commitment_learning, iq_clinical_flexibility,
        iq_performance_for_level,
        eq_avg, pq_avg, iq_avg
      ) VALUES (
        v_resident_ids[i], 'core_faculty', v_faculty_ids[2], v_eval_date, v_pgy, v_period,
        LEAST(100, ROUND(v_base_eq + v_growth - 2 + (random()*10-5))),
        LEAST(100, ROUND(v_base_eq + v_growth + (random()*10-5))),
        LEAST(100, ROUND(v_base_eq + v_growth + 1 + (random()*10-5))),
        LEAST(100, ROUND(v_base_eq + v_growth + 2 + (random()*10-5))),
        LEAST(100, ROUND(v_base_eq + v_growth - 1 + (random()*10-5))),
        LEAST(100, ROUND(v_base_pq + v_growth + 1 + (random()*10-5))),
        LEAST(100, ROUND(v_base_pq + v_growth + (random()*10-5))),
        LEAST(100, ROUND(v_base_pq + v_growth + 3 + (random()*10-5))),
        LEAST(100, ROUND(v_base_pq + v_growth - 1 + (random()*10-5))),
        LEAST(100, ROUND(v_base_pq + v_growth + 2 + (random()*10-5))),
        LEAST(100, ROUND(v_base_iq + v_growth + 2 + (random()*10-5))),
        LEAST(100, ROUND(v_base_iq + v_growth - 1 + (random()*10-5))),
        LEAST(100, ROUND(v_base_iq + v_growth + 3 + (random()*10-5))),
        LEAST(100, ROUND(v_base_iq + v_growth + (random()*10-5))),
        LEAST(100, ROUND(v_base_iq + v_growth + 1 + (random()*10-5))),
        LEAST(100, ROUND(v_base_eq + v_growth)),
        LEAST(100, ROUND(v_base_pq + v_growth + 1)),
        LEAST(100, ROUND(v_base_iq + v_growth + 1))
      );

      -- Teaching faculty (4 of 7 periods)
      IF j IN (3, 4, 5, 6) THEN
        INSERT INTO public.structured_ratings (
          resident_id, rater_type, faculty_id, evaluation_date, pgy_level, period_label,
          eq_empathy_positive_interactions, eq_adaptability_self_awareness,
          eq_stress_management_resilience, eq_curiosity_growth_mindset,
          eq_effectiveness_communication,
          pq_work_ethic_reliability, pq_integrity_accountability,
          pq_teachability_receptiveness, pq_documentation,
          pq_leadership_relationships,
          iq_knowledge_base, iq_analytical_thinking,
          iq_commitment_learning, iq_clinical_flexibility,
          iq_performance_for_level,
          eq_avg, pq_avg, iq_avg
        ) VALUES (
          v_resident_ids[i], 'teaching_faculty', v_faculty_ids[3], v_eval_date, v_pgy, v_period,
          LEAST(100, ROUND(v_base_eq + v_growth + 3 + (random()*12-6))),
          LEAST(100, ROUND(v_base_eq + v_growth + 1 + (random()*12-6))),
          LEAST(100, ROUND(v_base_eq + v_growth + (random()*12-6))),
          LEAST(100, ROUND(v_base_eq + v_growth + 4 + (random()*12-6))),
          LEAST(100, ROUND(v_base_eq + v_growth + 2 + (random()*12-6))),
          LEAST(100, ROUND(v_base_pq + v_growth + 2 + (random()*12-6))),
          LEAST(100, ROUND(v_base_pq + v_growth + (random()*12-6))),
          LEAST(100, ROUND(v_base_pq + v_growth + 1 + (random()*12-6))),
          LEAST(100, ROUND(v_base_pq + v_growth + 3 + (random()*12-6))),
          LEAST(100, ROUND(v_base_pq + v_growth + (random()*12-6))),
          LEAST(100, ROUND(v_base_iq + v_growth + 1 + (random()*12-6))),
          LEAST(100, ROUND(v_base_iq + v_growth + 3 + (random()*12-6))),
          LEAST(100, ROUND(v_base_iq + v_growth + 2 + (random()*12-6))),
          LEAST(100, ROUND(v_base_iq + v_growth + (random()*12-6))),
          LEAST(100, ROUND(v_base_iq + v_growth + 4 + (random()*12-6))),
          LEAST(100, ROUND(v_base_eq + v_growth + 2)),
          LEAST(100, ROUND(v_base_pq + v_growth + 1)),
          LEAST(100, ROUND(v_base_iq + v_growth + 2))
        );
      END IF;

      -- Self-assessment (residents rate themselves slightly higher)
      INSERT INTO public.structured_ratings (
        resident_id, rater_type, evaluation_date, pgy_level, period_label,
        eq_empathy_positive_interactions, eq_adaptability_self_awareness,
        eq_stress_management_resilience, eq_curiosity_growth_mindset,
        eq_effectiveness_communication,
        pq_work_ethic_reliability, pq_integrity_accountability,
        pq_teachability_receptiveness, pq_documentation,
        pq_leadership_relationships,
        iq_knowledge_base, iq_analytical_thinking,
        iq_commitment_learning, iq_clinical_flexibility,
        iq_performance_for_level,
        eq_avg, pq_avg, iq_avg
      ) VALUES (
        v_resident_ids[i], 'self', v_eval_date, v_pgy, v_period,
        LEAST(100, ROUND(v_base_eq + v_growth + 5 + (random()*10-5))),
        LEAST(100, ROUND(v_base_eq + v_growth + 3 + (random()*10-5))),
        LEAST(100, ROUND(v_base_eq + v_growth + 7 + (random()*10-5))),
        LEAST(100, ROUND(v_base_eq + v_growth + 4 + (random()*10-5))),
        LEAST(100, ROUND(v_base_eq + v_growth + 6 + (random()*10-5))),
        LEAST(100, ROUND(v_base_pq + v_growth + 4 + (random()*10-5))),
        LEAST(100, ROUND(v_base_pq + v_growth + 6 + (random()*10-5))),
        LEAST(100, ROUND(v_base_pq + v_growth + 3 + (random()*10-5))),
        LEAST(100, ROUND(v_base_pq + v_growth + 5 + (random()*10-5))),
        LEAST(100, ROUND(v_base_pq + v_growth + 7 + (random()*10-5))),
        LEAST(100, ROUND(v_base_iq + v_growth + 3 + (random()*10-5))),
        LEAST(100, ROUND(v_base_iq + v_growth + 5 + (random()*10-5))),
        LEAST(100, ROUND(v_base_iq + v_growth + 8 + (random()*10-5))),
        LEAST(100, ROUND(v_base_iq + v_growth + 4 + (random()*10-5))),
        LEAST(100, ROUND(v_base_iq + v_growth + 6 + (random()*10-5))),
        LEAST(100, ROUND(v_base_eq + v_growth + 5)),
        LEAST(100, ROUND(v_base_pq + v_growth + 5)),
        LEAST(100, ROUND(v_base_iq + v_growth + 5))
      );

    END LOOP;  -- periods
  END LOOP;  -- residents

  -- ========================================================================
  -- 7. Seed demo surveys
  -- ========================================================================
  INSERT INTO public.surveys (
    survey_type, title, description,
    program_id, class_id, period_label, academic_year,
    audience_filter, status, created_by_email
  ) VALUES
  (
    'learner_self_assessment',
    'Spring 2026 CCC Self-Assessment — Class of 2026 (PGY-3)',
    'Demo: Resident self-assessment for PGY-3 residents.',
    v_program_id, v_class_id, 'PGY-3 Spring CCC', '2025-2026',
    '{"type": "self_assessment"}'::jsonb, 'draft', 'demo-pd@greysloan.edu'
  ),
  (
    'educator_assessment',
    'Spring 2026 CCC Core Faculty — Class of 2026 (PGY-3)',
    'Demo: Core faculty evaluation of PGY-3 residents.',
    v_program_id, v_class_id, 'PGY-3 Spring CCC', '2025-2026',
    '{"type": "core_faculty"}'::jsonb, 'draft', 'demo-pd@greysloan.edu'
  ),
  (
    'educator_assessment',
    'Spring 2026 CCC Teaching Faculty — Class of 2026 (PGY-3)',
    'Demo: Teaching faculty evaluation of PGY-3 residents.',
    v_program_id, v_class_id, 'PGY-3 Spring CCC', '2025-2026',
    '{"type": "teaching_faculty"}'::jsonb, 'draft', 'demo-pd@greysloan.edu'
  );

  -- ========================================================================
  -- 8. Rename + repoint demo accounts to this program
  --    Old emails: demo-{role}@mhw-em.edu → demo-{role}@greysloan.edu
  -- ========================================================================
  UPDATE public.eqpqiq_user_roles
  SET program_id = v_program_id, user_email = 'demo-pd@greysloan.edu'
  WHERE user_email = 'demo-pd@mhw-em.edu' AND tool = 'progress_check';

  UPDATE public.eqpqiq_user_roles
  SET program_id = v_program_id, user_email = 'demo-faculty@greysloan.edu'
  WHERE user_email = 'demo-faculty@mhw-em.edu' AND tool = 'progress_check';

  UPDATE public.eqpqiq_user_roles
  SET program_id = v_program_id, user_email = 'demo-resident@greysloan.edu'
  WHERE user_email = 'demo-resident@mhw-em.edu' AND tool = 'progress_check';

  RAISE NOTICE 'Demo program created: Grey Sloan Memorial — % with 10 residents, 3 faculty, 7 periods seeded', v_program_id;
END $$;
