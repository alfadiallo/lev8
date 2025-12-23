-- ============================================================================
-- Pre-Processing Diagnostics for MedHub Staging Data
-- Run this BEFORE processing to identify potential issues
-- ============================================================================

-- 1. Total rows uploaded
SELECT 
  COUNT(*) as total_rows_uploaded,
  COUNT(DISTINCT "Evaluatee:") as unique_evaluatees
FROM public.medhub_staging;

-- 2. Check for NULL/empty evaluatee names
SELECT 
  COUNT(*) as null_or_empty_evaluatees,
  COUNT(CASE WHEN "Comment:" IS NOT NULL AND TRIM("Comment:") != '' THEN 1 END) as with_comments,
  COUNT(CASE WHEN "Comment:" IS NULL OR TRIM("Comment:") = '' THEN 1 END) as without_comments
FROM public.medhub_staging
WHERE "Evaluatee:" IS NULL OR TRIM("Evaluatee:") = '';

-- 3. Sample NULL evaluatee rows (to see if they're useful)
SELECT 
  "Date Completed:",
  "Evaluatee:",
  "Evaluation:",
  "Question Type:",
  "Question:",
  LEFT("Comment:", 100) as comment_preview
FROM public.medhub_staging
WHERE "Evaluatee:" IS NULL OR TRIM("Evaluatee:") = ''
LIMIT 10;

-- 4. Check which residents will match (preview)
SELECT 
  staging."Evaluatee:",
  COUNT(*) as comment_count,
  CASE 
    WHEN up.full_name IS NOT NULL THEN '✅ Will match: ' || up.full_name
    ELSE '❌ No match found'
  END as match_status
FROM public.medhub_staging staging
LEFT JOIN (
  -- Try to match by parsing "Dr. Last, First" format
  SELECT 
    up.id,
    up.full_name,
    -- Create a reverse lookup: "Dr. Last, First" from "First Last"
    'Dr. ' || SPLIT_PART(up.full_name, ' ', ARRAY_LENGTH(STRING_TO_ARRAY(up.full_name, ' '), 1)) || ', ' || 
    SPLIT_PART(up.full_name, ' ', 1) as medhub_format
  FROM public.user_profiles up
  WHERE up.role = 'resident'
) up ON staging."Evaluatee:" = up.medhub_format
WHERE staging."Evaluatee:" IS NOT NULL AND TRIM(staging."Evaluatee:") != ''
GROUP BY staging."Evaluatee:", up.full_name
ORDER BY 
  CASE WHEN up.full_name IS NULL THEN 0 ELSE 1 END DESC,
  staging."Evaluatee:";

-- 5. Summary: Potential unmatched residents
SELECT 
  '❌ WILL NOT MATCH' as status,
  staging."Evaluatee:",
  COUNT(*) as comments_to_skip
FROM public.medhub_staging staging
LEFT JOIN (
  SELECT 
    up.id,
    'Dr. ' || SPLIT_PART(up.full_name, ' ', ARRAY_LENGTH(STRING_TO_ARRAY(up.full_name, ' '), 1)) || ', ' || 
    SPLIT_PART(up.full_name, ' ', 1) as medhub_format
  FROM public.user_profiles up
  WHERE up.role = 'resident'
) up ON staging."Evaluatee:" = up.medhub_format
WHERE up.id IS NULL
  AND staging."Evaluatee:" IS NOT NULL 
  AND TRIM(staging."Evaluatee:") != ''
GROUP BY staging."Evaluatee:"
ORDER BY comments_to_skip DESC;

/*
INTERPRETATION:

Query 1: Shows total rows uploaded
Query 2: Shows NULL/empty evaluatee count
Query 3: Sample NULL rows to see if they have useful data
Query 4: Shows which residents will match (with preview)
Query 5: Shows which residents WON'T match (action needed)

Next steps:
- If Query 5 shows unmatched residents, we'll add manual overrides
- If Query 2 shows many NULL rows without comments, we'll delete them
- Then run: scripts/process-medhub-staging.sql
*/


