-- ============================================================================
-- COMPLETE CLEANUP: Delete ALL work done today
-- Run this on the WRONG project to clean everything up
-- ============================================================================

-- Step 1: Drop all analytics tables (CASCADE removes all data and dependencies)
DROP TABLE IF EXISTS public.rosh_completion_snapshots CASCADE;
DROP TABLE IF EXISTS public.faculty_annotations CASCADE;
DROP TABLE IF EXISTS public.form_tokens CASCADE;
DROP TABLE IF EXISTS public.ite_scores CASCADE;
DROP TABLE IF EXISTS public.swot_summaries CASCADE;
DROP TABLE IF EXISTS public.period_scores CASCADE;
DROP TABLE IF EXISTS public.structured_ratings CASCADE;
DROP TABLE IF EXISTS public.imported_comments CASCADE;
DROP TABLE IF EXISTS public.medhub_name_overrides CASCADE;
DROP TABLE IF EXISTS public.medhub_staging CASCADE;
DROP TABLE IF EXISTS public.rotation_types CASCADE;

-- Step 2: Drop analytics helper functions
DROP FUNCTION IF EXISTS calculate_pgy_level(UUID, DATE) CASCADE;
DROP FUNCTION IF EXISTS determine_period(TEXT, DATE) CASCADE;
DROP FUNCTION IF EXISTS find_resident_by_medhub_name(TEXT) CASCADE;
DROP FUNCTION IF EXISTS find_resident_with_overrides(TEXT) CASCADE;

-- Step 3: Delete all residents and related data
DELETE FROM public.residents;  -- This CASCADE deletes any remaining analytics references

-- Step 4: Delete user profiles created today (residents and faculty)
DELETE FROM public.user_profiles 
WHERE created_at::date = CURRENT_DATE;

-- Step 5: Delete academic classes
DELETE FROM public.academic_classes;

-- Step 6: Delete programs (Emergency Medicine)
DELETE FROM public.programs 
WHERE name = 'Emergency Medicine';

-- Step 7: Delete health systems (Memorial Healthcare System)
DELETE FROM public.health_systems 
WHERE name = 'Memorial Healthcare System';

-- ============================================================================
-- VERIFICATION: Confirm everything is cleaned up
-- ============================================================================

-- Check if analytics tables still exist
SELECT 
  table_name,
  'Should be GONE' as expected_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name IN ('rotation_types', 'imported_comments', 'structured_ratings', 
                   'period_scores', 'swot_summaries', 'ite_scores', 
                   'form_tokens', 'faculty_annotations', 'rosh_completion_snapshots',
                   'medhub_staging', 'medhub_name_overrides')
  );

-- Check if functions still exist
SELECT 
  routine_name,
  'Should be GONE' as expected_status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('calculate_pgy_level', 'determine_period', 
                       'find_resident_by_medhub_name', 'find_resident_with_overrides');

-- Check remaining data counts
SELECT 'residents' as table_name, COUNT(*) as remaining_rows FROM public.residents
UNION ALL
SELECT 'user_profiles (residents)', COUNT(*) FROM public.user_profiles WHERE role = 'resident'
UNION ALL
SELECT 'academic_classes', COUNT(*) FROM public.academic_classes
UNION ALL
SELECT 'programs', COUNT(*) FROM public.programs WHERE name = 'Emergency Medicine'
UNION ALL
SELECT 'health_systems', COUNT(*) FROM public.health_systems WHERE name = 'Memorial Healthcare System';

-- ============================================================================
-- RESULT: Everything should be ZERO or GONE
-- ============================================================================

/*
Expected verification results:
- Analytics tables: Should return 0 rows (tables don't exist)
- Functions: Should return 0 rows (functions don't exist)
- Data counts: All should be 0

You're now ready to switch to the CORRECT project and re-run all setup scripts!
*/



