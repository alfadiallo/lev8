-- ============================================================================
-- FIX SELF-ASSESSMENT PERIOD LABELS
-- ============================================================================
-- Delete self-assessments with incorrect period_label (has concerns/goals text mixed in)
-- Then re-run: npx tsx scripts/import-self-assessments.ts

-- 1. Check current self-assessments
SELECT 
  COUNT(*) as total_self_assessments,
  COUNT(CASE WHEN period_label LIKE '%PGY%Fall%' OR period_label LIKE '%PGY%Spring%' THEN 1 END) as clean_labels,
  COUNT(CASE WHEN period_label NOT LIKE '%PGY%Fall%' AND period_label NOT LIKE '%PGY%Spring%' AND period_label NOT LIKE '%PGY% %' THEN 1 END) as dirty_labels
FROM public.structured_ratings
WHERE rater_type = 'self';

-- 2. Show examples of dirty labels
SELECT DISTINCT period_label
FROM public.structured_ratings
WHERE rater_type = 'self'
  AND period_label NOT LIKE '%Fall%'
  AND period_label NOT LIKE '%Spring%'
ORDER BY period_label
LIMIT 10;

-- 3. Delete all self-assessments (we'll re-import with fixed script)
DELETE FROM public.structured_ratings WHERE rater_type = 'self';

-- 4. Verify deletion
SELECT 
  COUNT(*) as remaining_self_assessments
FROM public.structured_ratings
WHERE rater_type = 'self';

-- 5. Check faculty assessments are still intact
SELECT 
  COUNT(*) as faculty_assessments
FROM public.structured_ratings
WHERE rater_type = 'faculty';

