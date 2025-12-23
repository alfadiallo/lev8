-- ============================================================================
-- CLASSES TABLE & RESIDENT CLASS CHANGE AUDIT
-- Migration: 20250130000004_classes_table.sql
-- Purpose: Create classes table for PGY level tracking and audit trail for class changes
-- ============================================================================

-- ============================================================================
-- 1. CREATE CLASSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  graduation_year INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique graduation year per program
  CONSTRAINT unique_program_graduation_year UNIQUE (program_id, graduation_year)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_classes_program ON classes(program_id);
CREATE INDEX IF NOT EXISTS idx_classes_graduation_year ON classes(graduation_year);
CREATE INDEX IF NOT EXISTS idx_classes_is_active ON classes(is_active);

-- ============================================================================
-- 2. CREATE RESIDENT CLASS CHANGES AUDIT TABLE
-- ============================================================================

-- Create enum for change reasons
DO $$ BEGIN
  CREATE TYPE class_change_reason AS ENUM (
    'remediation',
    'leave_of_absence', 
    'academic_extension',
    'administrative',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS resident_class_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  from_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  to_class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  reason class_change_reason NOT NULL DEFAULT 'other',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_class_changes_resident ON resident_class_changes(resident_id);
CREATE INDEX IF NOT EXISTS idx_class_changes_effective_date ON resident_class_changes(effective_date);
CREATE INDEX IF NOT EXISTS idx_class_changes_to_class ON resident_class_changes(to_class_id);

-- ============================================================================
-- 3. POPULATE CLASSES TABLE WITH EXISTING DATA
-- ============================================================================

-- Insert classes for the existing class_ids found in residents table
-- Using the Emergency Medicine program
DO $$
DECLARE
  v_program_id UUID;
BEGIN
  -- Get the Emergency Medicine program ID
  SELECT id INTO v_program_id FROM programs WHERE name ILIKE '%Emergency Medicine%' LIMIT 1;
  
  IF v_program_id IS NULL THEN
    -- Fallback: get any program
    SELECT id INTO v_program_id FROM programs LIMIT 1;
  END IF;
  
  IF v_program_id IS NOT NULL THEN
    -- Insert Class of 2024 (graduated)
    INSERT INTO classes (id, program_id, graduation_year, name, is_active)
    VALUES ('00000000-0000-0000-0000-000000000024', v_program_id, 2024, 'Class of 2024', false)
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert Class of 2025 (graduated or graduating)
    INSERT INTO classes (id, program_id, graduation_year, name, is_active)
    VALUES ('00000000-0000-0000-0000-000000000025', v_program_id, 2025, 'Class of 2025', false)
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert Class of 2026 (current PGY-3)
    INSERT INTO classes (id, program_id, graduation_year, name, is_active)
    VALUES ('00000000-0000-0000-0000-000000000026', v_program_id, 2026, 'Class of 2026', true)
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert Class of 2027 (current PGY-2)
    INSERT INTO classes (id, program_id, graduation_year, name, is_active)
    VALUES ('00000000-0000-0000-0000-000000000027', v_program_id, 2027, 'Class of 2027', true)
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert Class of 2028 (current PGY-1)
    INSERT INTO classes (id, program_id, graduation_year, name, is_active)
    VALUES ('00000000-0000-0000-0000-000000000028', v_program_id, 2028, 'Class of 2028', true)
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Classes populated for program_id: %', v_program_id;
  ELSE
    RAISE NOTICE 'No program found - classes not populated';
  END IF;
END $$;

-- ============================================================================
-- 4. ADD FOREIGN KEY CONSTRAINT TO RESIDENTS TABLE
-- ============================================================================

-- Add FK constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_residents_class' 
    AND table_name = 'residents'
  ) THEN
    ALTER TABLE residents 
    ADD CONSTRAINT fk_residents_class 
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Foreign key constraint may already exist or classes not yet populated';
END $$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_class_changes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (for rerunning migration)
DROP POLICY IF EXISTS "classes_select_authenticated" ON classes;
DROP POLICY IF EXISTS "classes_insert_admin" ON classes;
DROP POLICY IF EXISTS "classes_update_admin" ON classes;
DROP POLICY IF EXISTS "class_changes_select_staff" ON resident_class_changes;
DROP POLICY IF EXISTS "class_changes_insert_admin" ON resident_class_changes;

-- Classes: readable by all authenticated users
CREATE POLICY "classes_select_authenticated" ON classes
  FOR SELECT TO authenticated
  USING (true);

-- Classes: insertable/updatable by program directors and admins
CREATE POLICY "classes_insert_admin" ON classes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin')
    )
  );

CREATE POLICY "classes_update_admin" ON classes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin')
    )
  );

-- Resident class changes: readable by program staff
CREATE POLICY "class_changes_select_staff" ON resident_class_changes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin', 'faculty', 'coordinator')
    )
  );

-- Resident class changes: insertable by program directors
CREATE POLICY "class_changes_insert_admin" ON resident_class_changes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('program_director', 'admin', 'system_admin')
    )
  );

-- ============================================================================
-- 6. HELPER FUNCTION: Calculate PGY Level
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_pgy_level(
  p_graduation_year INT,
  p_reference_date DATE DEFAULT CURRENT_DATE,
  p_program_length INT DEFAULT 3
)
RETURNS INT AS $$
DECLARE
  v_academic_year INT;
BEGIN
  -- Academic year starts July 1
  -- If reference date is July or later, academic year = reference year
  -- Otherwise, academic year = reference year - 1
  IF EXTRACT(MONTH FROM p_reference_date) >= 7 THEN
    v_academic_year := EXTRACT(YEAR FROM p_reference_date)::INT;
  ELSE
    v_academic_year := EXTRACT(YEAR FROM p_reference_date)::INT - 1;
  END IF;
  
  -- PGY = program_length - (graduation_year - academic_year - 1)
  RETURN p_program_length - (p_graduation_year - v_academic_year - 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 7. VIEW: Residents with PGY Level
-- ============================================================================

CREATE OR REPLACE VIEW residents_with_pgy AS
SELECT 
  r.id,
  r.user_id,
  r.program_id,
  r.class_id,
  r.anon_code,
  r.medical_school,
  r.specialty,
  r.created_at,
  r.updated_at,
  c.graduation_year,
  c.name as class_name,
  c.is_active as class_is_active,
  calculate_pgy_level(c.graduation_year) as current_pgy_level,
  up.full_name,
  up.email
FROM residents r
LEFT JOIN classes c ON r.class_id = c.id
LEFT JOIN user_profiles up ON r.user_id = up.id;

-- Grant access to the view
GRANT SELECT ON residents_with_pgy TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================







