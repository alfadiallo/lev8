-- ============================================================================
-- Add AI Attribute Scores Detail to Period Scores
-- ============================================================================
-- Migration: 20250126000001_add_ai_attribute_scores
-- Purpose: Store full 15-attribute breakdown from AI analysis
-- 
-- Background:
-- - Claude API returns individual scores for all 15 EQ/PQ/IQ attributes
-- - Previously only aggregate averages were stored (ai_eq_avg, ai_pq_avg, ai_iq_avg)
-- - This migration preserves the full breakdown for detailed visualization
--
-- Structure:
-- {
--   "eq": {
--     "empathy": 3.5,
--     "adaptability": 3.0,
--     "stress_mgmt": 2.5,
--     "curiosity": 4.0,
--     "communication": 3.5,
--     "avg": 3.3
--   },
--   "pq": {
--     "work_ethic": 4.0,
--     "integrity": 4.5,
--     "teachability": 3.0,
--     "documentation": 2.5,
--     "leadership": 3.0,
--     "avg": 3.4
--   },
--   "iq": {
--     "knowledge": 3.5,
--     "analytical": 3.0,
--     "learning": 4.0,
--     "flexibility": 3.5,
--     "performance": 3.0,
--     "avg": 3.4
--   }
-- }
-- ============================================================================

-- Add JSONB column for detailed AI scores
ALTER TABLE public.period_scores 
ADD COLUMN IF NOT EXISTS ai_scores_detail JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.period_scores.ai_scores_detail IS 
'Full breakdown of AI-generated scores for all 15 EQ/PQ/IQ attributes. Contains nested object with eq, pq, and iq keys, each containing 5 attribute scores plus avg.';

-- Create index for JSONB queries (optional, for future analytics)
CREATE INDEX IF NOT EXISTS idx_period_scores_ai_detail ON public.period_scores USING gin(ai_scores_detail);


