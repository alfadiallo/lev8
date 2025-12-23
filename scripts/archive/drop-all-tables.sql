-- ============================================================================
-- DROP ALL TABLES Created Today (Base + Analytics)
-- Run this on the WRONG project to remove all table structures
-- ============================================================================

-- Step 1: Drop analytics tables (already done, but included for completeness)
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

-- Step 2: Drop base tables (created by base_schema.sql)
DROP TABLE IF EXISTS public.faculty CASCADE;
DROP TABLE IF EXISTS public.residents CASCADE;
DROP TABLE IF EXISTS public.academic_classes CASCADE;
DROP TABLE IF EXISTS public.programs CASCADE;
DROP TABLE IF EXISTS public.health_systems CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Step 3: Drop any learning module tables (if they were created)
DROP TABLE IF EXISTS public.clinical_cases CASCADE;
DROP TABLE IF EXISTS public.case_metadata CASCADE;
DROP TABLE IF EXISTS public.vignettes CASCADE;
DROP TABLE IF EXISTS public.vignette_sections CASCADE;
DROP TABLE IF EXISTS public.patient_representations CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_metadata CASCADE;
DROP TABLE IF EXISTS public.module_access_control_lists CASCADE;
DROP TABLE IF EXISTS public.running_board CASCADE;

-- Step 4: Drop helper functions
DROP FUNCTION IF EXISTS calculate_pgy_level(UUID, DATE) CASCADE;
DROP FUNCTION IF EXISTS determine_period(TEXT, DATE) CASCADE;
DROP FUNCTION IF EXISTS find_resident_by_medhub_name(TEXT) CASCADE;
DROP FUNCTION IF EXISTS find_resident_with_overrides(TEXT) CASCADE;

-- Step 5: Drop any custom types that were created
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.message_role CASCADE;
DROP TYPE IF EXISTS public.conversation_status CASCADE;

-- ============================================================================
-- VERIFICATION: Confirm all tables are gone
-- ============================================================================

-- List any remaining tables that shouldn't be there
SELECT 
  table_name,
  '❌ Should be DELETED' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    -- Analytics tables
    'rotation_types', 'imported_comments', 'structured_ratings', 
    'period_scores', 'swot_summaries', 'ite_scores', 
    'form_tokens', 'faculty_annotations', 'rosh_completion_snapshots',
    'medhub_staging', 'medhub_name_overrides',
    -- Base tables
    'residents', 'faculty', 'academic_classes', 'programs', 'health_systems', 'user_profiles',
    -- Learning module tables
    'clinical_cases', 'case_metadata', 'vignettes', 'vignette_sections',
    'patient_representations', 'conversations', 'messages', 'conversation_metadata',
    'module_access_control_lists', 'running_board'
  )
ORDER BY table_name;

-- Check for remaining custom functions
SELECT 
  routine_name,
  '❌ Should be DELETED' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'calculate_pgy_level', 'determine_period', 
    'find_resident_by_medhub_name', 'find_resident_with_overrides'
  );

-- ============================================================================
-- RESULT: All should return 0 rows (tables/functions don't exist)
-- ============================================================================

/*
✅ Expected result: Both verification queries should return 0 rows

After this, your wrong project is completely clean!

Next steps:
1. Switch to CORRECT Supabase project
2. Run migrations in order
3. Import data
4. Test dashboard
*/


