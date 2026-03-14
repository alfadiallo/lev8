-- Fix calculate_pgy_level SQL function to clamp PGY within valid range
-- Previously returned unbounded values (PGY-4, PGY-5 for graduated, negative for future)
-- Now clamps to [0, p_program_length]: 1-3 for active residents, 0 for out-of-range

CREATE OR REPLACE FUNCTION calculate_pgy_level(
  p_graduation_year INT,
  p_reference_date DATE DEFAULT CURRENT_DATE,
  p_program_length INT DEFAULT 3
)
RETURNS INT AS $$
DECLARE
  v_academic_year INT;
  v_pgy INT;
BEGIN
  IF EXTRACT(MONTH FROM p_reference_date) >= 7 THEN
    v_academic_year := EXTRACT(YEAR FROM p_reference_date)::INT;
  ELSE
    v_academic_year := EXTRACT(YEAR FROM p_reference_date)::INT - 1;
  END IF;
  
  v_pgy := p_program_length - (p_graduation_year - v_academic_year - 1);
  
  RETURN GREATEST(0, LEAST(p_program_length, v_pgy));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
