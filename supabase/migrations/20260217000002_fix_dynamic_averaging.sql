-- ============================================================================
-- Migration: Fix Dynamic EQ/PQ/IQ Averaging
-- 
-- Problem: The existing calculate_rating_averages() trigger always divides by
-- 5.0, even when some attributes are NULL. Historical data (pre-June 2025)
-- only had 4 EQ attributes (missing eq_effectiveness_communication), resulting
-- in deflated EQ averages.
--
-- Fix: Count only non-null attributes per section and divide by that count.
-- Also backfills all existing structured_ratings rows.
-- ============================================================================

-- Replace the trigger function with dynamic counting
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
    eq_sum := eq_sum + NEW.eq_empathy_positive_interactions;
    eq_count := eq_count + 1;
  END IF;
  IF NEW.eq_adaptability_self_awareness IS NOT NULL THEN
    eq_sum := eq_sum + NEW.eq_adaptability_self_awareness;
    eq_count := eq_count + 1;
  END IF;
  IF NEW.eq_stress_management_resilience IS NOT NULL THEN
    eq_sum := eq_sum + NEW.eq_stress_management_resilience;
    eq_count := eq_count + 1;
  END IF;
  IF NEW.eq_curiosity_growth_mindset IS NOT NULL THEN
    eq_sum := eq_sum + NEW.eq_curiosity_growth_mindset;
    eq_count := eq_count + 1;
  END IF;
  IF NEW.eq_effectiveness_communication IS NOT NULL THEN
    eq_sum := eq_sum + NEW.eq_effectiveness_communication;
    eq_count := eq_count + 1;
  END IF;

  -- PQ attributes
  IF NEW.pq_work_ethic_reliability IS NOT NULL THEN
    pq_sum := pq_sum + NEW.pq_work_ethic_reliability;
    pq_count := pq_count + 1;
  END IF;
  IF NEW.pq_integrity_accountability IS NOT NULL THEN
    pq_sum := pq_sum + NEW.pq_integrity_accountability;
    pq_count := pq_count + 1;
  END IF;
  IF NEW.pq_teachability_receptiveness IS NOT NULL THEN
    pq_sum := pq_sum + NEW.pq_teachability_receptiveness;
    pq_count := pq_count + 1;
  END IF;
  IF NEW.pq_documentation IS NOT NULL THEN
    pq_sum := pq_sum + NEW.pq_documentation;
    pq_count := pq_count + 1;
  END IF;
  IF NEW.pq_leadership_relationships IS NOT NULL THEN
    pq_sum := pq_sum + NEW.pq_leadership_relationships;
    pq_count := pq_count + 1;
  END IF;

  -- IQ attributes
  IF NEW.iq_knowledge_base IS NOT NULL THEN
    iq_sum := iq_sum + NEW.iq_knowledge_base;
    iq_count := iq_count + 1;
  END IF;
  IF NEW.iq_analytical_thinking IS NOT NULL THEN
    iq_sum := iq_sum + NEW.iq_analytical_thinking;
    iq_count := iq_count + 1;
  END IF;
  IF NEW.iq_commitment_learning IS NOT NULL THEN
    iq_sum := iq_sum + NEW.iq_commitment_learning;
    iq_count := iq_count + 1;
  END IF;
  IF NEW.iq_clinical_flexibility IS NOT NULL THEN
    iq_sum := iq_sum + NEW.iq_clinical_flexibility;
    iq_count := iq_count + 1;
  END IF;
  IF NEW.iq_performance_for_level IS NOT NULL THEN
    iq_sum := iq_sum + NEW.iq_performance_for_level;
    iq_count := iq_count + 1;
  END IF;

  -- Compute averages (NULL if no attributes provided)
  NEW.eq_avg := CASE WHEN eq_count > 0 THEN ROUND(eq_sum / eq_count, 2) ELSE NULL END;
  NEW.pq_avg := CASE WHEN pq_count > 0 THEN ROUND(pq_sum / pq_count, 2) ELSE NULL END;
  NEW.iq_avg := CASE WHEN iq_count > 0 THEN ROUND(iq_sum / iq_count, 2) ELSE NULL END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill: Touch every existing row to re-trigger the computation.
-- The BEFORE UPDATE trigger will recalculate eq_avg, pq_avg, iq_avg.
UPDATE public.structured_ratings
SET updated_at = NOW()
WHERE id IS NOT NULL;
