-- Update MHS EM Faculty roster: emails, deletions, type corrections
-- Run against production Supabase when ready.
--
-- For these faculty to appear on a survey's Recipients tab (e.g. survey 40100c0a-...):
-- 1. They must have the same program_id as the survey (faculty.program_id = survey.program_id).
-- 2. You must be logged in with an email that has Progress Check program_director (or admin)
--    for that program (eqpqiq_user_roles: tool = 'progress_check', role = 'program_director',
--    program_id = survey's program). Otherwise the survey page shows "Access Restricted".

BEGIN;

-- ============================================================================
-- Delete faculty who are no longer on the MHS EM roster
-- ============================================================================

-- Alfa Diallo duplicate (mac.com entry — real entry is adiallo@mhs.net)
DELETE FROM faculty WHERE email = 'alfadiallo@mac.com';

-- Alfa Test Core Faculty (test account)
DELETE FROM faculty WHERE email = 'alfaomardiallo@gmail.com';

-- David Hooke — no longer on roster
DELETE FROM faculty WHERE email = 'dhooke@mhs.net';

-- ============================================================================
-- Update emails to match institutional roster
-- ============================================================================

-- Lara Goldstein: lgoldstein@mhs.net → LaGoldstein@mhs.net
UPDATE faculty SET email = 'LaGoldstein@mhs.net' WHERE email = 'lgoldstein@mhs.net';

-- Sandra Lopez: slopez@mhs.net → SandrLopez@mhs.net
UPDATE faculty SET email = 'SandrLopez@mhs.net' WHERE email = 'slopez@mhs.net';

-- Franz Mendoza-Garcia: fmendoza@mhs.net → FMendozaGarcia@mhs.net
UPDATE faculty SET email = 'FMendozaGarcia@mhs.net' WHERE email = 'fmendoza@mhs.net';

-- Jheanelle McKay: jmckay@mhs.net → JhMcKay@mhs.net
UPDATE faculty SET email = 'JhMcKay@mhs.net' WHERE email = 'jmckay@mhs.net';

-- Donny Perez: dperez@mhs.net → DoPerez@mhs.net
UPDATE faculty SET email = 'DoPerez@mhs.net' WHERE email = 'dperez@mhs.net';

-- Yehuda Wenger: hwenger@mhs.net → YWenger@mhs.net, full_name Hudi → Yehuda
UPDATE faculty
SET email = 'YWenger@mhs.net', full_name = 'Yehuda Wenger'
WHERE email = 'hwenger@mhs.net';

-- ============================================================================
-- Sync linked user_profiles (only for the addresses we changed)
-- ============================================================================

UPDATE user_profiles SET email = 'LaGoldstein@mhs.net' WHERE email = 'lgoldstein@mhs.net';
UPDATE user_profiles SET email = 'SandrLopez@mhs.net' WHERE email = 'slopez@mhs.net';
UPDATE user_profiles SET email = 'FMendozaGarcia@mhs.net' WHERE email = 'fmendoza@mhs.net';
UPDATE user_profiles SET email = 'JhMcKay@mhs.net' WHERE email = 'jmckay@mhs.net';
UPDATE user_profiles SET email = 'DoPerez@mhs.net' WHERE email = 'dperez@mhs.net';
UPDATE user_profiles SET email = 'YWenger@mhs.net' WHERE email = 'hwenger@mhs.net';

-- ============================================================================
-- Set faculty_type: 10 Core Faculty + 1 Teaching Faculty
-- ============================================================================

-- Donny Perez is now Teaching Faculty
UPDATE faculty
SET faculty_type = 'teaching'
WHERE email IN ('DoPerez@mhs.net', 'dperez@mhs.net');

-- Remaining 10 are Core Faculty (both old lowercase and new casing)
UPDATE faculty
SET faculty_type = 'core'
WHERE email IN (
  'HAtia@mhs.net', 'hatia@mhs.net',
  'adiallo@mhs.net', 'ADiallo@mhs.net',
  'LaGoldstein@mhs.net', 'lgoldstein@mhs.net',
  'RKatz@mhs.net', 'rkatz@mhs.net',
  'SKatz@mhs.net', 'skatz@mhs.net',
  'BKohen@mhs.net', 'bkohen@mhs.net',
  'SandrLopez@mhs.net', 'slopez@mhs.net',
  'JhMcKay@mhs.net', 'jmckay@mhs.net',
  'LMelnitsky@mhs.net', 'lmelnitsky@mhs.net',
  'FMendozaGarcia@mhs.net', 'fmendoza@mhs.net',
  'YWenger@mhs.net', 'hwenger@mhs.net'
);

COMMIT;

-- ============================================================================
-- Verification (run separately)
-- ============================================================================
-- SELECT f.full_name, f.email, f.faculty_type, f.is_active
-- FROM faculty f
-- WHERE f.program_id = (SELECT program_id FROM surveys WHERE id = '40100c0a-8006-4502-ad08-2564b8d159bc')
-- ORDER BY f.faculty_type, f.full_name;
-- Expected: 10 core + 1 teaching = 11 active faculty
