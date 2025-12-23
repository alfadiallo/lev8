-- ============================================================================
-- Quick Database Check - Shows everything in one view
-- Copy and paste this entire script into Supabase SQL Editor
-- ============================================================================

-- Show table existence status
SELECT '=== TABLE STATUS ===' as info;

SELECT 
  'Core Tables' as category,
  table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = t.table_name
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (VALUES
  ('health_systems'), ('programs'), ('academic_classes'),
  ('user_profiles'), ('residents'), ('faculty'), 
  ('module_buckets')
) AS t(table_name)

UNION ALL

SELECT 
  'Learning Module Tables' as category,
  table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = t.table_name
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (VALUES
  ('modules'), ('vignettes'), ('training_sessions'), 
  ('session_analytics'), ('clinical_cases')
) AS t(table_name)

ORDER BY category, status DESC, table_name;

-- Show user_profiles schema
SELECT '=== USER_PROFILES SCHEMA ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Show data counts (using safe queries, no function drop needed)
SELECT '=== DATA COUNTS ===' as info;

SELECT 
  'health_systems' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'health_systems')
    THEN (SELECT COUNT(*)::TEXT FROM public.health_systems)
    ELSE 'N/A' END as row_count
UNION ALL
SELECT 
  'programs' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'programs')
    THEN (SELECT COUNT(*)::TEXT FROM public.programs)
    ELSE 'N/A' END as row_count
UNION ALL
SELECT 
  'user_profiles' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles')
    THEN (SELECT COUNT(*)::TEXT FROM public.user_profiles)
    ELSE 'N/A' END as row_count
UNION ALL
SELECT 
  'vignettes' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vignettes')
    THEN (SELECT COUNT(*)::TEXT FROM public.vignettes)
    ELSE 'N/A' END as row_count
UNION ALL
SELECT 
  'modules' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modules')
    THEN (SELECT COUNT(*)::TEXT FROM public.modules)
    ELSE 'N/A' END as row_count
UNION ALL
SELECT 
  'module_buckets' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'module_buckets')
    THEN (SELECT COUNT(*)::TEXT FROM public.module_buckets)
    ELSE 'N/A' END as row_count;

-- Show what to do next (safe version)
SELECT '=== NEXT STEPS ===' as info;

DO $$
DECLARE
  vignette_exists BOOLEAN := false;
  rls_enabled BOOLEAN := false;
BEGIN
  -- Check if RLS is enabled on vignettes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vignettes') THEN
    SELECT COUNT(*) > 0 INTO rls_enabled
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'vignettes'
      AND policyname = 'vignettes_access';
  END IF;
  
  -- Check if MED-001 exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vignettes') THEN
    EXECUTE 'SELECT EXISTS(SELECT 1 FROM public.vignettes WHERE title LIKE ''%Adenosine%'')' INTO vignette_exists;
  END IF;
  
  -- Provide next steps based on current state
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'health_systems') THEN
    RAISE NOTICE '1. Run scripts/02-setup-base-schema.sql to create all tables';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vignettes') THEN
    RAISE NOTICE '2. Run scripts/02-setup-base-schema.sql to create vignettes table';
  ELSIF NOT rls_enabled THEN
    RAISE NOTICE '3. Run scripts/03-setup-rls-policies.sql to enable Row Level Security';
  ELSIF NOT vignette_exists THEN
    RAISE NOTICE '4. Run scripts/06-import-med001-complete.sql to import MED-001 vignette';
  ELSE
    RAISE NOTICE '✅ Setup looks complete! MED-001 vignette should be visible in the app.';
  END IF;
END $$;

-- Also return next steps as a result set
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'health_systems') 
      THEN '1. Run scripts/02-setup-base-schema.sql'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vignettes') 
      THEN '2. Run scripts/02-setup-base-schema.sql'
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'vignettes' AND policyname = 'vignettes_access'
    ) 
      THEN '3. Run scripts/03-setup-rls-policies.sql'
    WHEN NOT EXISTS (
      SELECT 1 FROM public.vignettes WHERE title LIKE '%Adenosine%'
    ) 
      THEN '4. Run scripts/06-import-med001-complete.sql'
    ELSE '✅ Setup complete! MED-001 should be visible in the app.'
  END as next_action;

