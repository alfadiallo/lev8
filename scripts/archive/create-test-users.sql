-- Create Test Users and Residents for Analytics Dashboard Testing
-- Run this if you don't have any residents in your database yet

-- ============================================================================
-- STEP 1: Create a Health System
-- ============================================================================
INSERT INTO public.health_systems (id, name, abbreviation, location)
VALUES 
  (gen_random_uuid(), 'Memorial Hospital System', 'MHS', 'Chicago, IL')
ON CONFLICT DO NOTHING
RETURNING id, name;

-- Copy the health_system_id from above, or use this query to get it:
-- SELECT id FROM public.health_systems WHERE abbreviation = 'MHS';

-- ============================================================================
-- STEP 2: Create a Program
-- ============================================================================
-- Replace 'YOUR_HEALTH_SYSTEM_ID' with the ID from Step 1
INSERT INTO public.programs (id, health_system_id, name, specialty)
VALUES 
  (
    gen_random_uuid(), 
    (SELECT id FROM public.health_systems WHERE abbreviation = 'MHS' LIMIT 1),
    'Emergency Medicine Residency', 
    'Emergency Medicine'
  )
ON CONFLICT DO NOTHING
RETURNING id, name;

-- Copy the program_id from above, or use:
-- SELECT id FROM public.programs WHERE name = 'Emergency Medicine Residency';

-- ============================================================================
-- STEP 3: Create Academic Classes
-- ============================================================================
INSERT INTO public.academic_classes (id, program_id, class_year, start_date, graduation_date, is_active)
VALUES 
  -- Class of 2026 (Current PGY-2)
  (
    gen_random_uuid(),
    (SELECT id FROM public.programs WHERE name = 'Emergency Medicine Residency' LIMIT 1),
    '2026',
    '2024-07-01',
    '2027-06-30',
    true
  ),
  -- Class of 2027 (Current PGY-1)
  (
    gen_random_uuid(),
    (SELECT id FROM public.programs WHERE name = 'Emergency Medicine Residency' LIMIT 1),
    '2027',
    '2025-07-01',
    '2028-06-30',
    true
  ),
  -- Class of 2025 (Current PGY-3)
  (
    gen_random_uuid(),
    (SELECT id FROM public.programs WHERE name = 'Emergency Medicine Residency' LIMIT 1),
    '2025',
    '2023-07-01',
    '2026-06-30',
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 4: Create Test Users in Supabase Auth
-- ============================================================================
-- NOTE: You need to create these users in Supabase Auth dashboard first,
-- or use the Supabase API to create them programmatically.
-- For now, we'll assume you have Supabase auth user IDs.

-- If you don't have auth users yet, you can:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User"
-- 3. Create users with emails like: test-resident1@example.com
-- 4. Copy their user IDs and use them below

-- ============================================================================
-- STEP 5: Create User Profiles (Manual - Replace UUIDs)
-- ============================================================================
-- Option A: If you have Supabase Auth user IDs, use them
/*
INSERT INTO public.user_profiles (id, email, full_name, role, institution_id)
VALUES 
  (
    'YOUR_SUPABASE_AUTH_USER_ID_1', -- Replace with actual auth user ID
    'john.doe@example.com',
    'Dr. John Doe',
    'resident',
    (SELECT id FROM public.health_systems WHERE abbreviation = 'MHS')
  ),
  (
    'YOUR_SUPABASE_AUTH_USER_ID_2',
    'jane.smith@example.com',
    'Dr. Jane Smith',
    'resident',
    (SELECT id FROM public.health_systems WHERE abbreviation = 'MHS')
  );
*/

-- Option B: Create test profiles without auth (for testing only)
-- WARNING: These won't be able to log in, but you can still create analytics data for them
INSERT INTO public.user_profiles (id, email, full_name, role, institution_id)
VALUES 
  (
    gen_random_uuid(),
    'john.doe@example.com',
    'Dr. John Doe',
    'resident',
    (SELECT id FROM public.health_systems WHERE abbreviation = 'MHS')
  ),
  (
    gen_random_uuid(),
    'jane.smith@example.com',
    'Dr. Jane Smith',
    'resident',
    (SELECT id FROM public.health_systems WHERE abbreviation = 'MHS')
  ),
  (
    gen_random_uuid(),
    'mike.johnson@example.com',
    'Dr. Mike Johnson',
    'resident',
    (SELECT id FROM public.health_systems WHERE abbreviation = 'MHS')
  )
ON CONFLICT (email, institution_id) DO NOTHING
RETURNING id, full_name, email;

-- ============================================================================
-- STEP 6: Create Residents
-- ============================================================================
INSERT INTO public.residents (user_id, program_id, class_id, medical_school, specialty)
SELECT 
  up.id as user_id,
  p.id as program_id,
  ac.id as class_id,
  'Example Medical School' as medical_school,
  'Emergency Medicine' as specialty
FROM public.user_profiles up
CROSS JOIN public.programs p
CROSS JOIN public.academic_classes ac
WHERE up.email = 'john.doe@example.com'
  AND p.name = 'Emergency Medicine Residency'
  AND ac.class_year = '2026'
LIMIT 1;

INSERT INTO public.residents (user_id, program_id, class_id, medical_school, specialty)
SELECT 
  up.id,
  p.id,
  ac.id,
  'Another Medical School',
  'Emergency Medicine'
FROM public.user_profiles up
CROSS JOIN public.programs p
CROSS JOIN public.academic_classes ac
WHERE up.email = 'jane.smith@example.com'
  AND p.name = 'Emergency Medicine Residency'
  AND ac.class_year = '2027'
LIMIT 1;

INSERT INTO public.residents (user_id, program_id, class_id, medical_school, specialty)
SELECT 
  up.id,
  p.id,
  ac.id,
  'Third Medical School',
  'Emergency Medicine'
FROM public.user_profiles up
CROSS JOIN public.programs p
CROSS JOIN public.academic_classes ac
WHERE up.email = 'mike.johnson@example.com'
  AND p.name = 'Emergency Medicine Residency'
  AND ac.class_year = '2025'
LIMIT 1;

-- ============================================================================
-- STEP 7: Verify Test Users Were Created
-- ============================================================================
SELECT 
  r.id as resident_id,
  up.full_name,
  up.email,
  up.role,
  ac.class_year,
  p.name as program_name
FROM public.residents r
JOIN public.user_profiles up ON up.id = r.user_id
LEFT JOIN public.academic_classes ac ON ac.id = r.class_id
LEFT JOIN public.programs p ON p.id = r.program_id
ORDER BY ac.class_year;

-- Expected: 3 rows showing the test residents

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- Copy one of the resident_id values from the result above
-- You'll use it in create-test-analytics-data.sql


