-- ============================================================================
-- VERIFY EQ+PQ+IQ IMPORT
-- ============================================================================
-- Check the imported structured_ratings data

-- 1. Overall counts
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

-- 2. Ratings by resident (top 10)
SELECT 
  up.full_name as resident_name,
  COUNT(*) as total_ratings,
  COUNT(CASE WHEN sr.rater_type = 'faculty' THEN 1 END) as faculty_ratings,
  COUNT(CASE WHEN sr.rater_type = 'self' THEN 1 END) as self_ratings
FROM public.structured_ratings sr
JOIN public.residents r ON sr.resident_id = r.id
JOIN public.user_profiles up ON r.user_id = up.id
GROUP BY up.full_name
ORDER BY total_ratings DESC
LIMIT 10;

-- 3. Average scores by category
SELECT 
  'Emotional Quotient (EQ)' as category,
  ROUND(AVG(eq_empathy_positive_interactions), 2) as avg_1,
  ROUND(AVG(eq_adaptability_self_awareness), 2) as avg_2,
  ROUND(AVG(eq_stress_management_resilience), 2) as avg_3,
  ROUND(AVG(eq_curiosity_growth_mindset), 2) as avg_4,
  ROUND(AVG(eq_effectiveness_communication), 2) as avg_5
FROM public.structured_ratings
UNION ALL
SELECT 
  'Physical Quotient (PQ)' as category,
  ROUND(AVG(pq_work_ethic_reliability), 2),
  ROUND(AVG(pq_integrity_accountability), 2),
  ROUND(AVG(pq_teachability_receptiveness), 2),
  ROUND(AVG(pq_documentation), 2),
  ROUND(AVG(pq_leadership_relationships), 2)
FROM public.structured_ratings
UNION ALL
SELECT 
  'Intellectual Quotient (IQ)' as category,
  ROUND(AVG(iq_knowledge_base), 2),
  ROUND(AVG(iq_analytical_thinking), 2),
  ROUND(AVG(iq_commitment_learning), 2),
  ROUND(AVG(iq_clinical_flexibility), 2),
  ROUND(AVG(iq_performance_for_level), 2)
FROM public.structured_ratings;

-- 4. Check for any NULL values in critical fields
SELECT 
  'Records with NULL resident_id' as issue,
  COUNT(*) as count
FROM public.structured_ratings
WHERE resident_id IS NULL
UNION ALL
SELECT 
  'Records with NULL faculty_id' as issue,
  COUNT(*) as count
FROM public.structured_ratings
WHERE faculty_id IS NULL AND rater_type = 'faculty'
UNION ALL
SELECT 
  'Records with NULL period_label' as issue,
  COUNT(*) as count
FROM public.structured_ratings
WHERE period_label IS NULL;

-- 5. Sample data (first 5 records)
SELECT 
  up.full_name as resident_name,
  sr.rater_type,
  sr.period_label,
  sr.eq_empathy_positive_interactions as eq_sample,
  sr.pq_work_ethic_reliability as pq_sample,
  sr.iq_knowledge_base as iq_sample,
  sr.created_at
FROM public.structured_ratings sr
JOIN public.residents r ON sr.resident_id = r.id
JOIN public.user_profiles up ON r.user_id = up.id
ORDER BY sr.created_at DESC
LIMIT 5;
