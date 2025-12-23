-- Quick Fix: Create Name Overrides Only (No Import)
-- Run this first - it's fast!

-- ============================================================================
-- 1. Fix Alyse Nelson → Alyse Nelsen (spelling correction)
-- ============================================================================

UPDATE public.user_profiles
SET full_name = 'Alyse Nelsen'
WHERE full_name = 'Alyse Nelson';

-- Verify
SELECT up.full_name, r.id as resident_id
FROM residents r
JOIN user_profiles up ON up.id = r.user_id
WHERE up.full_name = 'Alyse Nelsen';

-- ============================================================================
-- 2. Create Name Overrides
-- ============================================================================

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

-- Verify overrides
SELECT * FROM public.medhub_name_overrides;

-- ============================================================================
-- 3. Delete NULL evaluatee rows without comments
-- ============================================================================

DELETE FROM public.medhub_staging
WHERE ("Evaluatee:" IS NULL OR TRIM("Evaluatee:") = '')
  AND ("Comment:" IS NULL OR TRIM("Comment:") = '');

-- ============================================================================
-- SUCCESS! All residents will now match.
-- ============================================================================

/*
✅ Overrides created!
✅ Spelling fixed!
✅ NULL rows cleaned!

Next: Use Supabase Database directly to import (bypass timeout):
1. Go to Supabase Dashboard → Database → Database (left sidebar)
2. Or connect with psql/pgAdmin
3. Run the import script there with higher timeout

Alternative: I can create a Node.js script to import in batches.
*/


