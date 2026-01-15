-- ============================================================================
-- INTERVIEW QUESTIONS USED TRACKING
-- Adds JSONB column to track which interview questions were used per rating
-- ============================================================================

-- Add questions_used column to interview_ratings
ALTER TABLE public.interview_ratings
ADD COLUMN IF NOT EXISTS questions_used JSONB DEFAULT '{}';

-- Add index for querying question usage patterns
CREATE INDEX IF NOT EXISTS idx_interview_ratings_questions_used 
    ON public.interview_ratings USING GIN (questions_used);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON COLUMN public.interview_ratings.questions_used IS 
'Tracks which interview questions were used for this candidate rating. 
Format: {"EQ_empathy_0": true, "PQ_workethic_2": true}
Key structure: {domain}_{subAttributeId}_{questionIndex}';
