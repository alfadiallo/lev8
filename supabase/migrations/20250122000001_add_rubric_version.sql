-- Add rubric version tracking to swot_summaries table
-- This allows tracking which version of the rubric was used for each SWOT analysis

ALTER TABLE swot_summaries 
ADD COLUMN IF NOT EXISTS rubric_version VARCHAR,
ADD COLUMN IF NOT EXISTS rubric_last_updated DATE;

-- Add comment for documentation
COMMENT ON COLUMN swot_summaries.rubric_version IS 'Version of the SWOT analysis rubric used (e.g., 1.0.0)';
COMMENT ON COLUMN swot_summaries.rubric_last_updated IS 'Date when the rubric was last updated';

-- Create index for version queries
CREATE INDEX IF NOT EXISTS idx_swot_summaries_rubric_version 
ON swot_summaries(rubric_version);


