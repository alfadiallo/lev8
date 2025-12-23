-- ============================================================================
-- ITE CLASS STATISTICS VIEW
-- Migration: 20250116000002_ite_class_statistics.sql
-- Purpose: Auto-calculate class averages and rankings for ITE scores
-- ============================================================================

-- ============================================================================
-- 1. CLASS STATISTICS VIEW
-- Aggregates ITE scores by academic_year and pgy_level
-- ============================================================================

CREATE OR REPLACE VIEW ite_class_statistics AS
SELECT 
  academic_year,
  pgy_level,
  COUNT(*) as class_size,
  ROUND(AVG(raw_score), 1) as avg_score,
  ROUND(AVG(percentile), 1) as avg_percentile,
  MIN(raw_score) as min_score,
  MAX(raw_score) as max_score,
  MIN(percentile) as min_percentile,
  MAX(percentile) as max_percentile,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY percentile) as median_percentile
FROM ite_scores
WHERE raw_score IS NOT NULL OR percentile IS NOT NULL
GROUP BY academic_year, pgy_level;

-- ============================================================================
-- 2. RESIDENT ITE WITH RANK VIEW
-- Shows each resident's ITE score with their class rank and class average
-- ============================================================================

CREATE OR REPLACE VIEW ite_scores_with_rank AS
SELECT 
  s.id,
  s.resident_id,
  s.test_date,
  s.academic_year,
  s.pgy_level,
  s.raw_score,
  s.percentile,
  s.created_at,
  -- Class statistics
  cs.class_size,
  cs.avg_score as class_avg_score,
  cs.avg_percentile as class_avg_percentile,
  -- Rank within class (by percentile, descending)
  RANK() OVER (
    PARTITION BY s.academic_year, s.pgy_level 
    ORDER BY s.percentile DESC NULLS LAST
  ) as class_rank
FROM ite_scores s
LEFT JOIN ite_class_statistics cs 
  ON s.academic_year = cs.academic_year 
  AND s.pgy_level = cs.pgy_level;

-- ============================================================================
-- 3. GRANT ACCESS
-- ============================================================================

GRANT SELECT ON ite_class_statistics TO authenticated;
GRANT SELECT ON ite_scores_with_rank TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================




