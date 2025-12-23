-- Process MedHub Staging Data (BATCHED for large datasets)
-- Run this AFTER uploading CSV - processes in chunks to avoid timeout

-- ============================================================================
-- STEP 1: Create Helper Functions & Override Table (Quick)
-- ============================================================================

-- Parse MedHub name format: "Dr. Last, First" → "First Last"
CREATE OR REPLACE FUNCTION parse_medhub_name(medhub_name TEXT) 
RETURNS TABLE(first_name TEXT, last_name TEXT, full_name TEXT) AS $$
DECLARE
  clean_name TEXT;
  name_parts TEXT[];
BEGIN
  clean_name := TRIM(REGEXP_REPLACE(medhub_name, '^Dr\.\s*', '', 'i'));
  
  IF POSITION(',' IN clean_name) > 0 THEN
    name_parts := STRING_TO_ARRAY(clean_name, ',');
    RETURN QUERY SELECT 
      TRIM(name_parts[2]) as first_name,
      TRIM(name_parts[1]) as last_name,
      TRIM(name_parts[2]) || ' ' || TRIM(name_parts[1]) as full_name;
  ELSE
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
  SELECT * INTO parsed_name FROM parse_medhub_name(medhub_name) LIMIT 1;
  
  IF parsed_name IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT r.id INTO resident_uuid
  FROM public.residents r
  JOIN public.user_profiles up ON up.id = r.user_id
  WHERE up.full_name = parsed_name.full_name;
  
  IF resident_uuid IS NOT NULL THEN
    RETURN resident_uuid;
  END IF;
  
  SELECT r.id INTO resident_uuid
  FROM public.residents r
  JOIN public.user_profiles up ON up.id = r.user_id
  WHERE LOWER(up.full_name) = LOWER(parsed_name.full_name);
  
  RETURN resident_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create override table
CREATE TABLE IF NOT EXISTS public.medhub_name_overrides (
  medhub_name TEXT PRIMARY KEY,
  resident_id UUID NOT NULL REFERENCES public.residents(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update matching function to check overrides
DROP FUNCTION IF EXISTS find_resident_with_overrides(text);

CREATE OR REPLACE FUNCTION find_resident_with_overrides(p_medhub_name TEXT)
RETURNS UUID AS $$
DECLARE
  resident_uuid UUID;
BEGIN
  SELECT resident_id INTO resident_uuid
  FROM public.medhub_name_overrides
  WHERE medhub_name_overrides.medhub_name = p_medhub_name;
  
  IF resident_uuid IS NOT NULL THEN
    RETURN resident_uuid;
  END IF;
  
  RETURN find_resident_by_medhub_name(p_medhub_name);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS! Functions created.
-- ============================================================================

/*
✅ Step 1 Complete!

Next: Run scripts/fix-unmatched-names.sql to:
- Create name overrides for the 3 unmatched residents
- Process ALL staging data (including the 3 now-matched)

The fix script handles the full import with proper batching.
*/


