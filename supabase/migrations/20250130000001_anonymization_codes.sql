-- Migration: Add anonymization codes to entity tables
-- Purpose: Support privacy toggle for CCC presentations
-- Each resident/faculty gets a permanent code (R001, F001) for anonymized display

-- Add anon_code to residents table
ALTER TABLE residents ADD COLUMN IF NOT EXISTS anon_code VARCHAR(10);

-- Add anon_code to faculty table  
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS anon_code VARCHAR(10);

-- Add anon_code to user_profiles for other roles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS anon_code VARCHAR(10);

-- Create unique indexes to prevent duplicate codes
CREATE UNIQUE INDEX IF NOT EXISTS idx_residents_anon_code ON residents(anon_code) WHERE anon_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_faculty_anon_code ON faculty(anon_code) WHERE anon_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_anon_code ON user_profiles(anon_code) WHERE anon_code IS NOT NULL;

-- Assign codes to existing residents (ordered by created_at for consistency)
WITH numbered_residents AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM residents
  WHERE anon_code IS NULL
)
UPDATE residents r
SET anon_code = 'R' || LPAD(nr.rn::text, 3, '0')
FROM numbered_residents nr
WHERE r.id = nr.id;

-- Assign codes to existing faculty (ordered by created_at for consistency)
WITH numbered_faculty AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM faculty
  WHERE anon_code IS NULL
)
UPDATE faculty f
SET anon_code = 'F' || LPAD(nf.rn::text, 3, '0')
FROM numbered_faculty nf
WHERE f.id = nf.id;

-- Assign codes to user_profiles that aren't residents or faculty
WITH numbered_users AS (
  SELECT up.id, ROW_NUMBER() OVER (ORDER BY up.created_at) as rn
  FROM user_profiles up
  LEFT JOIN residents r ON up.id = r.user_id
  LEFT JOIN faculty f ON up.id = f.user_id
  WHERE up.anon_code IS NULL
    AND r.id IS NULL 
    AND f.id IS NULL
)
UPDATE user_profiles up
SET anon_code = 'U' || LPAD(nu.rn::text, 3, '0')
FROM numbered_users nu
WHERE up.id = nu.id;

-- Create function to auto-assign anon_code on new resident insert
CREATE OR REPLACE FUNCTION assign_resident_anon_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num INT;
BEGIN
  IF NEW.anon_code IS NULL THEN
    SELECT COALESCE(MAX(SUBSTRING(anon_code FROM 2)::INT), 0) + 1 
    INTO next_num
    FROM residents 
    WHERE anon_code ~ '^R[0-9]+$';
    
    NEW.anon_code := 'R' || LPAD(next_num::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-assign anon_code on new faculty insert
CREATE OR REPLACE FUNCTION assign_faculty_anon_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num INT;
BEGIN
  IF NEW.anon_code IS NULL THEN
    SELECT COALESCE(MAX(SUBSTRING(anon_code FROM 2)::INT), 0) + 1 
    INTO next_num
    FROM faculty 
    WHERE anon_code ~ '^F[0-9]+$';
    
    NEW.anon_code := 'F' || LPAD(next_num::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-assignment
DROP TRIGGER IF EXISTS trigger_assign_resident_anon_code ON residents;
CREATE TRIGGER trigger_assign_resident_anon_code
  BEFORE INSERT ON residents
  FOR EACH ROW
  EXECUTE FUNCTION assign_resident_anon_code();

DROP TRIGGER IF EXISTS trigger_assign_faculty_anon_code ON faculty;
CREATE TRIGGER trigger_assign_faculty_anon_code
  BEFORE INSERT ON faculty
  FOR EACH ROW
  EXECUTE FUNCTION assign_faculty_anon_code();

-- Add comment for documentation
COMMENT ON COLUMN residents.anon_code IS 'Permanent anonymization code (R001, R002...) for privacy mode display';
COMMENT ON COLUMN faculty.anon_code IS 'Permanent anonymization code (F001, F002...) for privacy mode display';
COMMENT ON COLUMN user_profiles.anon_code IS 'Permanent anonymization code (U001, U002...) for privacy mode display';






