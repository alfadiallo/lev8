-- ============================================================================
-- DIAGNOSTIC: Show All Work Done Today (to delete from wrong project)
-- ============================================================================

-- Check which analytics tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('rotation_types', 'imported_comments', 'structured_ratings', 
                         'period_scores', 'swot_summaries', 'ite_scores', 
                         'form_tokens', 'faculty_annotations', 'rosh_completion_snapshots',
                         'medhub_staging', 'medhub_name_overrides')
    THEN '✅ Analytics table (created today)'
    ELSE '❓ Other table'
  END as table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'rotation_types', 'imported_comments', 'structured_ratings', 
    'period_scores', 'swot_summaries', 'ite_scores', 
    'form_tokens', 'faculty_annotations', 'rosh_completion_snapshots',
    'medhub_staging', 'medhub_name_overrides',
    'residents', 'user_profiles', 'academic_classes', 'programs', 'health_systems'
  )
ORDER BY table_name;

-- Count rows in each analytics table
SELECT 'rotation_types' as table_name, COUNT(*) as row_count FROM public.rotation_types
UNION ALL
SELECT 'imported_comments', COUNT(*) FROM public.imported_comments
UNION ALL
SELECT 'period_scores', COUNT(*) FROM public.period_scores
UNION ALL
SELECT 'swot_summaries', COUNT(*) FROM public.swot_summaries
UNION ALL
SELECT 'ite_scores', COUNT(*) FROM public.ite_scores
UNION ALL
SELECT 'medhub_staging', COUNT(*) FROM public.medhub_staging
UNION ALL
SELECT 'medhub_name_overrides', COUNT(*) FROM public.medhub_name_overrides
UNION ALL
SELECT 'residents', COUNT(*) FROM public.residents
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM public.user_profiles
UNION ALL
SELECT 'academic_classes', COUNT(*) FROM public.academic_classes
UNION ALL
SELECT 'programs', COUNT(*) FROM public.programs
UNION ALL
SELECT 'health_systems', COUNT(*) FROM public.health_systems
ORDER BY table_name;

-- Show recent residents (created today)
SELECT 
  up.full_name,
  up.created_at,
  'Resident' as record_type
FROM public.residents r
JOIN public.user_profiles up ON up.id = r.user_id
WHERE up.created_at::date = CURRENT_DATE
ORDER BY up.created_at DESC
LIMIT 10;

-- Show imported comments count by date
SELECT 
  DATE(imported_at) as import_date,
  COUNT(*) as comment_count
FROM public.imported_comments
GROUP BY DATE(imported_at)
ORDER BY import_date DESC;

-- Show ITE scores by date entered
SELECT 
  DATE(created_at) as entered_date,
  COUNT(*) as ite_count
FROM public.ite_scores
GROUP BY DATE(created_at)
ORDER BY entered_date DESC;

-- ============================================================================
-- CLEANUP COMMANDS (Run these to delete today's work)
-- ============================================================================

/*
-- Option 1: Delete ONLY analytics data (keep base tables)
DELETE FROM public.ite_scores;
DELETE FROM public.swot_summaries;
DELETE FROM public.period_scores;
DELETE FROM public.imported_comments;
DELETE FROM public.medhub_name_overrides;
DELETE FROM public.medhub_staging;
DELETE FROM public.rotation_types;

-- Option 2: Delete residents and all related data (CASCADE will handle analytics)
DELETE FROM public.residents;  -- This will CASCADE to all analytics tables
DELETE FROM public.user_profiles WHERE role = 'resident';
DELETE FROM public.academic_classes;
DELETE FROM public.programs WHERE name = 'Emergency Medicine';
DELETE FROM public.health_systems WHERE name = 'Memorial Healthcare System';

-- Option 3: DROP all analytics tables entirely (nuclear option)
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

-- Drop helper functions
DROP FUNCTION IF EXISTS calculate_pgy_level(UUID, DATE);
DROP FUNCTION IF EXISTS determine_period(TEXT, DATE);
DROP FUNCTION IF EXISTS find_resident_by_medhub_name(TEXT);
DROP FUNCTION IF EXISTS find_resident_with_overrides(TEXT);
*/

-- ============================================================================
-- VERIFICATION: Confirm cleanup (run after DELETE/DROP)
-- ============================================================================

/*
-- Check if analytics tables still exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%swot%' 
   OR table_name LIKE '%ite%' 
   OR table_name LIKE '%medhub%'
   OR table_name LIKE '%imported%';

-- Check resident count
SELECT COUNT(*) as resident_count FROM public.residents;
*/


