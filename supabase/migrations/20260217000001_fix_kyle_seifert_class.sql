-- ============================================================================
-- Fix Kyle Seifert: merge duplicate profiles and correct class assignment
--
-- Two profiles exist:
--   1. kylemseifert@gmail.com  (user_id 93a267b3...) -> R051, Class of 2024  [ACTIVE - he uses this]
--   2. kyle.seifert@mhs.org   (user_id cf52679e...) -> R039, Class of 2027  [from bulk import]
--
-- Fix: Update the active gmail profile/resident to Class of 2027,
--       link the institutional email as personal_email,
--       and remove the orphaned duplicate.
-- ============================================================================

-- Step 1: Fix the active resident record (R051) to Class of 2027
UPDATE public.residents
SET class_id = '00000000-0000-0000-0000-000000000027'
WHERE id = 'dc96c26a-02e2-4f2c-8509-b1be4fa978d0';

-- Step 2: Link institutional email on the active (gmail) user profile
UPDATE public.user_profiles
SET personal_email = 'kyle.seifert@mhs.org'
WHERE id = '93a267b3-0ac3-4e56-9a27-1a6fef4f5930';

-- Step 3: Update anon_code on the active resident from R051 to R039 (follows class cadence)
UPDATE public.residents
SET anon_code = 'R039'
WHERE id = 'dc96c26a-02e2-4f2c-8509-b1be4fa978d0';

-- Step 4: Reassign any FK references from the orphaned resident (R039) to the real one (R051)
UPDATE public.running_board_sessions
SET learner_id = 'dc96c26a-02e2-4f2c-8509-b1be4fa978d0'
WHERE learner_id = '9fe5f470-e6fc-4229-b0ff-130993f45d1a';

-- Also reassign any other tables that might reference the orphaned resident
UPDATE public.structured_ratings
SET resident_id = 'dc96c26a-02e2-4f2c-8509-b1be4fa978d0'
WHERE resident_id = '9fe5f470-e6fc-4229-b0ff-130993f45d1a';

UPDATE public.period_scores
SET resident_id = 'dc96c26a-02e2-4f2c-8509-b1be4fa978d0'
WHERE resident_id = '9fe5f470-e6fc-4229-b0ff-130993f45d1a';

UPDATE public.swot_summaries
SET resident_id = 'dc96c26a-02e2-4f2c-8509-b1be4fa978d0'
WHERE resident_id = '9fe5f470-e6fc-4229-b0ff-130993f45d1a';

UPDATE public.ite_scores
SET resident_id = 'dc96c26a-02e2-4f2c-8509-b1be4fa978d0'
WHERE resident_id = '9fe5f470-e6fc-4229-b0ff-130993f45d1a';

UPDATE public.imported_comments
SET resident_id = 'dc96c26a-02e2-4f2c-8509-b1be4fa978d0'
WHERE resident_id = '9fe5f470-e6fc-4229-b0ff-130993f45d1a';

-- Step 4: Now safe to remove the orphaned duplicate resident record (R039)
DELETE FROM public.residents
WHERE id = '9fe5f470-e6fc-4229-b0ff-130993f45d1a';

-- Step 4 (optional): Remove the orphaned institutional user profile
-- Only if no other records reference it. Commenting out for safety.
-- DELETE FROM public.user_profiles
-- WHERE id = 'cf52679e-2eb2-405b-89f0-1652dcd9857d';

-- Verify
SELECT 
    r.id AS resident_id,
    r.anon_code,
    up.full_name,
    up.email,
    up.personal_email,
    c.graduation_year,
    c.name AS class_name
FROM public.residents r
JOIN public.user_profiles up ON r.user_id = up.id
JOIN public.classes c ON r.class_id = c.id
WHERE up.full_name ILIKE '%seifert%';
