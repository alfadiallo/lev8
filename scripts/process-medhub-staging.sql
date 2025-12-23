-- Process MedHub Staging Data
-- Run this AFTER uploading CSV to medhub_staging table

-- ============================================================================
-- STEP 1: Create Helper Functions (if not exists)
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
-- STEP 2: Preview Upload
-- ============================================================================

-- Check how many rows were uploaded
SELECT COUNT(*) as total_rows FROM public.medhub_staging WHERE NOT processed;

-- Check unique evaluatees and matching status
SELECT 
  "Evaluatee:",
  COUNT(*) as comment_count,
  find_resident_by_medhub_name("Evaluatee:") as resident_id,
  CASE 
    WHEN find_resident_by_medhub_name("Evaluatee:") IS NOT NULL 
    THEN '✅ Matched'
    ELSE '❌ No match - needs manual review'
  END as match_status
FROM public.medhub_staging
WHERE NOT processed
GROUP BY "Evaluatee:"
ORDER BY "Evaluatee:";

-- ============================================================================
-- STEP 3: Handle Unmatched Names (if any show ❌ above)
-- ============================================================================

-- Create override table for manual corrections (if not exists)
CREATE TABLE IF NOT EXISTS public.medhub_name_overrides (
  medhub_name TEXT PRIMARY KEY,
  resident_id UUID NOT NULL REFERENCES public.residents(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If you have unmatched names, add overrides:
-- Example for residents who go by different names:
/*
INSERT INTO public.medhub_name_overrides (medhub_name, resident_id, notes) VALUES
  ('Dr. Truong, Hong Diem', 
   (SELECT r.id FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Jennifer Truong'),
   'MedHub uses middle name Hong Diem, resident goes by Jennifer');
*/

-- Update matching function to check overrides
DROP FUNCTION IF EXISTS find_resident_with_overrides(text);

CREATE OR REPLACE FUNCTION find_resident_with_overrides(p_medhub_name TEXT)
RETURNS UUID AS $$
DECLARE
  resident_uuid UUID;
BEGIN
  -- Check manual overrides first
  SELECT resident_id INTO resident_uuid
  FROM public.medhub_name_overrides
  WHERE medhub_name_overrides.medhub_name = p_medhub_name;
  
  IF resident_uuid IS NOT NULL THEN
    RETURN resident_uuid;
  END IF;
  
  -- Fall back to automatic matching
  RETURN find_resident_by_medhub_name(p_medhub_name);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: Process Staging Data → Import to imported_comments
-- ============================================================================

-- Generate a batch ID for this import
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
    -- Parse date (handles MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD)
    CASE 
      WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{2}$' THEN
        TO_DATE(staging."Date Completed:", 'MM/DD/YY')  -- 2-digit year: 3/23/23
      WHEN staging."Date Completed:" ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
        TO_DATE(staging."Date Completed:", 'MM/DD/YYYY')  -- 4-digit year: 3/23/2023
      ELSE
        TO_DATE(staging."Date Completed:", 'YYYY-MM-DD')  -- ISO format: 2023-03-23
    END as date_completed,
    
    staging."Evaluatee:",
    staging."Evaluation:",
    staging."Question Type:",
    staging."Question:",
    staging."Comment:",
    
    -- Find matching resident
    find_resident_with_overrides(staging."Evaluatee:") as resident_id,
    
    -- Calculate PGY level and period
    calculate_pgy_level(
      (SELECT r.class_id 
       FROM public.residents r 
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
        (SELECT r.class_id 
         FROM public.residents r 
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
      (SELECT r.class_id 
       FROM public.residents r 
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
        (SELECT r.class_id 
         FROM public.residents r 
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
  
  -- Mark staging rows as processed
  UPDATE public.medhub_staging
  SET processed = true,
      resident_id = find_resident_with_overrides("Evaluatee:")
  WHERE NOT processed 
    AND find_resident_with_overrides("Evaluatee:") IS NOT NULL;
  
  -- Mark unmatched rows with error
  UPDATE public.medhub_staging
  SET processed = true,
      error_message = 'No matching resident found'
  WHERE NOT processed 
    AND find_resident_with_overrides("Evaluatee:") IS NULL;
  
  RAISE NOTICE 'Import complete! Imported % rows with batch ID: %', rows_imported, batch_uuid;
END $$;

-- ============================================================================
-- STEP 5: Verification & Statistics
-- ============================================================================

-- Import summary
SELECT 
  'Total rows uploaded' as metric,
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
  'Unmatched (not imported)',
  COUNT(*)::TEXT
FROM public.medhub_staging
WHERE processed AND error_message IS NOT NULL;

-- Comments by resident
SELECT 
  up.full_name,
  r.id as resident_id,
  COUNT(*) as comment_count,
  MIN(ic.date_completed) as earliest_eval,
  MAX(ic.date_completed) as latest_eval,
  STRING_AGG(DISTINCT ic.period_label, ', ' ORDER BY ic.period_label) as periods
FROM public.imported_comments ic
JOIN public.residents r ON r.id = ic.resident_id
JOIN public.user_profiles up ON up.id = r.user_id
WHERE ic.imported_at > NOW() - INTERVAL '5 minutes'  -- Recent imports only
GROUP BY up.full_name, r.id
ORDER BY comment_count DESC;

-- Comments by period
SELECT 
  period_label,
  COUNT(*) as comment_count,
  COUNT(DISTINCT resident_id) as resident_count
FROM public.imported_comments
WHERE imported_at > NOW() - INTERVAL '5 minutes'  -- Recent imports only
GROUP BY period_label
ORDER BY period_label;

-- Unmatched names (if any)
SELECT 
  "Evaluatee:",
  COUNT(*) as skipped_comments,
  error_message
FROM public.medhub_staging
WHERE processed AND error_message IS NOT NULL
GROUP BY "Evaluatee:", error_message;

-- ============================================================================
-- STEP 6: Optional - Clear Staging Table
-- ============================================================================

-- After verifying import was successful, you can clear the staging table:
-- DELETE FROM public.medhub_staging WHERE processed = true;

-- Or keep it for audit purposes

-- ============================================================================
-- SUCCESS! 🎉
-- ============================================================================

/*
Your MedHub data is now imported!

Next steps:
1. Review the verification queries above
2. Check for any unmatched names
3. If needed, add manual overrides and re-run STEP 4
4. Create test SWOT/scores data for one resident
5. Test the dashboard!

To create test analytics data:
- Pick a resident_id from the "Comments by resident" query
- Edit scripts/create-test-analytics-data.sql
- Replace YOUR_RESIDENT_ID_HERE with the actual UUID
- Run that script
- Navigate to /modules/understand/overview
*/

