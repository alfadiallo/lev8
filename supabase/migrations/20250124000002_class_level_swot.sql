-- ============================================================================
-- CLASS-LEVEL SWOT SUPPORT
-- ============================================================================
-- Add support for class-level SWOT summaries aggregated by PGY year
-- Created: 2025-01-24

-- Add class_year column to swot_summaries
ALTER TABLE public.swot_summaries 
ADD COLUMN IF NOT EXISTS class_year INTEGER;

-- Make resident_id nullable to support class-level summaries
ALTER TABLE public.swot_summaries 
ALTER COLUMN resident_id DROP NOT NULL;

-- Add check constraint: either resident_id OR class_year must be set
ALTER TABLE public.swot_summaries
ADD CONSTRAINT swot_summaries_level_check 
CHECK (
  (resident_id IS NOT NULL AND class_year IS NULL) OR 
  (resident_id IS NULL AND class_year IS NOT NULL)
);

-- Add index for class-level queries
CREATE INDEX IF NOT EXISTS idx_swot_class_year ON public.swot_summaries(class_year) 
WHERE class_year IS NOT NULL;

-- Update unique constraint to handle both resident and class level
ALTER TABLE public.swot_summaries 
DROP CONSTRAINT IF EXISTS swot_summaries_resident_id_period_label_analysis_version_key;

-- Create new unique constraint that works for both levels
CREATE UNIQUE INDEX IF NOT EXISTS swot_summaries_unique_idx ON public.swot_summaries (
  COALESCE(resident_id::text, ''), 
  COALESCE(class_year::text, ''), 
  period_label, 
  analysis_version
);

COMMENT ON COLUMN public.swot_summaries.class_year IS 'Graduation year for class-level SWOT summaries (mutually exclusive with resident_id)';


