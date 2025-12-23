-- Import MedHub Comments with Name Matching
-- This script handles the name format reconciliation
-- MedHub format: "Dr. Last, First" → Lev8 format: "First Last"

-- ============================================================================
-- STEP 1: Create a temporary name mapping table
-- ============================================================================
CREATE TEMP TABLE temp_name_mapping AS
SELECT 
  r.id as resident_id,
  up.full_name as lev8_name,
  'Dr. ' || SPLIT_PART(up.full_name, ' ', 2) || ', ' || SPLIT_PART(up.full_name, ' ', 1) as medhub_name
FROM public.residents r
JOIN public.user_profiles up ON up.id = r.user_id;

-- View the mapping
SELECT * FROM temp_name_mapping ORDER BY lev8_name;

-- Example output:
-- resident_id | lev8_name     | medhub_name
-- ------------|---------------|------------------
-- uuid-123    | Kevin Abadi   | Dr. Abadi, Kevin
-- uuid-456    | Morgan Reel   | Dr. Reel, Morgan

-- ============================================================================
-- STEP 2: Create a helper function to parse MedHub names
-- ============================================================================
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
    RETURN QUERY SELECT 
      name_parts[1] as first_name,
      name_parts[2] as last_name,
      clean_name as full_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM parse_medhub_name('Dr. Abadi, Kevin');
-- Expected: first_name: Kevin, last_name: Abadi, full_name: Kevin Abadi

SELECT * FROM parse_medhub_name('Dr. Ben-Aderet, Mayrav');
-- Expected: first_name: Mayrav, last_name: Ben-Aderet, full_name: Mayrav Ben-Aderet

-- ============================================================================
-- STEP 3: Find resident by MedHub name
-- ============================================================================
CREATE OR REPLACE FUNCTION find_resident_by_medhub_name(medhub_name TEXT)
RETURNS UUID AS $$
DECLARE
  parsed_name RECORD;
  resident_uuid UUID;
BEGIN
  -- Parse the MedHub name
  SELECT * INTO parsed_name FROM parse_medhub_name(medhub_name);
  
  -- Try exact match
  SELECT r.id INTO resident_uuid
  FROM public.residents r
  JOIN public.user_profiles up ON up.id = r.user_id
  WHERE up.full_name = parsed_name.full_name;
  
  -- If exact match found, return it
  IF resident_uuid IS NOT NULL THEN
    RETURN resident_uuid;
  END IF;
  
  -- Try fuzzy match (case-insensitive)
  SELECT r.id INTO resident_uuid
  FROM public.residents r
  JOIN public.user_profiles up ON up.id = r.user_id
  WHERE LOWER(up.full_name) = LOWER(parsed_name.full_name);
  
  RETURN resident_uuid;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT find_resident_by_medhub_name('Dr. Abadi, Kevin');
-- Should return Kevin Abadi's resident_id

SELECT find_resident_by_medhub_name('Dr. Reel, Morgan');
-- Should return Morgan Reel's resident_id

-- ============================================================================
-- STEP 4: Bulk match all MedHub names to resident IDs
-- ============================================================================
-- When you import MedHub CSV, use this pattern:

/*
INSERT INTO public.imported_comments (
  date_completed,
  evaluatee,
  evaluation_type,
  question,
  comment_text,
  resident_id,  -- ← Use the matching function here
  pgy_level,
  period,
  period_label
)
SELECT 
  csv.date_completed::DATE,
  csv.evaluatee,
  csv.evaluation,
  csv.question,
  csv.comment,
  find_resident_by_medhub_name(csv.evaluatee) as resident_id,  -- ← Name matching!
  calculate_pgy_level(
    (SELECT class_id FROM residents WHERE id = find_resident_by_medhub_name(csv.evaluatee)),
    csv.date_completed::DATE
  ) as pgy_level,
  -- ... other fields
FROM temp_medhub_import csv;
*/

-- ============================================================================
-- STEP 5: Verify matches
-- ============================================================================
-- Check if all MedHub names can be matched:

SELECT 
  DISTINCT evaluatee_name,
  find_resident_by_medhub_name(evaluatee_name) as resident_id,
  CASE 
    WHEN find_resident_by_medhub_name(evaluatee_name) IS NOT NULL 
    THEN '✅ Matched'
    ELSE '❌ No match - needs manual review'
  END as status
FROM (
  VALUES 
    ('Dr. Abadi, Kevin'),
    ('Dr. Reel, Morgan'),
    ('Dr. Gonedes, Andrew'),
    ('Dr. Lutwak, Noy')
) AS test_names(evaluatee_name);

-- ============================================================================
-- STEP 6: Handle unmatched names (manual mapping)
-- ============================================================================
-- If some names don't match automatically, create a manual mapping table:

CREATE TABLE IF NOT EXISTS public.medhub_name_overrides (
  medhub_name TEXT PRIMARY KEY,
  resident_id UUID NOT NULL REFERENCES public.residents(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example manual overrides for edge cases:
/*
INSERT INTO public.medhub_name_overrides (medhub_name, resident_id, notes) VALUES
  ('Dr. Truong, Hong Diem', 
   (SELECT id FROM residents WHERE user_id = (SELECT id FROM user_profiles WHERE full_name = 'Jennifer Truong')),
   'MedHub uses "Hong Diem" but resident goes by "Jennifer"'),
  ('Dr. Modeen, Hadley',
   (SELECT id FROM residents WHERE user_id = (SELECT id FROM user_profiles WHERE full_name = 'Hadley Modeen')),
   'Name spelling variation');
*/

-- Update the find function to check overrides first:
CREATE OR REPLACE FUNCTION find_resident_by_medhub_name_with_overrides(medhub_name TEXT)
RETURNS UUID AS $$
DECLARE
  resident_uuid UUID;
BEGIN
  -- Check manual overrides first
  SELECT resident_id INTO resident_uuid
  FROM public.medhub_name_overrides
  WHERE LOWER(TRIM(medhub_name_overrides.medhub_name)) = LOWER(TRIM(medhub_name));
  
  IF resident_uuid IS NOT NULL THEN
    RETURN resident_uuid;
  END IF;
  
  -- Fall back to automatic matching
  RETURN find_resident_by_medhub_name(medhub_name);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- You now have:
-- 1. ✅ Name parser function: parse_medhub_name()
-- 2. ✅ Automatic matching: find_resident_by_medhub_name()
-- 3. ✅ Manual override system for edge cases
-- 4. ✅ Verification queries

-- When you're ready to import MedHub CSV data, use these functions
-- in your INSERT statements to automatically match names.


