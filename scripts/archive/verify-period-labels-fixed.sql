-- ============================================================================
-- VERIFY PERIOD LABELS ARE NOW CLEAN
-- ============================================================================

-- 1. Total counts
SELECT 
  'Total Ratings' as metric,
  COUNT(*) as count
FROM public.structured_ratings
UNION ALL
SELECT 
  'Faculty Assessments' as metric,
  COUNT(*) as count
FROM public.structured_ratings
WHERE rater_type = 'faculty'
UNION ALL
SELECT 
  'Self-Assessments' as metric,
  COUNT(*) as count
FROM public.structured_ratings
WHERE rater_type = 'self';

-- 2. Check period labels are clean (should all be "PGY X Fall" or "PGY X Spring" format)
SELECT DISTINCT period_label, COUNT(*) as count
FROM public.structured_ratings
WHERE rater_type = 'self'
GROUP BY period_label
ORDER BY period_label;

-- 3. Sample of self-assessments with clean labels
SELECT 
  up.full_name as resident_name,
  sr.period_label,
  sr.eq_empathy_positive_interactions as eq_sample,
  sr.pq_work_ethic_reliability as pq_sample,
  sr.iq_knowledge_base as iq_sample
FROM public.structured_ratings sr
JOIN public.residents r ON sr.resident_id = r.id
JOIN public.user_profiles up ON r.user_id = up.id
WHERE sr.rater_type = 'self'
ORDER BY sr.created_at DESC
LIMIT 10;

