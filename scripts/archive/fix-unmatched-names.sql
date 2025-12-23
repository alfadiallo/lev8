-- Fix Unmatched Names and Clean Up Data
-- Run this to fix the 4 issues with unmatched residents

-- ============================================================================
-- STEP 1: Check NULL Evaluatee Rows (1782 rows)
-- ============================================================================

-- See if they have any actual comment text
SELECT 
  COUNT(*) as total_null_rows,
  COUNT(CASE WHEN "Comment:" IS NOT NULL AND TRIM("Comment:") != '' THEN 1 END) as with_comments,
  COUNT(CASE WHEN "Comment:" IS NULL OR TRIM("Comment:") = '' THEN 1 END) as without_comments
FROM public.medhub_staging
WHERE "Evaluatee:" IS NULL AND processed = true;

-- Sample a few to see what they look like
SELECT 
  "Date Completed:",
  "Evaluation:",
  "Question Type:",
  "Question:",
  "Comment:"
FROM public.medhub_staging
WHERE "Evaluatee:" IS NULL AND processed = true
LIMIT 10;

-- Decision: If they have no useful data, we'll delete them

-- ============================================================================
-- STEP 2: Fix Alyse Nelsen Spelling in Database
-- ============================================================================

-- First, let's check the current spelling
SELECT id, full_name 
FROM user_profiles 
WHERE full_name ILIKE '%nelsen%' OR full_name ILIKE '%nelson%';

-- Update the spelling from "Alyse Nelson" to "Alyse Nelsen"
UPDATE public.user_profiles
SET full_name = 'Alyse Nelsen'
WHERE full_name = 'Alyse Nelson';

-- Verify the fix
SELECT up.full_name, r.id as resident_id
FROM residents r
JOIN user_profiles up ON up.id = r.user_id
WHERE up.full_name = 'Alyse Nelsen';

-- ============================================================================
-- STEP 3: Create Manual Name Overrides
-- ============================================================================

-- Create overrides for residents who go by different names

-- Jennifer Truong (goes by Jennifer, not Hong Diem)
INSERT INTO public.medhub_name_overrides (medhub_name, resident_id, notes)
SELECT 
  'Dr. Truong, Hong Diem',
  r.id,
  'MedHub uses middle name "Hong Diem", resident goes by "Jennifer"'
FROM residents r
JOIN user_profiles up ON up.id = r.user_id
WHERE up.full_name = 'Jennifer Truong'
ON CONFLICT (medhub_name) DO UPDATE
  SET resident_id = EXCLUDED.resident_id,
      notes = EXCLUDED.notes;

-- Hadley Modeen (goes by Hadley, not Ella)
INSERT INTO public.medhub_name_overrides (medhub_name, resident_id, notes)
SELECT 
  'Dr. Modeen, Ella',
  r.id,
  'MedHub uses first name "Ella", resident goes by "Hadley"'
FROM residents r
JOIN user_profiles up ON up.id = r.user_id
WHERE up.full_name = 'Hadley Modeen'
ON CONFLICT (medhub_name) DO UPDATE
  SET resident_id = EXCLUDED.resident_id,
      notes = EXCLUDED.notes;

-- Verify overrides were created
SELECT * FROM public.medhub_name_overrides;

-- ============================================================================
-- STEP 4: Delete NULL Evaluatee Rows (if they have no useful data)
-- ============================================================================

-- Option A: Delete only if they have no comments
DELETE FROM public.medhub_staging
WHERE "Evaluatee:" IS NULL 
  AND processed = true
  AND ("Comment:" IS NULL OR TRIM("Comment:") = '');

-- Option B: Delete ALL null evaluatee rows (uncomment if you want this)
-- DELETE FROM public.medhub_staging
-- WHERE "Evaluatee:" IS NULL AND processed = true;

-- ============================================================================
-- STEP 5: Reset Processed Flag for Previously Unmatched Rows
-- ============================================================================

-- Reset the rows that failed before so they can be re-imported
UPDATE public.medhub_staging
SET 
  processed = false,
  resident_id = NULL,
  error_message = NULL
WHERE processed = true 
  AND error_message = 'No matching resident found'
  AND "Evaluatee:" IN ('Dr. Truong, Hong Diem', 'Dr. Nelsen, Alyse', 'Dr. Modeen, Ella');

-- Check how many rows we're about to re-import
SELECT 
  "Evaluatee:",
  COUNT(*) as will_be_reimported
FROM public.medhub_staging
WHERE NOT processed
GROUP BY "Evaluatee:";

-- ============================================================================
-- STEP 6: Re-run Import for Fixed Rows
-- ============================================================================

-- Re-run the import process (same as before)
DO $$
DECLARE
  batch_uuid UUID := gen_random_uuid();
  rows_imported INTEGER;
BEGIN
  -- Import matched data
  INSERT INTO public.imported_comments (
    date_completed,
    evaluatee,
    evaluation_type,
    question_type,
    question,
    comment_text,
    resident_id,
    pgy_level,
    period,
    period_label,
    import_batch_id,
    imported_at
  )
  SELECT 
    -- Parse date
    CASE 
      WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{2}$' THEN
        TO_DATE(staging."Date Completed:", 'MM/DD/YY')
      WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
        TO_DATE(staging."Date Completed:", 'MM/DD/YYYY')
      ELSE
        TO_DATE(staging."Date Completed:", 'YYYY-MM-DD')
    END as date_completed,
    
    staging."Evaluatee:",
    staging."Evaluation:",
    staging."Question Type:",
    staging."Question:",
    staging."Comment:",
    
    find_resident_with_overrides(staging."Evaluatee:") as resident_id,
    
    calculate_pgy_level(
      (SELECT r.class_id FROM public.residents r 
       WHERE r.id = find_resident_with_overrides(staging."Evaluatee:")),
      CASE 
        WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{2}$' THEN
          TO_DATE(staging."Date Completed:", 'MM/DD/YY')
        WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
          TO_DATE(staging."Date Completed:", 'MM/DD/YYYY')
        ELSE
          TO_DATE(staging."Date Completed:", 'YYYY-MM-DD')
      END
    ) as pgy_level,
    
    determine_period(
      calculate_pgy_level(
        (SELECT r.class_id FROM public.residents r 
         WHERE r.id = find_resident_with_overrides(staging."Evaluatee:")),
        CASE 
          WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{2}$' THEN
            TO_DATE(staging."Date Completed:", 'MM/DD/YY')
          WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
            TO_DATE(staging."Date Completed:", 'MM/DD/YYYY')
          ELSE
            TO_DATE(staging."Date Completed:", 'YYYY-MM-DD')
        END
      ),
      CASE 
        WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{2}$' THEN
          TO_DATE(staging."Date Completed:", 'MM/DD/YY')
        WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
          TO_DATE(staging."Date Completed:", 'MM/DD/YYYY')
        ELSE
          TO_DATE(staging."Date Completed:", 'YYYY-MM-DD')
      END
    ) as period,
    
    calculate_pgy_level(
      (SELECT r.class_id FROM public.residents r 
       WHERE r.id = find_resident_with_overrides(staging."Evaluatee:")),
      CASE 
        WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{2}$' THEN
          TO_DATE(staging."Date Completed:", 'MM/DD/YY')
        WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
          TO_DATE(staging."Date Completed:", 'MM/DD/YYYY')
        ELSE
          TO_DATE(staging."Date Completed:", 'YYYY-MM-DD')
      END
    ) || ' ' || determine_period(
      calculate_pgy_level(
        (SELECT r.class_id FROM public.residents r 
         WHERE r.id = find_resident_with_overrides(staging."Evaluatee:")),
        CASE 
          WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{2}$' THEN
            TO_DATE(staging."Date Completed:", 'MM/DD/YY')
          WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
            TO_DATE(staging."Date Completed:", 'MM/DD/YYYY')
          ELSE
            TO_DATE(staging."Date Completed:", 'YYYY-MM-DD')
        END
      ),
      CASE 
        WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{2}$' THEN
          TO_DATE(staging."Date Completed:", 'MM/DD/YY')
        WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
          TO_DATE(staging."Date Completed:", 'MM/DD/YYYY')
        ELSE
          TO_DATE(staging."Date Completed:", 'YYYY-MM-DD')
      END
    ) as period_label,
    
    batch_uuid as import_batch_id,
    NOW() as imported_at
    
  FROM public.medhub_staging staging
  WHERE NOT staging.processed
    AND find_resident_with_overrides(staging."Evaluatee:") IS NOT NULL;
  
  GET DIAGNOSTICS rows_imported = ROW_COUNT;
  
  -- Mark as processed
  UPDATE public.medhub_staging
  SET processed = true,
      resident_id = find_resident_with_overrides("Evaluatee:")
  WHERE NOT processed 
    AND find_resident_with_overrides("Evaluatee:") IS NOT NULL;
  
  -- Mark unmatched
  UPDATE public.medhub_staging
  SET processed = true,
      error_message = 'No matching resident found'
  WHERE NOT processed 
    AND find_resident_with_overrides("Evaluatee:") IS NULL;
  
  RAISE NOTICE 'Re-import complete! Imported % additional rows', rows_imported;
END $$;

-- ============================================================================
-- STEP 7: Final Verification
-- ============================================================================

-- Check final import statistics
SELECT 
  'Total rows in staging' as metric,
  COUNT(*)::TEXT as value
FROM public.medhub_staging
UNION ALL
SELECT 
  'Successfully imported',
  COUNT(*)::TEXT
FROM public.medhub_staging
WHERE processed AND error_message IS NULL
UNION ALL
SELECT 
  'Still unmatched',
  COUNT(*)::TEXT
FROM public.medhub_staging
WHERE processed AND error_message IS NOT NULL;

-- Comments by resident (top 10)
SELECT 
  up.full_name,
  COUNT(*) as comment_count,
  MIN(ic.date_completed) as earliest,
  MAX(ic.date_completed) as latest,
  STRING_AGG(DISTINCT ic.period_label, ', ' ORDER BY ic.period_label) as periods
FROM public.imported_comments ic
JOIN public.residents r ON r.id = ic.resident_id
JOIN public.user_profiles up ON up.id = r.user_id
GROUP BY up.full_name
ORDER BY comment_count DESC
LIMIT 10;

-- ============================================================================
-- SUCCESS! 🎉
-- ============================================================================

/*
After running this script:
1. Alyse Nelsen should now match (spelling fixed)
2. Jennifer Truong should now match (override created)
3. Hadley Modeen should now match (override created)
4. NULL evaluatee rows cleaned up
5. All 3 residents' comments (466 total) should be imported

Next steps:
- Pick one of your top residents
- Create test SWOT/scores data
- Test the dashboard!
*/


