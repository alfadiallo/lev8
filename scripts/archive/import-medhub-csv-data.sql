-- Import MedHub Evaluation Comments CSV
-- Handles format: "Dr. Last, First" → matches to resident IDs
-- Maps to imported_comments table with AI analysis fields ready

-- ============================================================================
-- STEP 1: Create Helper Functions (Name Matching)
-- ============================================================================

-- Parse MedHub name format: "Dr. Last, First" → "First Last"
CREATE OR REPLACE FUNCTION parse_medhub_name(medhub_name TEXT) 
RETURNS TABLE(first_name TEXT, last_name TEXT, full_name TEXT) AS $$
DECLARE
  clean_name TEXT;
  name_parts TEXT[];
BEGIN
  -- Remove "Dr." prefix
  clean_name := TRIM(REGEXP_REPLACE(medhub_name, '^Dr\.\s*', '', 'i'));
  
  -- Check if comma exists (Last, First format)
  IF POSITION(',' IN clean_name) > 0 THEN
    name_parts := STRING_TO_ARRAY(clean_name, ',');
    RETURN QUERY SELECT 
      TRIM(name_parts[2]) as first_name,
      TRIM(name_parts[1]) as last_name,
      TRIM(name_parts[2]) || ' ' || TRIM(name_parts[1]) as full_name;
  ELSE
    -- Already in First Last format
    name_parts := STRING_TO_ARRAY(clean_name, ' ');
    IF array_length(name_parts, 1) >= 2 THEN
      RETURN QUERY SELECT 
        name_parts[1] as first_name,
        array_to_string(name_parts[2:array_length(name_parts,1)], ' ') as last_name,
        clean_name as full_name;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Find resident by MedHub name
CREATE OR REPLACE FUNCTION find_resident_by_medhub_name(medhub_name TEXT)
RETURNS UUID AS $$
DECLARE
  parsed_name RECORD;
  resident_uuid UUID;
BEGIN
  -- Parse the MedHub name
  SELECT * INTO parsed_name FROM parse_medhub_name(medhub_name) LIMIT 1;
  
  IF parsed_name IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Try exact match
  SELECT r.id INTO resident_uuid
  FROM public.residents r
  JOIN public.user_profiles up ON up.id = r.user_id
  WHERE up.full_name = parsed_name.full_name;
  
  IF resident_uuid IS NOT NULL THEN
    RETURN resident_uuid;
  END IF;
  
  -- Try case-insensitive match
  SELECT r.id INTO resident_uuid
  FROM public.residents r
  JOIN public.user_profiles up ON up.id = r.user_id
  WHERE LOWER(up.full_name) = LOWER(parsed_name.full_name);
  
  RETURN resident_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: Create Staging Table (Matches CSV Structure)
-- ============================================================================

DROP TABLE IF EXISTS temp_medhub_import;

CREATE TEMP TABLE temp_medhub_import (
  date_completed TEXT,      -- Will convert to DATE
  evaluatee TEXT,           -- "Dr. Last, First" format
  evaluation TEXT,          -- Evaluation type
  question_type TEXT,       -- Question category
  question TEXT,            -- Question text
  comment TEXT              -- Comment text
);

-- ============================================================================
-- STEP 3: CSV UPLOAD INSTRUCTIONS
-- ============================================================================

/*
HOW TO UPLOAD YOUR CSV:

Option A: Via Supabase Dashboard
1. Go to Supabase Dashboard > SQL Editor
2. Click "Import CSV"
3. Select your MedHub CSV file
4. Target table: temp_medhub_import
5. Map columns:
   - Date Completed → date_completed
   - Evaluatee → evaluatee
   - Evaluation → evaluation
   - Question Type → question_type
   - Question → question
   - Comment → comment
6. Click "Import"

Option B: Via Command Line (if you have psql)
\copy temp_medhub_import(date_completed, evaluatee, evaluation, question_type, question, comment) 
FROM '/path/to/your/medhub_export.csv' 
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

Option C: Copy-Paste Small Dataset
If you have < 100 rows, you can manually INSERT:
INSERT INTO temp_medhub_import VALUES
  ('10/15/2024', 'Dr. Abadi, Kevin', 'End of Shift Evaluation Week 1', 'Strengths', 'What are the resident''s strengths?', 'Excellent bedside manner...'),
  ('10/16/2024', 'Dr. Reel, Morgan', 'End of Shift Evaluation Week 2', 'Areas for improvement', 'What areas need improvement?', 'Documentation timeliness...');
*/

-- ============================================================================
-- STEP 4: Verify Upload
-- ============================================================================

-- Check how many rows uploaded
SELECT COUNT(*) as total_rows FROM temp_medhub_import;

-- Check unique evaluatees
SELECT 
  evaluatee,
  COUNT(*) as comment_count,
  find_resident_by_medhub_name(evaluatee) as resident_id,
  CASE 
    WHEN find_resident_by_medhub_name(evaluatee) IS NOT NULL 
    THEN '✅ Matched'
    ELSE '❌ No match'
  END as match_status
FROM temp_medhub_import
GROUP BY evaluatee
ORDER BY evaluatee;

-- Check date range
SELECT 
  MIN(date_completed) as earliest_eval,
  MAX(date_completed) as latest_eval,
  COUNT(DISTINCT evaluatee) as unique_residents,
  COUNT(*) as total_comments
FROM temp_medhub_import;

-- ============================================================================
-- STEP 5: Handle Unmatched Names (if any)
-- ============================================================================

-- Create override table for manual name corrections
CREATE TABLE IF NOT EXISTS public.medhub_name_overrides (
  medhub_name TEXT PRIMARY KEY,
  resident_id UUID NOT NULL REFERENCES public.residents(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example: If "Dr. Truong, Hong Diem" doesn't match "Jennifer Truong"
/*
INSERT INTO public.medhub_name_overrides (medhub_name, resident_id, notes) VALUES
  ('Dr. Truong, Hong Diem', 
   (SELECT r.id FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Jennifer Truong'),
   'Goes by Jennifer, not Hong Diem');
*/

-- Update matching function to check overrides
CREATE OR REPLACE FUNCTION find_resident_with_overrides(medhub_name TEXT)
RETURNS UUID AS $$
DECLARE
  resident_uuid UUID;
BEGIN
  -- Check manual overrides first
  SELECT resident_id INTO resident_uuid
  FROM public.medhub_name_overrides
  WHERE medhub_name_overrides.medhub_name = medhub_name;
  
  IF resident_uuid IS NOT NULL THEN
    RETURN resident_uuid;
  END IF;
  
  -- Fall back to automatic matching
  RETURN find_resident_by_medhub_name(medhub_name);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: Import to imported_comments Table
-- ============================================================================

INSERT INTO public.imported_comments (
  date_completed,
  evaluatee,
  evaluation_type,
  question_type,
  question,
  comment_text,
  
  -- Link to resident
  resident_id,
  
  -- Calculate period context
  pgy_level,
  period,
  period_label,
  
  -- Metadata
  import_batch_id,
  imported_at
)
SELECT 
  -- Parse date (handles MM/DD/YYYY or YYYY-MM-DD)
  CASE 
    WHEN tmp.date_completed ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
      TO_DATE(tmp.date_completed, 'MM/DD/YYYY')
    ELSE
      TO_DATE(tmp.date_completed, 'YYYY-MM-DD')
  END as date_completed,
  
  tmp.evaluatee,
  tmp.evaluation,
  tmp.question_type,
  tmp.question,
  tmp.comment,
  
  -- Find matching resident
  find_resident_with_overrides(tmp.evaluatee) as resident_id,
  
  -- Calculate PGY level and period
  calculate_pgy_level(
    (SELECT r.class_id 
     FROM public.residents r 
     WHERE r.id = find_resident_with_overrides(tmp.evaluatee)),
    CASE 
      WHEN tmp.date_completed ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
        TO_DATE(tmp.date_completed, 'MM/DD/YYYY')
      ELSE
        TO_DATE(tmp.date_completed, 'YYYY-MM-DD')
    END
  ) as pgy_level,
  
  determine_period(
    calculate_pgy_level(
      (SELECT r.class_id 
       FROM public.residents r 
       WHERE r.id = find_resident_with_overrides(tmp.evaluatee)),
      CASE 
        WHEN tmp.date_completed ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
          TO_DATE(tmp.date_completed, 'MM/DD/YYYY')
        ELSE
          TO_DATE(tmp.date_completed, 'YYYY-MM-DD')
      END
    ),
    CASE 
      WHEN tmp.date_completed ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
        TO_DATE(tmp.date_completed, 'MM/DD/YYYY')
      ELSE
        TO_DATE(tmp.date_completed, 'YYYY-MM-DD')
    END
  ) as period,
  
  calculate_pgy_level(
    (SELECT r.class_id 
     FROM public.residents r 
     WHERE r.id = find_resident_with_overrides(tmp.evaluatee)),
    CASE 
      WHEN tmp.date_completed ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
        TO_DATE(tmp.date_completed, 'MM/DD/YYYY')
      ELSE
        TO_DATE(tmp.date_completed, 'YYYY-MM-DD')
    END
  ) || ' ' || determine_period(
    calculate_pgy_level(
      (SELECT r.class_id 
       FROM public.residents r 
       WHERE r.id = find_resident_with_overrides(tmp.evaluatee)),
      CASE 
        WHEN tmp.date_completed ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
          TO_DATE(tmp.date_completed, 'MM/DD/YYYY')
        ELSE
          TO_DATE(tmp.date_completed, 'YYYY-MM-DD')
      END
    ),
    CASE 
      WHEN tmp.date_completed ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
        TO_DATE(tmp.date_completed, 'MM/DD/YYYY')
      ELSE
        TO_DATE(tmp.date_completed, 'YYYY-MM-DD')
    END
  ) as period_label,
  
  gen_random_uuid() as import_batch_id,
  NOW() as imported_at
  
FROM temp_medhub_import tmp
WHERE find_resident_with_overrides(tmp.evaluatee) IS NOT NULL; -- Only import matched residents

-- ============================================================================
-- STEP 7: Verification & Statistics
-- ============================================================================

-- Check import results
WITH latest_import AS (
  SELECT import_batch_id
  FROM public.imported_comments
  ORDER BY imported_at DESC
  LIMIT 1
)
SELECT 
  'Total rows in CSV' as metric,
  COUNT(*)::TEXT as value
FROM temp_medhub_import
UNION ALL
SELECT 
  'Successfully imported',
  COUNT(*)::TEXT
FROM public.imported_comments ic, latest_import li
WHERE ic.import_batch_id = li.import_batch_id
UNION ALL
SELECT 
  'Unmatched names (skipped)',
  COUNT(*)::TEXT
FROM temp_medhub_import tmp
WHERE find_resident_with_overrides(tmp.evaluatee) IS NULL;

-- Comments by resident (latest import)
WITH latest_import AS (
  SELECT import_batch_id
  FROM public.imported_comments
  ORDER BY imported_at DESC
  LIMIT 1
)
SELECT 
  up.full_name,
  r.id as resident_id,
  COUNT(*) as comment_count,
  MIN(ic.date_completed) as earliest_eval,
  MAX(ic.date_completed) as latest_eval,
  array_agg(DISTINCT ic.period_label ORDER BY ic.period_label) as periods
FROM public.imported_comments ic
JOIN public.residents r ON r.id = ic.resident_id
JOIN public.user_profiles up ON up.id = r.user_id
JOIN latest_import li ON ic.import_batch_id = li.import_batch_id
GROUP BY up.full_name, r.id
ORDER BY comment_count DESC;

-- Comments by period (latest import)
WITH latest_import AS (
  SELECT import_batch_id
  FROM public.imported_comments
  ORDER BY imported_at DESC
  LIMIT 1
)
SELECT 
  period_label,
  COUNT(*) as comment_count,
  COUNT(DISTINCT resident_id) as resident_count
FROM public.imported_comments ic
JOIN latest_import li ON ic.import_batch_id = li.import_batch_id
GROUP BY period_label
ORDER BY period_label;

-- ============================================================================
-- STEP 8: Clean Up (Optional)
-- ============================================================================

-- Drop temp table after successful import
-- DROP TABLE IF EXISTS temp_medhub_import;

-- ============================================================================
-- SUCCESS! 🎉
-- ============================================================================

/*
WHAT'S NEXT:

Your MedHub comments are now imported into imported_comments table.
The data is ready for AI analysis (Phase 6 - optional).

WITHOUT AI ANALYSIS:
- Comments are stored with resident linkage
- Period/PGY levels calculated
- You can view raw comments in the database

WITH AI ANALYSIS (Phase 6):
- Run AI analysis script to score comments (EQ/PQ/IQ)
- Generate SWOT summaries
- Create period_scores aggregations

For now, you can:
1. View imported comments: SELECT * FROM imported_comments LIMIT 10;
2. Create manual SWOT summaries using create-test-analytics-data.sql
3. Test the dashboard with manually created data
*/

