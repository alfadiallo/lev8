-- Create Permanent Staging Table for MedHub CSV Import
-- This table persists across sessions so you can upload CSV via Supabase UI

-- ============================================================================
-- Create staging table (permanent, not temporary)
-- ============================================================================

DROP TABLE IF EXISTS public.medhub_staging CASCADE;

CREATE TABLE public.medhub_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "Date Completed:" TEXT,   -- Exact match to CSV header (with colon)
  "Evaluatee:" TEXT,        -- "Dr. Last, First" format
  "Evaluation:" TEXT,       -- Evaluation type
  "Question Type:" TEXT,    -- Question category
  "Question:" TEXT,         -- Question text
  "Comment:" TEXT,          -- Comment text
  
  -- Processing metadata
  processed BOOLEAN DEFAULT false,
  resident_id UUID,         -- Filled after matching
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_medhub_staging_processed ON public.medhub_staging(processed);
CREATE INDEX idx_medhub_staging_evaluatee ON public.medhub_staging("Evaluatee:");

-- ============================================================================
-- SUCCESS! ✅
-- ============================================================================

-- Now you can:
-- 1. Go to Supabase Dashboard > Table Editor
-- 2. Find "medhub_staging" table
-- 3. Click "Insert" > "Import from CSV"
-- 4. Upload your MedHub CSV
-- 5. The column names should auto-match now (they have colons like your CSV)
--    - Date Completed: → Date Completed:
--    - Evaluatee: → Evaluatee:
--    - Evaluation: → Evaluation:
--    - Question Type: → Question Type:
--    - Question: → Question:
--    - Comment: → Comment:

-- After upload, come back and run: scripts/process-medhub-staging.sql

