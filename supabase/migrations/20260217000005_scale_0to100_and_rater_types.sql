-- ============================================================================
-- Migration: Convert EQ/PQ/IQ Scale from 1-5 to 0-100
--            Rename rater_type 'faculty' to 'core_faculty'
--            Add 'teaching_faculty' rater type
--
-- Formula: new_score = (old_score - 1) * 25
--   1.0 → 0, 2.0 → 25, 3.0 → 50, 4.0 → 75, 5.0 → 100
--
-- Idempotent: safe to re-run if a previous attempt partially applied.
-- ============================================================================

-- ============================================================================
-- 1. RENAME RATER TYPE: faculty → core_faculty, add teaching_faculty
-- ============================================================================

-- DROP the old constraint FIRST (before any data changes)
ALTER TABLE public.structured_ratings
DROP CONSTRAINT IF EXISTS structured_ratings_rater_type_check;

-- Now safe to update existing 'faculty' ratings to 'core_faculty'
UPDATE public.structured_ratings
SET rater_type = 'core_faculty'
WHERE rater_type = 'faculty';

-- Add the new constraint allowing both faculty types
ALTER TABLE public.structured_ratings
ADD CONSTRAINT structured_ratings_rater_type_check
CHECK (rater_type IN ('core_faculty', 'teaching_faculty', 'self'));

-- ============================================================================
-- 2. DROP old attribute CHECK constraints (1.0 to 5.0)
--    Must happen before data conversion and column type changes
-- ============================================================================

ALTER TABLE public.structured_ratings
  DROP CONSTRAINT IF EXISTS structured_ratings_eq_empathy_positive_interactions_check,
  DROP CONSTRAINT IF EXISTS structured_ratings_eq_adaptability_self_awareness_check,
  DROP CONSTRAINT IF EXISTS structured_ratings_eq_stress_management_resilience_check,
  DROP CONSTRAINT IF EXISTS structured_ratings_eq_curiosity_growth_mindset_check,
  DROP CONSTRAINT IF EXISTS structured_ratings_eq_effectiveness_communication_check,
  DROP CONSTRAINT IF EXISTS structured_ratings_pq_work_ethic_reliability_check,
  DROP CONSTRAINT IF EXISTS structured_ratings_pq_integrity_accountability_check,
  DROP CONSTRAINT IF EXISTS structured_ratings_pq_teachability_receptiveness_check,
  DROP CONSTRAINT IF EXISTS structured_ratings_pq_documentation_check,
  DROP CONSTRAINT IF EXISTS structured_ratings_pq_leadership_relationships_check,
  DROP CONSTRAINT IF EXISTS structured_ratings_iq_knowledge_base_check,
  DROP CONSTRAINT IF EXISTS structured_ratings_iq_analytical_thinking_check,
  DROP CONSTRAINT IF EXISTS structured_ratings_iq_commitment_learning_check,
  DROP CONSTRAINT IF EXISTS structured_ratings_iq_clinical_flexibility_check,
  DROP CONSTRAINT IF EXISTS structured_ratings_iq_performance_for_level_check;

-- ============================================================================
-- 3. Widen column types BEFORE data conversion
--    (NUMERIC(2,1) cannot hold values > 9.9; need NUMERIC(5,1) for 0-100)
-- ============================================================================

ALTER TABLE public.structured_ratings
  ALTER COLUMN eq_empathy_positive_interactions  TYPE NUMERIC(5,1),
  ALTER COLUMN eq_adaptability_self_awareness    TYPE NUMERIC(5,1),
  ALTER COLUMN eq_stress_management_resilience   TYPE NUMERIC(5,1),
  ALTER COLUMN eq_curiosity_growth_mindset       TYPE NUMERIC(5,1),
  ALTER COLUMN eq_effectiveness_communication    TYPE NUMERIC(5,1),
  ALTER COLUMN pq_work_ethic_reliability         TYPE NUMERIC(5,1),
  ALTER COLUMN pq_integrity_accountability       TYPE NUMERIC(5,1),
  ALTER COLUMN pq_teachability_receptiveness     TYPE NUMERIC(5,1),
  ALTER COLUMN pq_documentation                  TYPE NUMERIC(5,1),
  ALTER COLUMN pq_leadership_relationships       TYPE NUMERIC(5,1),
  ALTER COLUMN iq_knowledge_base                 TYPE NUMERIC(5,1),
  ALTER COLUMN iq_analytical_thinking            TYPE NUMERIC(5,1),
  ALTER COLUMN iq_commitment_learning            TYPE NUMERIC(5,1),
  ALTER COLUMN iq_clinical_flexibility           TYPE NUMERIC(5,1),
  ALTER COLUMN iq_performance_for_level          TYPE NUMERIC(5,1);

-- Widen avg columns from NUMERIC(3,2) to NUMERIC(5,1)
ALTER TABLE public.structured_ratings
  ALTER COLUMN eq_avg TYPE NUMERIC(5,1),
  ALTER COLUMN pq_avg TYPE NUMERIC(5,1),
  ALTER COLUMN iq_avg TYPE NUMERIC(5,1);

-- ============================================================================
-- 4. UPDATE trigger BEFORE data conversion so backfill computes correctly
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_rating_averages()
RETURNS TRIGGER AS $$
DECLARE
  eq_sum NUMERIC := 0;
  eq_count INT := 0;
  pq_sum NUMERIC := 0;
  pq_count INT := 0;
  iq_sum NUMERIC := 0;
  iq_count INT := 0;
BEGIN
  -- EQ attributes
  IF NEW.eq_empathy_positive_interactions IS NOT NULL THEN
    eq_sum := eq_sum + NEW.eq_empathy_positive_interactions; eq_count := eq_count + 1;
  END IF;
  IF NEW.eq_adaptability_self_awareness IS NOT NULL THEN
    eq_sum := eq_sum + NEW.eq_adaptability_self_awareness; eq_count := eq_count + 1;
  END IF;
  IF NEW.eq_stress_management_resilience IS NOT NULL THEN
    eq_sum := eq_sum + NEW.eq_stress_management_resilience; eq_count := eq_count + 1;
  END IF;
  IF NEW.eq_curiosity_growth_mindset IS NOT NULL THEN
    eq_sum := eq_sum + NEW.eq_curiosity_growth_mindset; eq_count := eq_count + 1;
  END IF;
  IF NEW.eq_effectiveness_communication IS NOT NULL THEN
    eq_sum := eq_sum + NEW.eq_effectiveness_communication; eq_count := eq_count + 1;
  END IF;

  -- PQ attributes
  IF NEW.pq_work_ethic_reliability IS NOT NULL THEN
    pq_sum := pq_sum + NEW.pq_work_ethic_reliability; pq_count := pq_count + 1;
  END IF;
  IF NEW.pq_integrity_accountability IS NOT NULL THEN
    pq_sum := pq_sum + NEW.pq_integrity_accountability; pq_count := pq_count + 1;
  END IF;
  IF NEW.pq_teachability_receptiveness IS NOT NULL THEN
    pq_sum := pq_sum + NEW.pq_teachability_receptiveness; pq_count := pq_count + 1;
  END IF;
  IF NEW.pq_documentation IS NOT NULL THEN
    pq_sum := pq_sum + NEW.pq_documentation; pq_count := pq_count + 1;
  END IF;
  IF NEW.pq_leadership_relationships IS NOT NULL THEN
    pq_sum := pq_sum + NEW.pq_leadership_relationships; pq_count := pq_count + 1;
  END IF;

  -- IQ attributes
  IF NEW.iq_knowledge_base IS NOT NULL THEN
    iq_sum := iq_sum + NEW.iq_knowledge_base; iq_count := iq_count + 1;
  END IF;
  IF NEW.iq_analytical_thinking IS NOT NULL THEN
    iq_sum := iq_sum + NEW.iq_analytical_thinking; iq_count := iq_count + 1;
  END IF;
  IF NEW.iq_commitment_learning IS NOT NULL THEN
    iq_sum := iq_sum + NEW.iq_commitment_learning; iq_count := iq_count + 1;
  END IF;
  IF NEW.iq_clinical_flexibility IS NOT NULL THEN
    iq_sum := iq_sum + NEW.iq_clinical_flexibility; iq_count := iq_count + 1;
  END IF;
  IF NEW.iq_performance_for_level IS NOT NULL THEN
    iq_sum := iq_sum + NEW.iq_performance_for_level; iq_count := iq_count + 1;
  END IF;

  -- Compute averages (NULL if no attributes provided)
  NEW.eq_avg := CASE WHEN eq_count > 0 THEN ROUND(eq_sum / eq_count, 1) ELSE NULL END;
  NEW.pq_avg := CASE WHEN pq_count > 0 THEN ROUND(pq_sum / pq_count, 1) ELSE NULL END;
  NEW.iq_avg := CASE WHEN iq_count > 0 THEN ROUND(iq_sum / iq_count, 1) ELSE NULL END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. CONVERT structured_ratings data: (old_value - 1) * 25
--    Only convert rows still on the 1-5 scale (max attribute value <= 5)
--    This makes the migration idempotent for partial re-runs.
-- ============================================================================

UPDATE public.structured_ratings SET
  eq_empathy_positive_interactions  = (eq_empathy_positive_interactions - 1) * 25,
  eq_adaptability_self_awareness    = (eq_adaptability_self_awareness - 1) * 25,
  eq_stress_management_resilience   = (eq_stress_management_resilience - 1) * 25,
  eq_curiosity_growth_mindset       = (eq_curiosity_growth_mindset - 1) * 25,
  eq_effectiveness_communication    = (eq_effectiveness_communication - 1) * 25,
  pq_work_ethic_reliability         = (pq_work_ethic_reliability - 1) * 25,
  pq_integrity_accountability       = (pq_integrity_accountability - 1) * 25,
  pq_teachability_receptiveness     = (pq_teachability_receptiveness - 1) * 25,
  pq_documentation                  = (pq_documentation - 1) * 25,
  pq_leadership_relationships       = (pq_leadership_relationships - 1) * 25,
  iq_knowledge_base                 = (iq_knowledge_base - 1) * 25,
  iq_analytical_thinking            = (iq_analytical_thinking - 1) * 25,
  iq_commitment_learning            = (iq_commitment_learning - 1) * 25,
  iq_clinical_flexibility           = (iq_clinical_flexibility - 1) * 25,
  iq_performance_for_level          = (iq_performance_for_level - 1) * 25
WHERE COALESCE(eq_empathy_positive_interactions, 0) <= 5
  AND COALESCE(pq_work_ethic_reliability, 0) <= 5
  AND COALESCE(iq_knowledge_base, 0) <= 5;

-- ============================================================================
-- 6. Add new CHECK constraints (0 to 100)
-- ============================================================================

ALTER TABLE public.structured_ratings
  ADD CONSTRAINT structured_ratings_eq_empathy_positive_interactions_check
    CHECK (eq_empathy_positive_interactions BETWEEN 0 AND 100),
  ADD CONSTRAINT structured_ratings_eq_adaptability_self_awareness_check
    CHECK (eq_adaptability_self_awareness BETWEEN 0 AND 100),
  ADD CONSTRAINT structured_ratings_eq_stress_management_resilience_check
    CHECK (eq_stress_management_resilience BETWEEN 0 AND 100),
  ADD CONSTRAINT structured_ratings_eq_curiosity_growth_mindset_check
    CHECK (eq_curiosity_growth_mindset BETWEEN 0 AND 100),
  ADD CONSTRAINT structured_ratings_eq_effectiveness_communication_check
    CHECK (eq_effectiveness_communication BETWEEN 0 AND 100),
  ADD CONSTRAINT structured_ratings_pq_work_ethic_reliability_check
    CHECK (pq_work_ethic_reliability BETWEEN 0 AND 100),
  ADD CONSTRAINT structured_ratings_pq_integrity_accountability_check
    CHECK (pq_integrity_accountability BETWEEN 0 AND 100),
  ADD CONSTRAINT structured_ratings_pq_teachability_receptiveness_check
    CHECK (pq_teachability_receptiveness BETWEEN 0 AND 100),
  ADD CONSTRAINT structured_ratings_pq_documentation_check
    CHECK (pq_documentation BETWEEN 0 AND 100),
  ADD CONSTRAINT structured_ratings_pq_leadership_relationships_check
    CHECK (pq_leadership_relationships BETWEEN 0 AND 100),
  ADD CONSTRAINT structured_ratings_iq_knowledge_base_check
    CHECK (iq_knowledge_base BETWEEN 0 AND 100),
  ADD CONSTRAINT structured_ratings_iq_analytical_thinking_check
    CHECK (iq_analytical_thinking BETWEEN 0 AND 100),
  ADD CONSTRAINT structured_ratings_iq_commitment_learning_check
    CHECK (iq_commitment_learning BETWEEN 0 AND 100),
  ADD CONSTRAINT structured_ratings_iq_clinical_flexibility_check
    CHECK (iq_clinical_flexibility BETWEEN 0 AND 100),
  ADD CONSTRAINT structured_ratings_iq_performance_for_level_check
    CHECK (iq_performance_for_level BETWEEN 0 AND 100);

-- ============================================================================
-- 7. CONVERT period_scores from 1-5 to 0-100
-- ============================================================================

-- Widen column types first
ALTER TABLE public.period_scores
  ALTER COLUMN faculty_eq_avg       TYPE NUMERIC(5,1),
  ALTER COLUMN faculty_pq_avg       TYPE NUMERIC(5,1),
  ALTER COLUMN faculty_iq_avg       TYPE NUMERIC(5,1),
  ALTER COLUMN self_eq_avg          TYPE NUMERIC(5,1),
  ALTER COLUMN self_pq_avg          TYPE NUMERIC(5,1),
  ALTER COLUMN self_iq_avg          TYPE NUMERIC(5,1),
  ALTER COLUMN ai_eq_avg            TYPE NUMERIC(5,1),
  ALTER COLUMN ai_pq_avg            TYPE NUMERIC(5,1),
  ALTER COLUMN ai_iq_avg            TYPE NUMERIC(5,1),
  ALTER COLUMN self_faculty_gap_eq  TYPE NUMERIC(5,1),
  ALTER COLUMN self_faculty_gap_pq  TYPE NUMERIC(5,1),
  ALTER COLUMN self_faculty_gap_iq  TYPE NUMERIC(5,1);

-- Convert averages: (old_value - 1) * 25 (only rows still on 1-5 scale)
UPDATE public.period_scores SET
  faculty_eq_avg  = (faculty_eq_avg - 1) * 25,
  faculty_pq_avg  = (faculty_pq_avg - 1) * 25,
  faculty_iq_avg  = (faculty_iq_avg - 1) * 25,
  self_eq_avg     = (self_eq_avg - 1) * 25,
  self_pq_avg     = (self_pq_avg - 1) * 25,
  self_iq_avg     = (self_iq_avg - 1) * 25,
  ai_eq_avg       = (ai_eq_avg - 1) * 25,
  ai_pq_avg       = (ai_pq_avg - 1) * 25,
  ai_iq_avg       = (ai_iq_avg - 1) * 25,
  self_faculty_gap_eq = self_faculty_gap_eq * 25,
  self_faculty_gap_pq = self_faculty_gap_pq * 25,
  self_faculty_gap_iq = self_faculty_gap_iq * 25
WHERE COALESCE(faculty_eq_avg, 0) <= 5
  AND COALESCE(self_eq_avg, 0) <= 5;

-- ============================================================================
-- 8. Backfill: re-trigger avg computation on all structured_ratings rows
--    so eq_avg/pq_avg/iq_avg reflect the converted 0-100 values
-- ============================================================================

UPDATE public.structured_ratings
SET updated_at = NOW()
WHERE id IS NOT NULL;
