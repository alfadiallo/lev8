-- Verify All 3 Fixes Were Completed

-- ============================================================================
-- 1. Check Alyse Nelsen spelling fix
-- ============================================================================
SELECT 
  'Alyse Nelsen Spelling' as check_item,
  CASE 
    WHEN full_name = 'Alyse Nelsen' THEN '✅ Fixed (Nelsen)'
    WHEN full_name = 'Alyse Nelson' THEN '❌ Still Nelson (not fixed)'
    ELSE '❓ Name not found: ' || COALESCE(full_name, 'NULL')
  END as status,
  full_name,
  r.id as resident_id
FROM user_profiles up
LEFT JOIN residents r ON r.user_id = up.id
WHERE full_name ILIKE '%nelsen%' OR full_name ILIKE '%nelson%';

-- ============================================================================
-- 2. Check all 3 overrides exist
-- ============================================================================
SELECT 
  '3 Name Overrides' as check_item,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ All 3 overrides created'
    WHEN COUNT(*) = 2 THEN '⚠️ Only 2 overrides (missing 1)'
    WHEN COUNT(*) = 1 THEN '⚠️ Only 1 override (missing 2)'
    ELSE '❌ No overrides found'
  END as status,
  COUNT(*)::TEXT || ' overrides' as details
FROM public.medhub_name_overrides;

-- Show all overrides
SELECT 
  medhub_name,
  up.full_name as maps_to_resident,
  notes
FROM public.medhub_name_overrides mno
JOIN public.residents r ON r.id = mno.resident_id
JOIN public.user_profiles up ON up.id = r.user_id;

-- ============================================================================
-- 3. Check NULL evaluatee rows status
-- ============================================================================
SELECT 
  'NULL Evaluatee Rows' as check_item,
  COUNT(*) as remaining_null_rows,
  COUNT(CASE WHEN "Comment:" IS NOT NULL AND TRIM("Comment:") != '' THEN 1 END) as with_comments,
  COUNT(CASE WHEN "Comment:" IS NULL OR TRIM("Comment:") = '' THEN 1 END) as without_comments,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All NULL rows deleted'
    WHEN COUNT(CASE WHEN "Comment:" IS NOT NULL AND TRIM("Comment:") != '' THEN 1 END) > 0 
      THEN '⚠️ NULL rows with comments exist (need review)'
    ELSE '✅ Only empty NULL rows remain (safe to ignore)'
  END as status
FROM public.medhub_staging
WHERE "Evaluatee:" IS NULL OR TRIM("Evaluatee:") = '';

-- Sample NULL rows (if any)
SELECT 
  "Date Completed:",
  "Evaluatee:",
  "Evaluation:",
  LEFT("Comment:", 100) as comment_preview
FROM public.medhub_staging
WHERE "Evaluatee:" IS NULL OR TRIM("Evaluatee:") = ''
LIMIT 5;

-- ============================================================================
-- SUMMARY: All 3 Residents Will Match?
-- ============================================================================
SELECT 
  'Final Matching Check' as check_item,
  staging."Evaluatee:",
  COUNT(*) as comment_count,
  find_resident_with_overrides(staging."Evaluatee:") as resident_id,
  CASE 
    WHEN find_resident_with_overrides(staging."Evaluatee:") IS NOT NULL 
    THEN '✅ Will Match'
    ELSE '❌ Still Unmatched'
  END as match_status
FROM public.medhub_staging staging
WHERE staging."Evaluatee:" IN (
  'Dr. Truong, Hong Diem',
  'Dr. Nelsen, Alyse',
  'Dr. Modeen, Ella'
)
GROUP BY staging."Evaluatee:"
ORDER BY staging."Evaluatee:";


