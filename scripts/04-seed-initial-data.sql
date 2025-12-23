-- ============================================================================
-- Seed Initial Data
-- Creates health system, program, and module buckets
-- Run this AFTER base schema is set up
-- ============================================================================

DO $$
DECLARE
  v_institution_id UUID := '7a617a6d-c0e7-4c30-bcf7-12bd123432e9';
  v_program_id UUID;
  v_learn_bucket_id UUID;
  v_grow_bucket_id UUID;
  v_understand_bucket_id UUID;
BEGIN
  -- Create or get health system
  INSERT INTO public.health_systems (id, name, abbreviation, location)
  VALUES (v_institution_id, 'Memorial Healthcare System', 'MHS', 'Hollywood, FL')
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      abbreviation = EXCLUDED.abbreviation,
      location = EXCLUDED.location;
  
  RAISE NOTICE '✅ Health system: Memorial Healthcare System (ID: %)', v_institution_id;

  -- Create or get program
  INSERT INTO public.programs (health_system_id, name, specialty)
  VALUES (v_institution_id, 'Emergency Medicine Residency', 'Emergency Medicine')
  ON CONFLICT (health_system_id, name) DO UPDATE
  SET specialty = EXCLUDED.specialty;
  
  -- Get the program ID separately
  SELECT id INTO v_program_id 
  FROM public.programs 
  WHERE health_system_id = v_institution_id 
    AND name = 'Emergency Medicine Residency'
  LIMIT 1;
  
  RAISE NOTICE '✅ Program: Emergency Medicine Residency (ID: %)', v_program_id;

  -- Create academic classes
  INSERT INTO public.academic_classes (program_id, class_year, start_date, is_active)
  VALUES 
    (v_program_id, 'PGY-1', '2024-07-01', true),
    (v_program_id, 'PGY-2', '2023-07-01', true),
    (v_program_id, 'PGY-3', '2022-07-01', true)
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE '✅ Academic classes created';

  -- Create module buckets
  INSERT INTO public.module_buckets (institution_id, name, description, display_order, is_active)
  VALUES 
    (v_institution_id, 'Learn', 'Educational content and clinical learning modules', 1, true),
    (v_institution_id, 'Grow', 'Personal development and reflection tools', 2, true),
    (v_institution_id, 'Understand', 'Assessment and comprehension modules', 3, true)
  ON CONFLICT (institution_id, name) DO UPDATE
  SET description = EXCLUDED.description,
      display_order = EXCLUDED.display_order,
      is_active = EXCLUDED.is_active;
  
  -- Get bucket IDs separately
  SELECT id INTO v_learn_bucket_id 
  FROM public.module_buckets 
  WHERE institution_id = v_institution_id AND name = 'Learn'
  LIMIT 1;
  
  SELECT id INTO v_grow_bucket_id 
  FROM public.module_buckets 
  WHERE institution_id = v_institution_id AND name = 'Grow'
  LIMIT 1;
  
  SELECT id INTO v_understand_bucket_id 
  FROM public.module_buckets 
  WHERE institution_id = v_institution_id AND name = 'Understand'
  LIMIT 1;
  
  RAISE NOTICE '✅ Module buckets created';
  RAISE NOTICE '   Learn bucket: %', v_learn_bucket_id;
  RAISE NOTICE '   Grow bucket: %', v_grow_bucket_id;
  RAISE NOTICE '   Understand bucket: %', v_understand_bucket_id;

  -- Create modules (GLOBAL - no institution_id, available to all institutions)
  -- Note: Since modules are global, we need to use a different conflict resolution
  -- We'll use ON CONFLICT on slug alone, but first need to handle the unique constraint
  
  -- Insert modules as global (institution_id = NULL)
  -- Use INSERT with ON CONFLICT for better conflict handling
  INSERT INTO public.modules (institution_id, bucket_id, slug, name, description, available_to_roles, is_active)
  VALUES 
    (NULL, v_learn_bucket_id, 'difficult-conversations', 'Difficult Conversations', 'Practice challenging communication scenarios', ARRAY['resident', 'faculty'], true),
    (NULL, v_learn_bucket_id, 'clinical-cases', 'Clinical Cases', 'Interactive clinical case studies', ARRAY['resident', 'faculty'], true),
    (NULL, v_grow_bucket_id, 'voice-journal', 'Voice Journal', 'Reflective voice journaling', ARRAY['resident'], true)
  ON CONFLICT (institution_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      available_to_roles = EXCLUDED.available_to_roles,
      is_active = EXCLUDED.is_active;
  
  RAISE NOTICE '✅ Global modules created (available to all institutions)';

END $$;

SELECT '✅ Initial data seeded successfully!' as status;

