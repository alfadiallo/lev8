-- ============================================================================
-- AGGREGATE PERIOD SCORES FROM STRUCTURED RATINGS
-- ============================================================================
-- This script aggregates structured_ratings into period_scores table
-- Run this after importing EQ+PQ+IQ data to populate the dashboard

-- Clear existing period scores (optional - comment out if you want to keep existing)
-- DELETE FROM public.period_scores;

-- Aggregate faculty ratings by resident and period
WITH faculty_agg AS (
  SELECT 
    resident_id,
    period_label,
    COUNT(*) as n_raters,
    ROUND(AVG(eq_avg), 2) as eq_avg,
    ROUND(AVG(pq_avg), 2) as pq_avg,
    ROUND(AVG(iq_avg), 2) as iq_avg,
    jsonb_build_object(
      'eq_empathy', ROUND(AVG(eq_empathy_positive_interactions), 2),
      'eq_adaptability', ROUND(AVG(eq_adaptability_self_awareness), 2),
      'eq_stress', ROUND(AVG(eq_stress_management_resilience), 2),
      'eq_curiosity', ROUND(AVG(eq_curiosity_growth_mindset), 2),
      'eq_communication', ROUND(AVG(eq_effectiveness_communication), 2),
      'pq_work_ethic', ROUND(AVG(pq_work_ethic_reliability), 2),
      'pq_integrity', ROUND(AVG(pq_integrity_accountability), 2),
      'pq_teachability', ROUND(AVG(pq_teachability_receptiveness), 2),
      'pq_documentation', ROUND(AVG(pq_documentation), 2),
      'pq_leadership', ROUND(AVG(pq_leadership_relationships), 2),
      'iq_knowledge', ROUND(AVG(iq_knowledge_base), 2),
      'iq_analytical', ROUND(AVG(iq_analytical_thinking), 2),
      'iq_learning', ROUND(AVG(iq_commitment_learning), 2),
      'iq_flexibility', ROUND(AVG(iq_clinical_flexibility), 2),
      'iq_performance', ROUND(AVG(iq_performance_for_level), 2)
    ) as ratings_detail
  FROM public.structured_ratings
  WHERE rater_type = 'faculty'
  GROUP BY resident_id, period_label
),
-- Aggregate self-assessments by resident and period
self_agg AS (
  SELECT 
    resident_id,
    period_label,
    ROUND(AVG(eq_avg), 2) as eq_avg,
    ROUND(AVG(pq_avg), 2) as pq_avg,
    ROUND(AVG(iq_avg), 2) as iq_avg,
    jsonb_build_object(
      'eq_empathy', ROUND(AVG(eq_empathy_positive_interactions), 2),
      'eq_adaptability', ROUND(AVG(eq_adaptability_self_awareness), 2),
      'eq_stress', ROUND(AVG(eq_stress_management_resilience), 2),
      'eq_curiosity', ROUND(AVG(eq_curiosity_growth_mindset), 2),
      'eq_communication', ROUND(AVG(eq_effectiveness_communication), 2),
      'pq_work_ethic', ROUND(AVG(pq_work_ethic_reliability), 2),
      'pq_integrity', ROUND(AVG(pq_integrity_accountability), 2),
      'pq_teachability', ROUND(AVG(pq_teachability_receptiveness), 2),
      'pq_documentation', ROUND(AVG(pq_documentation), 2),
      'pq_leadership', ROUND(AVG(pq_leadership_relationships), 2),
      'iq_knowledge', ROUND(AVG(iq_knowledge_base), 2),
      'iq_analytical', ROUND(AVG(iq_analytical_thinking), 2),
      'iq_learning', ROUND(AVG(iq_commitment_learning), 2),
      'iq_flexibility', ROUND(AVG(iq_clinical_flexibility), 2),
      'iq_performance', ROUND(AVG(iq_performance_for_level), 2)
    ) as ratings_detail
  FROM public.structured_ratings
  WHERE rater_type = 'self'
  GROUP BY resident_id, period_label
),
-- Get all unique resident-period combinations
all_periods AS (
  SELECT DISTINCT resident_id, period_label
  FROM public.structured_ratings
)
-- Insert aggregated scores into period_scores
INSERT INTO public.period_scores (
  resident_id,
  period_label,
  faculty_eq_avg,
  faculty_pq_avg,
  faculty_iq_avg,
  faculty_n_raters,
  faculty_ratings_detail,
  self_eq_avg,
  self_pq_avg,
  self_iq_avg,
  self_ratings_detail,
  self_faculty_gap_eq,
  self_faculty_gap_pq,
  self_faculty_gap_iq,
  is_current,
  analysis_version
)
SELECT 
  ap.resident_id,
  ap.period_label,
  f.eq_avg as faculty_eq_avg,
  f.pq_avg as faculty_pq_avg,
  f.iq_avg as faculty_iq_avg,
  f.n_raters as faculty_n_raters,
  f.ratings_detail as faculty_ratings_detail,
  s.eq_avg as self_eq_avg,
  s.pq_avg as self_pq_avg,
  s.iq_avg as self_iq_avg,
  s.ratings_detail as self_ratings_detail,
  ROUND((s.eq_avg - f.eq_avg), 2) as self_faculty_gap_eq,
  ROUND((s.pq_avg - f.pq_avg), 2) as self_faculty_gap_pq,
  ROUND((s.iq_avg - f.iq_avg), 2) as self_faculty_gap_iq,
  TRUE as is_current,
  'v1.0' as analysis_version
FROM all_periods ap
LEFT JOIN faculty_agg f ON ap.resident_id = f.resident_id AND ap.period_label = f.period_label
LEFT JOIN self_agg s ON ap.resident_id = s.resident_id AND ap.period_label = s.period_label
ON CONFLICT (resident_id, period_label, analysis_version) 
DO UPDATE SET
  faculty_eq_avg = EXCLUDED.faculty_eq_avg,
  faculty_pq_avg = EXCLUDED.faculty_pq_avg,
  faculty_iq_avg = EXCLUDED.faculty_iq_avg,
  faculty_n_raters = EXCLUDED.faculty_n_raters,
  faculty_ratings_detail = EXCLUDED.faculty_ratings_detail,
  self_eq_avg = EXCLUDED.self_eq_avg,
  self_pq_avg = EXCLUDED.self_pq_avg,
  self_iq_avg = EXCLUDED.self_iq_avg,
  self_ratings_detail = EXCLUDED.self_ratings_detail,
  self_faculty_gap_eq = EXCLUDED.self_faculty_gap_eq,
  self_faculty_gap_pq = EXCLUDED.self_faculty_gap_pq,
  self_faculty_gap_iq = EXCLUDED.self_faculty_gap_iq,
  updated_at = NOW();

-- Verification: Show aggregated period scores
SELECT 
  up.full_name as resident_name,
  ps.period_label,
  ps.faculty_eq_avg,
  ps.faculty_pq_avg,
  ps.faculty_iq_avg,
  ps.faculty_n_raters,
  ps.self_eq_avg,
  ps.self_pq_avg,
  ps.self_iq_avg,
  ps.self_faculty_gap_eq,
  ps.self_faculty_gap_pq,
  ps.self_faculty_gap_iq
FROM public.period_scores ps
JOIN public.residents r ON ps.resident_id = r.id
JOIN public.user_profiles up ON r.user_id = up.id
ORDER BY up.full_name, ps.period_label
LIMIT 20;

-- Summary statistics
SELECT 
  COUNT(*) as total_period_scores,
  COUNT(DISTINCT resident_id) as unique_residents,
  COUNT(CASE WHEN faculty_eq_avg IS NOT NULL THEN 1 END) as periods_with_faculty_ratings,
  COUNT(CASE WHEN self_eq_avg IS NOT NULL THEN 1 END) as periods_with_self_ratings
FROM public.period_scores;


