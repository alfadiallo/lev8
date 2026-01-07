-- ============================================================================
-- CONSOLIDATE academic_classes AND classes TABLES
-- Migration: 20250131000001_consolidate_classes.sql
-- Purpose: Update all references from academic_classes to classes table
-- ============================================================================

-- ============================================================================
-- 1. UPDATE calculate_pgy_level FUNCTION TO USE classes TABLE
-- ============================================================================

-- Drop and recreate the function that uses academic_classes
DROP FUNCTION IF EXISTS calculate_pgy_level(UUID, DATE);

CREATE OR REPLACE FUNCTION calculate_pgy_level(
  p_class_id UUID,
  evaluation_date DATE DEFAULT CURRENT_DATE
) RETURNS TEXT AS $$
DECLARE
  v_graduation_year INTEGER;
  current_academic_year INTEGER;
  years_to_graduation INTEGER;
  pgy_level INTEGER;
BEGIN
  -- Get graduation year from classes table (not academic_classes)
  SELECT graduation_year INTO v_graduation_year
  FROM public.classes
  WHERE id = p_class_id;
  
  IF v_graduation_year IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Academic year starts July 1
  current_academic_year := CASE 
    WHEN EXTRACT(MONTH FROM evaluation_date) >= 7 
    THEN EXTRACT(YEAR FROM evaluation_date)
    ELSE EXTRACT(YEAR FROM evaluation_date) - 1
  END;
  
  years_to_graduation := v_graduation_year - current_academic_year;
  pgy_level := 4 - years_to_graduation; -- For 3-year program (adjust to 5 for 4-year)
  
  -- Bounds checking
  IF pgy_level < 1 OR pgy_level > 4 THEN
    RETURN NULL;
  END IF;
  
  RETURN 'PGY-' || pgy_level;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 2. MIGRATE DATA FROM academic_classes TO classes (IF NEEDED)
-- ============================================================================

-- This DO block migrates any data from academic_classes that isn't in classes yet
DO $$
DECLARE
  v_ac RECORD;
  v_program_id UUID;
  v_graduation_year INT;
BEGIN
  -- Only run if academic_classes exists and has data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academic_classes') THEN
    FOR v_ac IN SELECT * FROM public.academic_classes LOOP
      -- Extract graduation year from graduation_date or class_year
      v_graduation_year := COALESCE(
        EXTRACT(YEAR FROM v_ac.graduation_date)::INT,
        CASE 
          WHEN v_ac.class_year ~ '^\d{4}$' THEN v_ac.class_year::INT
          ELSE NULL
        END
      );
      
      -- Skip if we can't determine graduation year
      IF v_graduation_year IS NULL THEN
        CONTINUE;
      END IF;
      
      -- Insert into classes if not already exists
      INSERT INTO public.classes (id, program_id, graduation_year, name, is_active, created_at, updated_at)
      VALUES (
        v_ac.id,
        v_ac.program_id,
        v_graduation_year,
        COALESCE(v_ac.class_year, 'Class of ' || v_graduation_year),
        COALESCE(v_ac.is_active, true),
        v_ac.created_at,
        v_ac.updated_at
      )
      ON CONFLICT (id) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Data migration from academic_classes to classes complete';
  END IF;
END $$;

-- ============================================================================
-- 3. UPDATE RESIDENTS FK CONSTRAINT (if still pointing to academic_classes)
-- ============================================================================

DO $$
BEGIN
  -- Drop old FK constraint to academic_classes if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'residents_class_id_fkey' 
    AND table_name = 'residents'
  ) THEN
    ALTER TABLE public.residents DROP CONSTRAINT residents_class_id_fkey;
    RAISE NOTICE 'Dropped old residents_class_id_fkey constraint';
  END IF;
  
  -- Add new FK constraint to classes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_residents_class' 
    AND table_name = 'residents'
  ) THEN
    -- First ensure all resident class_ids exist in classes table
    UPDATE public.residents r
    SET class_id = NULL
    WHERE class_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public.classes c WHERE c.id = r.class_id);
    
    ALTER TABLE public.residents 
    ADD CONSTRAINT fk_residents_class 
    FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added fk_residents_class constraint to classes table';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'FK constraint update: %', SQLERRM;
END $$;

-- ============================================================================
-- 4. DEPRECATE academic_classes TABLE
-- ============================================================================

-- Add a comment to mark academic_classes as deprecated
COMMENT ON TABLE public.academic_classes IS 
  'DEPRECATED: Use classes table instead. This table is kept for backward compatibility 
   but will be removed in a future migration. All new code should use the classes table.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================





