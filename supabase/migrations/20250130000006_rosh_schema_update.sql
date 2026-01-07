-- Add accuracy_percentage and semester columns to rosh_completion_snapshots
-- for tracking ROSH progress over 6 semesters

-- Add accuracy_percentage column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'rosh_completion_snapshots' 
    AND column_name = 'accuracy_percentage'
  ) THEN
    ALTER TABLE public.rosh_completion_snapshots 
    ADD COLUMN accuracy_percentage NUMERIC(5,2) CHECK (accuracy_percentage BETWEEN 0 AND 100);
  END IF;
END $$;

-- Add semester column if not exists (e.g., 'Fall', 'Spring')
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'rosh_completion_snapshots' 
    AND column_name = 'semester'
  ) THEN
    ALTER TABLE public.rosh_completion_snapshots 
    ADD COLUMN semester VARCHAR(10) CHECK (semester IN ('Fall', 'Spring'));
  END IF;
END $$;

-- Add questions_completed and total_questions for more granular tracking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'rosh_completion_snapshots' 
    AND column_name = 'questions_completed'
  ) THEN
    ALTER TABLE public.rosh_completion_snapshots 
    ADD COLUMN questions_completed INT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'rosh_completion_snapshots' 
    AND column_name = 'total_questions'
  ) THEN
    ALTER TABLE public.rosh_completion_snapshots 
    ADD COLUMN total_questions INT DEFAULT 3000;
  END IF;
END $$;

-- Create index on semester for faster lookups
CREATE INDEX IF NOT EXISTS idx_rosh_snapshots_semester 
ON public.rosh_completion_snapshots(resident_id, semester, pgy_level);

-- Create a function to get semester label (F1, S1, etc.) based on pgy_level and semester
CREATE OR REPLACE FUNCTION get_rosh_period_label(p_pgy_level TEXT, p_semester VARCHAR(10))
RETURNS VARCHAR(2) AS $$
BEGIN
  RETURN CASE 
    WHEN p_semester = 'Fall' THEN 'F' || p_pgy_level
    WHEN p_semester = 'Spring' THEN 'S' || p_pgy_level
    ELSE p_pgy_level
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON COLUMN public.rosh_completion_snapshots.accuracy_percentage IS 'Question accuracy rate (correct/attempted * 100)';
COMMENT ON COLUMN public.rosh_completion_snapshots.semester IS 'Fall or Spring semester';
COMMENT ON COLUMN public.rosh_completion_snapshots.questions_completed IS 'Number of questions completed';
COMMENT ON COLUMN public.rosh_completion_snapshots.total_questions IS 'Total questions in question bank (default 3000)';








