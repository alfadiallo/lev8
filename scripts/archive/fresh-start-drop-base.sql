-- ============================================================================
-- FRESH START: Drop existing base tables for clean migration
-- Run this to prepare for analytics setup
-- ============================================================================

-- Drop all base tables (CASCADE removes dependent objects)
DROP TABLE IF EXISTS public.grow_voice_journal CASCADE;
DROP TABLE IF EXISTS public.module_buckets CASCADE;
DROP TABLE IF EXISTS public.device_trusts CASCADE;
DROP TABLE IF EXISTS public.faculty CASCADE;
DROP TABLE IF EXISTS public.residents CASCADE;
DROP TABLE IF EXISTS public.academic_classes CASCADE;
DROP TABLE IF EXISTS public.programs CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.health_systems CASCADE;

-- Verification: Should return 0 rows
SELECT 
  table_name,
  '❌ Should be GONE' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'health_systems', 'programs', 'academic_classes', 
    'user_profiles', 'residents', 'faculty',
    'device_trusts', 'module_buckets', 'grow_voice_journal'
  );

/*
✅ After running this, you should see 0 rows.

Next steps:
1. ✅ Run: supabase/migrations/20250115000000_base_schema.sql
2. ✅ Run: supabase/migrations/20250115000001_add_learning_modules.sql
3. ✅ Run: supabase/migrations/20250115000002_analytics_foundation.sql
4. ✅ Run: supabase/migrations/20250115000003_analytics_rls_policies.sql
5. ✅ Run: scripts/seed-analytics-config.sql
6. ✅ Run: scripts/import-memorial-residents.sql (50 residents)
7. ✅ Upload MedHub CSV + process
8. ✅ Import ITE scores
9. ✅ Create Larissa test data
10. ✅ Test dashboard!
*/


