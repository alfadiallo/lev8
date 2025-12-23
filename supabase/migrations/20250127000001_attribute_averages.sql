-- Migration: Add attribute_period_averages table for trendline calculations
-- Date: 2025-01-27
-- Purpose: Store pre-computed class and program averages for each attribute by period

-- Create table for pre-computed attribute averages
CREATE TABLE IF NOT EXISTS public.attribute_period_averages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('class', 'program')),
  scope_id TEXT,  -- class_year (as text) for 'class' scope, NULL for 'program' scope
  period_label TEXT NOT NULL,  -- e.g., 'PGY-1 Fall', 'PGY-2 Spring'
  attribute_key TEXT NOT NULL,  -- e.g., 'eq_empathy', 'pq_work_ethic', 'iq_knowledge'
  avg_score NUMERIC(3,2),  -- Average score for this attribute (1.0-5.0)
  n_residents INTEGER,  -- Number of residents included in this average
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique combination of scope, period, and attribute
  UNIQUE(scope_type, scope_id, period_label, attribute_key)
);

-- Add comments for documentation
COMMENT ON TABLE public.attribute_period_averages IS 'Pre-computed averages for EQ/PQ/IQ attributes by period, at class and program levels. Used for trendline calculations.';
COMMENT ON COLUMN public.attribute_period_averages.scope_type IS 'Either "class" for class-level averages or "program" for program-wide averages';
COMMENT ON COLUMN public.attribute_period_averages.scope_id IS 'For class scope: the graduation year (e.g., "2025"). For program scope: NULL';
COMMENT ON COLUMN public.attribute_period_averages.period_label IS 'Academic period label (e.g., "PGY-1 Fall", "PGY-2 Spring")';
COMMENT ON COLUMN public.attribute_period_averages.attribute_key IS 'Attribute identifier (e.g., "eq_empathy", "pq_work_ethic", "iq_knowledge")';
COMMENT ON COLUMN public.attribute_period_averages.avg_score IS 'Average score for this attribute across all residents in scope (1.0-5.0 scale)';
COMMENT ON COLUMN public.attribute_period_averages.n_residents IS 'Number of residents with scores for this attribute/period combination';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_attribute_averages_scope 
ON public.attribute_period_averages(scope_type, scope_id);

CREATE INDEX IF NOT EXISTS idx_attribute_averages_period 
ON public.attribute_period_averages(period_label);

CREATE INDEX IF NOT EXISTS idx_attribute_averages_attribute 
ON public.attribute_period_averages(attribute_key);

-- Create index for common query pattern: get all averages for a class
CREATE INDEX IF NOT EXISTS idx_attribute_averages_class_lookup 
ON public.attribute_period_averages(scope_type, scope_id, period_label) 
WHERE scope_type = 'class';

-- Create index for common query pattern: get all program averages
CREATE INDEX IF NOT EXISTS idx_attribute_averages_program_lookup 
ON public.attribute_period_averages(period_label, attribute_key) 
WHERE scope_type = 'program';

-- Enable Row Level Security
ALTER TABLE public.attribute_period_averages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read averages (they are aggregate data, not PII)
CREATE POLICY "Authenticated users can view attribute averages"
ON public.attribute_period_averages
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only service role can insert/update (aggregation scripts run with service key)
CREATE POLICY "Service role can manage attribute averages"
ON public.attribute_period_averages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attribute_averages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_attribute_averages_updated_at
BEFORE UPDATE ON public.attribute_period_averages
FOR EACH ROW
EXECUTE FUNCTION update_attribute_averages_updated_at();


