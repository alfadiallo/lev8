-- ============================================================================
-- DEMO SEED DATA: County General Hospital - Emergency Medicine
-- ============================================================================
-- This script creates a complete demo environment for testing both
-- eqpqiq (interview tool) and lev8 (residency management)
--
-- To run: Execute in Supabase SQL Editor
-- To clean up: DELETE FROM health_systems WHERE is_demo = true;
-- ============================================================================

-- ============================================================================
-- 1. CREATE COUNTY GENERAL HOSPITAL (Health System)
-- ============================================================================
INSERT INTO public.health_systems (
    id,
    name,
    abbreviation,
    location,
    contact_email,
    is_demo
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'County General Hospital',
    'CGH',
    'Chicago, IL',
    'demo@countygeneralhospital.org',
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    location = EXCLUDED.location,
    is_demo = true;

-- ============================================================================
-- 2. CREATE EMERGENCY MEDICINE PROGRAM
-- ============================================================================
INSERT INTO public.programs (
    id,
    health_system_id,
    name,
    specialty,
    is_demo
) VALUES (
    'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'Emergency Medicine Residency Program',
    'Emergency Medicine',
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    specialty = EXCLUDED.specialty,
    is_demo = true;

-- ============================================================================
-- 3. CREATE ACADEMIC CLASSES (PGY Years)
-- ============================================================================
-- Class of 2027 (Current PGY-3)
INSERT INTO public.academic_classes (
    id,
    program_id,
    class_year,
    start_date,
    graduation_date,
    is_active
) VALUES (
    'c3d4e5f6-a7b8-9012-cdef-345678901234'::uuid,
    'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
    '2027',
    '2024-07-01',
    '2027-06-30',
    true
) ON CONFLICT (id) DO NOTHING;

-- Class of 2028 (Current PGY-2)
INSERT INTO public.academic_classes (
    id,
    program_id,
    class_year,
    start_date,
    graduation_date,
    is_active
) VALUES (
    'd4e5f6a7-b8c9-0123-def0-456789012345'::uuid,
    'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
    '2028',
    '2025-07-01',
    '2028-06-30',
    true
) ON CONFLICT (id) DO NOTHING;

-- Class of 2029 (Current PGY-1)
INSERT INTO public.academic_classes (
    id,
    program_id,
    class_year,
    start_date,
    graduation_date,
    is_active
) VALUES (
    'e5f6a7b8-c9d0-1234-ef01-567890123456'::uuid,
    'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
    '2029',
    '2026-07-01',
    '2029-06-30',
    true
) ON CONFLICT (id) DO NOTHING;

-- Class of 2030 (Incoming - these are our interview candidates!)
INSERT INTO public.academic_classes (
    id,
    program_id,
    class_year,
    start_date,
    graduation_date,
    is_active
) VALUES (
    'f6a7b8c9-d0e1-2345-f012-678901234567'::uuid,
    'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
    '2030',
    '2027-07-01',
    '2030-06-30',
    false
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. CREATE DEMO USER PROFILES (Faculty & PD)
-- ============================================================================

-- Program Director: Dr. Donald Anspaugh
INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    phone,
    role,
    institution_id,
    source
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'donald.anspaugh@demo.countygeneralhospital.org',
    'Dr. Donald Anspaugh',
    '312-555-0001',
    'program_director',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'lev8'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- Faculty: Dr. David Morgenstern
INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    phone,
    role,
    institution_id,
    source
) VALUES (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'david.morgenstern@demo.countygeneralhospital.org',
    'Dr. David Morgenstern',
    '312-555-0002',
    'faculty',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'lev8'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- Faculty: Dr. Carl Lewis (Interviewer)
INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    phone,
    role,
    institution_id,
    source
) VALUES (
    '33333333-3333-3333-3333-333333333333'::uuid,
    'carl.lewis@demo.countygeneralhospital.org',
    'Dr. Carl Lewis',
    '312-555-0003',
    'faculty',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'lev8'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- ============================================================================
-- 5. CREATE FACULTY RECORDS
-- Note: user_id is NULL because we can't create auth.users via SQL
-- The check-email API will match by email in user_profiles instead
-- ============================================================================

INSERT INTO public.faculty (
    id,
    user_id,
    full_name,
    credentials,
    email,
    program_id,
    is_active
) VALUES (
    'f1111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    'Donald Anspaugh',
    'MD',
    'donald.anspaugh@demo.countygeneralhospital.org',
    'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.faculty (
    id,
    user_id,
    full_name,
    credentials,
    email,
    program_id,
    is_active
) VALUES (
    'f2222222-2222-2222-2222-222222222222'::uuid,
    NULL,
    'David Morgenstern',
    'MD',
    'david.morgenstern@demo.countygeneralhospital.org',
    'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.faculty (
    id,
    user_id,
    full_name,
    credentials,
    email,
    program_id,
    is_active
) VALUES (
    'f3333333-3333-3333-3333-333333333333'::uuid,
    NULL,
    'Carl Lewis',
    'MD',
    'carl.lewis@demo.countygeneralhospital.org',
    'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
    true
) ON CONFLICT (id) DO NOTHING;

-- Update program with PD
UPDATE public.programs 
SET pgm_director_id = '11111111-1111-1111-1111-111111111111'::uuid
WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid;

-- ============================================================================
-- 6. CREATE DEMO INTERVIEW SESSION (2026-27 Season)
-- ============================================================================
INSERT INTO public.interview_sessions (
    id,
    session_type,
    program_id,
    created_by_user_id,
    creator_email,
    session_name,
    session_date,
    status,
    share_token,
    is_demo
) VALUES (
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'group',
    'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'donald.anspaugh@demo.countygeneralhospital.org',
    'Interview Day 1 - October 15, 2026',
    '2026-10-15',
    'active',
    'demo-cgh-001',
    true
) ON CONFLICT (id) DO UPDATE SET
    session_name = EXCLUDED.session_name,
    is_demo = true;

-- ============================================================================
-- 7. CREATE 10 TEST CANDIDATES
-- ============================================================================

-- 1. Mark Greene - University of South Alabama
INSERT INTO public.interview_candidates (
    id, session_id, candidate_name, candidate_email, medical_school,
    graduation_year, sort_order, is_demo
) VALUES (
    'ca0d1111-1111-1111-1111-111111111111'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Mark Greene',
    'mark.greene@demo.eqpqiq.com',
    'University of South Alabama Whiddon College of Medicine',
    2026, 1, true
) ON CONFLICT (id) DO UPDATE SET medical_school = EXCLUDED.medical_school, is_demo = true;

-- 2. Doug Ross - University of Arizona
INSERT INTO public.interview_candidates (
    id, session_id, candidate_name, candidate_email, medical_school,
    graduation_year, sort_order, is_demo
) VALUES (
    'ca0d2222-2222-2222-2222-222222222222'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Doug Ross',
    'doug.ross@demo.eqpqiq.com',
    'University of Arizona College of Medicine - Tucson',
    2026, 2, true
) ON CONFLICT (id) DO UPDATE SET medical_school = EXCLUDED.medical_school, is_demo = true;

-- 3. Susan Lewis - Baylor College of Medicine
INSERT INTO public.interview_candidates (
    id, session_id, candidate_name, candidate_email, medical_school,
    graduation_year, sort_order, is_demo
) VALUES (
    'ca0d3333-3333-3333-3333-333333333333'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Susan Lewis',
    'susan.lewis@demo.eqpqiq.com',
    'Baylor College of Medicine',
    2026, 3, true
) ON CONFLICT (id) DO UPDATE SET medical_school = EXCLUDED.medical_school, is_demo = true;

-- 4. Peter Benton - Indiana University
INSERT INTO public.interview_candidates (
    id, session_id, candidate_name, candidate_email, medical_school,
    graduation_year, sort_order, is_demo
) VALUES (
    'ca0d4444-4444-4444-4444-444444444444'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Peter Benton',
    'peter.benton@demo.eqpqiq.com',
    'Indiana University School of Medicine',
    2026, 4, true
) ON CONFLICT (id) DO UPDATE SET medical_school = EXCLUDED.medical_school, is_demo = true;

-- 5. John Carter - Johns Hopkins
INSERT INTO public.interview_candidates (
    id, session_id, candidate_name, candidate_email, medical_school,
    graduation_year, sort_order, is_demo
) VALUES (
    'ca0d5555-5555-5555-5555-555555555555'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'John Carter',
    'john.carter@demo.eqpqiq.com',
    'Johns Hopkins University School of Medicine',
    2026, 5, true
) ON CONFLICT (id) DO UPDATE SET medical_school = EXCLUDED.medical_school, is_demo = true;

-- 6. Kerry Weaver - Howard University
INSERT INTO public.interview_candidates (
    id, session_id, candidate_name, candidate_email, medical_school,
    graduation_year, sort_order, is_demo
) VALUES (
    'ca0d6666-6666-6666-6666-666666666666'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Kerry Weaver',
    'kerry.weaver@demo.eqpqiq.com',
    'Howard University College of Medicine',
    2026, 6, true
) ON CONFLICT (id) DO UPDATE SET medical_school = EXCLUDED.medical_school, is_demo = true;

-- 7. Elizabeth Corday - Philadelphia College of Osteopathic Medicine
INSERT INTO public.interview_candidates (
    id, session_id, candidate_name, candidate_email, medical_school,
    graduation_year, sort_order, is_demo
) VALUES (
    'ca0d7777-7777-7777-7777-777777777777'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Elizabeth Corday',
    'elizabeth.corday@demo.eqpqiq.com',
    'Philadelphia College of Osteopathic Medicine',
    2026, 7, true
) ON CONFLICT (id) DO UPDATE SET medical_school = EXCLUDED.medical_school, is_demo = true;

-- 8. Luka Kovac - FAU Charles E. Schmidt
INSERT INTO public.interview_candidates (
    id, session_id, candidate_name, candidate_email, medical_school,
    graduation_year, sort_order, is_demo
) VALUES (
    'ca0d8888-8888-8888-8888-888888888888'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Luka Kovac',
    'luka.kovac@demo.eqpqiq.com',
    'FAU Charles E. Schmidt College of Medicine',
    2026, 8, true
) ON CONFLICT (id) DO UPDATE SET medical_school = EXCLUDED.medical_school, is_demo = true;

-- 9. Abby Lockhart - Ross University
INSERT INTO public.interview_candidates (
    id, session_id, candidate_name, candidate_email, medical_school,
    graduation_year, sort_order, is_demo
) VALUES (
    'ca0d9999-9999-9999-9999-999999999999'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Abby Lockhart',
    'abby.lockhart@demo.eqpqiq.com',
    'Ross University School of Medicine',
    2026, 9, true
) ON CONFLICT (id) DO UPDATE SET medical_school = EXCLUDED.medical_school, is_demo = true;

-- 10. Robert Romano - St. George's University
INSERT INTO public.interview_candidates (
    id, session_id, candidate_name, candidate_email, medical_school,
    graduation_year, sort_order, is_demo
) VALUES (
    'ca0daaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Robert Romano',
    'robert.romano@demo.eqpqiq.com',
    'St. George''s University School of Medicine',
    2026, 10, true
) ON CONFLICT (id) DO UPDATE SET medical_school = EXCLUDED.medical_school, is_demo = true;

-- ============================================================================
-- 8. ADD SESSION INTERVIEWERS
-- ============================================================================
INSERT INTO public.interview_session_interviewers (
    id,
    session_id,
    user_id,
    interviewer_email,
    interviewer_name,
    role
) VALUES 
(
    '1a011111-1111-1111-1111-111111111111'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'donald.anspaugh@demo.countygeneralhospital.org',
    'Dr. Donald Anspaugh',
    'program_director'
),
(
    '1a022222-2222-2222-2222-222222222222'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'david.morgenstern@demo.countygeneralhospital.org',
    'Dr. David Morgenstern',
    'interviewer'
),
(
    '1a033333-3333-3333-3333-333333333333'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'carl.lewis@demo.countygeneralhospital.org',
    'Dr. Carl Lewis',
    'interviewer'
)
ON CONFLICT (session_id, interviewer_email) DO NOTHING;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Created:
-- - 1 Health System: County General Hospital (Chicago, IL)
-- - 1 Program: Emergency Medicine Residency
-- - 4 Academic Classes (2027-2030)
-- - 3 Demo Users: 1 Program Director + 2 Faculty
-- - 1 Interview Session: October 15, 2026
-- - 10 Test Candidates with medical schools
-- - 3 Session Interviewers
--
-- Demo Credentials:
-- - PD: donald.anspaugh@demo.countygeneralhospital.org
-- - Faculty: david.morgenstern@demo.countygeneralhospital.org
-- - Faculty: carl.lewis@demo.countygeneralhospital.org
-- ============================================================================
