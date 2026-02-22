-- Add faculty_type and site columns to the faculty table
-- faculty_type: 'core' (CCC members, continuity clinic) or 'teaching' (attendings who work with residents)
-- site: hospital/site name for the faculty member

ALTER TABLE faculty
  ADD COLUMN IF NOT EXISTS faculty_type text NOT NULL DEFAULT 'core',
  ADD COLUMN IF NOT EXISTS site text;

-- Backfill from user_profiles where faculty_type was previously stored
UPDATE faculty f
SET faculty_type = up.faculty_type
FROM user_profiles up
WHERE f.user_id = up.id
  AND up.faculty_type IS NOT NULL
  AND up.faculty_type != f.faculty_type;

COMMENT ON COLUMN faculty.faculty_type IS 'core = CCC/program faculty, teaching = attending physicians who evaluate residents';
COMMENT ON COLUMN faculty.site IS 'Hospital or site name (e.g., Memorial Hospital West)';
