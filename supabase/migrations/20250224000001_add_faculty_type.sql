-- Add faculty_type column to user_profiles
-- Distinguishes between Core Faculty and Teaching Faculty

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS faculty_type VARCHAR(20) DEFAULT NULL;

-- Add constraint for valid values
ALTER TABLE user_profiles
ADD CONSTRAINT check_faculty_type 
CHECK (faculty_type IS NULL OR faculty_type IN ('core', 'teaching'));

-- Update existing faculty to be Core Faculty
UPDATE user_profiles
SET faculty_type = 'core'
WHERE role = 'faculty' AND faculty_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.faculty_type IS 'Type of faculty: core (Core Faculty) or teaching (Teaching Faculty). NULL for non-faculty roles.';



