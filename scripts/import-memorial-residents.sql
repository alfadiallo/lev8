-- Import Memorial Healthcare System Residents
-- 50 residents across 5 graduation classes (2024-2028)
-- 3-year Emergency Medicine Residency Program

-- ============================================================================
-- STEP 1: Create Health System
-- ============================================================================
INSERT INTO public.health_systems (id, name, abbreviation, location)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Memorial Healthcare System',
  'MHS',
  'Hollywood, FL'
)
ON CONFLICT (id) DO UPDATE 
  SET name = EXCLUDED.name,
      abbreviation = EXCLUDED.abbreviation,
      location = EXCLUDED.location;

-- ============================================================================
-- STEP 2: Create Emergency Medicine Program
-- ============================================================================
INSERT INTO public.programs (id, health_system_id, name, specialty)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Emergency Medicine Residency',
  'Emergency Medicine'
)
ON CONFLICT (id) DO UPDATE 
  SET name = EXCLUDED.name,
      specialty = EXCLUDED.specialty;

-- ============================================================================
-- STEP 3: Create Academic Classes (2024-2028)
-- ============================================================================
-- Class of 2024 (Already Graduated - June 30, 2024)
INSERT INTO public.academic_classes (id, program_id, class_year, start_date, graduation_date, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000024'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '2024',
  '2021-07-01',
  '2024-06-30',
  false -- Graduated
)
ON CONFLICT (id) DO UPDATE 
  SET graduation_date = EXCLUDED.graduation_date,
      is_active = EXCLUDED.is_active;

-- Class of 2025 (Currently PGY-3)
INSERT INTO public.academic_classes (id, program_id, class_year, start_date, graduation_date, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000025'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '2025',
  '2022-07-01',
  '2025-06-30',
  true -- Active
)
ON CONFLICT (id) DO UPDATE 
  SET graduation_date = EXCLUDED.graduation_date,
      is_active = EXCLUDED.is_active;

-- Class of 2026 (Currently PGY-2)
INSERT INTO public.academic_classes (id, program_id, class_year, start_date, graduation_date, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000026'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '2026',
  '2023-07-01',
  '2026-06-30',
  true -- Active
)
ON CONFLICT (id) DO UPDATE 
  SET graduation_date = EXCLUDED.graduation_date,
      is_active = EXCLUDED.is_active;

-- Class of 2027 (Currently PGY-1)
INSERT INTO public.academic_classes (id, program_id, class_year, start_date, graduation_date, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000027'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '2027',
  '2024-07-01',
  '2027-06-30',
  true -- Active
)
ON CONFLICT (id) DO UPDATE 
  SET graduation_date = EXCLUDED.graduation_date,
      is_active = EXCLUDED.is_active;

-- Class of 2028 (Starting PGY-1 in July 2025)
INSERT INTO public.academic_classes (id, program_id, class_year, start_date, graduation_date, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000028'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '2028',
  '2025-07-01',
  '2028-06-30',
  true -- Will be active
)
ON CONFLICT (id) DO UPDATE 
  SET graduation_date = EXCLUDED.graduation_date,
      is_active = EXCLUDED.is_active;

-- ============================================================================
-- STEP 4: Create User Profiles (50 residents)
-- ============================================================================
-- Note: Using test emails. Replace with real emails if you have them.

-- Class of 2024 (10 residents - Graduated)
INSERT INTO public.user_profiles (id, email, full_name, role, institution_id) VALUES
  (gen_random_uuid(), 'kevin.abadi@mhs.org', 'Kevin Abadi', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'francisca.aguilar@mhs.org', 'Francisca Aguilar', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'matthew.bidwell@mhs.org', 'Matthew Bidwell', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'eduardo.diaz@mhs.org', 'Eduardo Diaz', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'sarah.eldin@mhs.org', 'Sarah Eldin', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'steven.gayda@mhs.org', 'Steven Gayda', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'joris.hoogendoorn@mhs.org', 'Joris Hoogendoorn', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'daniel.levi@mhs.org', 'Daniel Levi', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'jesse.shulman@mhs.org', 'Jesse Shulman', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'rolando.zamora@mhs.org', 'Rolando Zamora', 'resident', '00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (email, institution_id) DO NOTHING;

-- Class of 2025 (10 residents - PGY-3)
INSERT INTO public.user_profiles (id, email, full_name, role, institution_id) VALUES
  (gen_random_uuid(), 'nadine.ajami@mhs.org', 'Nadine Ajami', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'sebastian.fresquet@mhs.org', 'Sebastian Fresquet', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'sara.greenwald@mhs.org', 'Sara Greenwald', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'jalyn.joseph@mhs.org', 'Jalyn Joseph', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'ryan.kelly@mhs.org', 'Ryan Kelly', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'hadley.modeen@mhs.org', 'Hadley Modeen', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'ambika.shivarajpur@mhs.org', 'Ambika Shivarajpur', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'larissa.tavares@mhs.org', 'Larissa Tavares', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'jennifer.truong@mhs.org', 'Jennifer Truong', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'carly.whittaker@mhs.org', 'Carly Whittaker', 'resident', '00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (email, institution_id) DO NOTHING;

-- Class of 2026 (10 residents - PGY-2)
INSERT INTO public.user_profiles (id, email, full_name, role, institution_id) VALUES
  (gen_random_uuid(), 'morgan.reel@mhs.org', 'Morgan Reel', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'andrew.gonedes@mhs.org', 'Andrew Gonedes', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'noy.lutwak@mhs.org', 'Noy Lutwak', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'kenneth.holton@mhs.org', 'Kenneth Holton', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'simon.londono@mhs.org', 'Simon Londono', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'mariam.attia@mhs.org', 'Mariam Attia', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'anastasia.alpizar@mhs.org', 'Anastasia Alpizar', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'andrei.simon@mhs.org', 'Andrei Simon', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'alyse.nelson@mhs.org', 'Alyse Nelson', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'richard.halpern@mhs.org', 'Richard Halpern', 'resident', '00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (email, institution_id) DO NOTHING;

-- Class of 2027 (10 residents - PGY-1)
INSERT INTO public.user_profiles (id, email, full_name, role, institution_id) VALUES
  (gen_random_uuid(), 'farah.azzouz@mhs.org', 'Farah Azzouz', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'alexandra.blanco@mhs.org', 'Alexandra Blanco', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'nicholas.booth@mhs.org', 'Nicholas Booth', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'aleksandr.butovskiy@mhs.org', 'Aleksandr Butovskiy', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'marianne.lopez@mhs.org', 'Marianne Lopez', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'spencer.rice@mhs.org', 'Spencer Rice', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'claudia.risi@mhs.org', 'Claudia Risi', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'cale.schneider@mhs.org', 'Cale Schneider', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'kyle.seifert@mhs.org', 'Kyle Seifert', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'samantha.stein@mhs.org', 'Samantha Stein', 'resident', '00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (email, institution_id) DO NOTHING;

-- Class of 2028 (10 residents - Incoming PGY-1)
INSERT INTO public.user_profiles (id, email, full_name, role, institution_id) VALUES
  (gen_random_uuid(), 'mayrav.ben-aderet@mhs.org', 'Mayrav Ben-Aderet', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'rachel.biesse@mhs.org', 'Rachel Biesse', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'esther.dvorkin@mhs.org', 'Esther Dvorkin', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'connie.gonzalez@mhs.org', 'Connie Gonzalez', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'jessica.jahoda@mhs.org', 'Jessica Jahoda', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'tiffany.lusic@mhs.org', 'Tiffany Lusic', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'julio.palomera@mhs.org', 'Julio Palomera', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'leticia.perez@mhs.org', 'Leticia Perez', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'devan.reiss@mhs.org', 'Devan Reiss', 'resident', '00000000-0000-0000-0000-000000000001'::uuid),
  (gen_random_uuid(), 'jonathan.taus@mhs.org', 'Jonathan Taus', 'resident', '00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (email, institution_id) DO NOTHING;

-- ============================================================================
-- STEP 5: Link Residents to Program and Classes
-- ============================================================================

-- Class of 2024
INSERT INTO public.residents (user_id, program_id, class_id, specialty)
SELECT up.id, '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000024'::uuid, 'Emergency Medicine'
FROM public.user_profiles up
WHERE up.email IN (
  'kevin.abadi@mhs.org', 'francisca.aguilar@mhs.org', 'matthew.bidwell@mhs.org',
  'eduardo.diaz@mhs.org', 'sarah.eldin@mhs.org', 'steven.gayda@mhs.org',
  'joris.hoogendoorn@mhs.org', 'daniel.levi@mhs.org', 'jesse.shulman@mhs.org',
  'rolando.zamora@mhs.org'
)
ON CONFLICT (user_id) DO NOTHING;

-- Class of 2025
INSERT INTO public.residents (user_id, program_id, class_id, specialty)
SELECT up.id, '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000025'::uuid, 'Emergency Medicine'
FROM public.user_profiles up
WHERE up.email IN (
  'nadine.ajami@mhs.org', 'sebastian.fresquet@mhs.org', 'sara.greenwald@mhs.org',
  'jalyn.joseph@mhs.org', 'ryan.kelly@mhs.org', 'hadley.modeen@mhs.org',
  'ambika.shivarajpur@mhs.org', 'larissa.tavares@mhs.org', 'jennifer.truong@mhs.org',
  'carly.whittaker@mhs.org'
)
ON CONFLICT (user_id) DO NOTHING;

-- Class of 2026
INSERT INTO public.residents (user_id, program_id, class_id, specialty)
SELECT up.id, '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000026'::uuid, 'Emergency Medicine'
FROM public.user_profiles up
WHERE up.email IN (
  'morgan.reel@mhs.org', 'andrew.gonedes@mhs.org', 'noy.lutwak@mhs.org',
  'kenneth.holton@mhs.org', 'simon.londono@mhs.org', 'mariam.attia@mhs.org',
  'anastasia.alpizar@mhs.org', 'andrei.simon@mhs.org', 'alyse.nelson@mhs.org',
  'richard.halpern@mhs.org'
)
ON CONFLICT (user_id) DO NOTHING;

-- Class of 2027
INSERT INTO public.residents (user_id, program_id, class_id, specialty)
SELECT up.id, '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000027'::uuid, 'Emergency Medicine'
FROM public.user_profiles up
WHERE up.email IN (
  'farah.azzouz@mhs.org', 'alexandra.blanco@mhs.org', 'nicholas.booth@mhs.org',
  'aleksandr.butovskiy@mhs.org', 'marianne.lopez@mhs.org', 'spencer.rice@mhs.org',
  'claudia.risi@mhs.org', 'cale.schneider@mhs.org', 'kyle.seifert@mhs.org',
  'samantha.stein@mhs.org'
)
ON CONFLICT (user_id) DO NOTHING;

-- Class of 2028
INSERT INTO public.residents (user_id, program_id, class_id, specialty)
SELECT up.id, '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000028'::uuid, 'Emergency Medicine'
FROM public.user_profiles up
WHERE up.email IN (
  'mayrav.ben-aderet@mhs.org', 'rachel.biesse@mhs.org', 'esther.dvorkin@mhs.org',
  'connie.gonzalez@mhs.org', 'jessica.jahoda@mhs.org', 'tiffany.lusic@mhs.org',
  'julio.palomera@mhs.org', 'leticia.perez@mhs.org', 'devan.reiss@mhs.org',
  'jonathan.taus@mhs.org'
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 6: Verification Query
-- ============================================================================
SELECT 
  ac.class_year,
  COUNT(*) as resident_count,
  CASE 
    WHEN ac.class_year = '2024' THEN 'Graduated (PGY-3 complete)'
    WHEN ac.class_year = '2025' THEN 'Current PGY-3'
    WHEN ac.class_year = '2026' THEN 'Current PGY-2'
    WHEN ac.class_year = '2027' THEN 'Current PGY-1'
    WHEN ac.class_year = '2028' THEN 'Incoming PGY-1 (starts July 2025)'
  END as status
FROM public.residents r
JOIN public.academic_classes ac ON ac.id = r.class_id
WHERE r.program_id = '00000000-0000-0000-0000-000000000002'::uuid
GROUP BY ac.class_year
ORDER BY ac.class_year;

-- Expected Output:
-- 2024 | 10 | Graduated (PGY-3 complete)
-- 2025 | 10 | Current PGY-3
-- 2026 | 10 | Current PGY-2
-- 2027 | 10 | Current PGY-1
-- 2028 | 10 | Incoming PGY-1

-- ============================================================================
-- STEP 7: Get Sample Resident IDs for Testing
-- ============================================================================
SELECT 
  r.id as resident_id,
  up.full_name,
  up.email,
  ac.class_year,
  CASE 
    WHEN ac.class_year = '2024' THEN 'Graduated'
    WHEN ac.class_year = '2025' THEN 'PGY-3'
    WHEN ac.class_year = '2026' THEN 'PGY-2'
    WHEN ac.class_year = '2027' THEN 'PGY-1'
    WHEN ac.class_year = '2028' THEN 'Incoming'
  END as current_level
FROM public.residents r
JOIN public.user_profiles up ON up.id = r.user_id
JOIN public.academic_classes ac ON ac.id = r.class_id
WHERE r.program_id = '00000000-0000-0000-0000-000000000002'::uuid
ORDER BY ac.class_year, up.full_name
LIMIT 10;

-- Copy one of the resident_id values to use in create-test-analytics-data.sql

-- ============================================================================
-- SUCCESS! 🎉
-- ============================================================================
-- All 50 Memorial Healthcare System residents have been imported!
-- Next steps:
-- 1. Copy a resident_id from the query above
-- 2. Edit scripts/create-test-analytics-data.sql
-- 3. Replace YOUR_RESIDENT_ID_HERE with the copied ID
-- 4. Run the test data script
-- 5. Navigate to /modules/understand/overview and test!

