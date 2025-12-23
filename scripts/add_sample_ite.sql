DO $$
DECLARE
  v_resident_id UUID;
  v_program_id UUID;
BEGIN
  -- Get Morgan Reel's ID
  SELECT id, program_id INTO v_resident_id, v_program_id
  FROM residents 
  WHERE anon_code = 'R021'; -- Morgan Reel is R021 from previous context

  -- Clear existing scores to avoid dupes for this demo
  DELETE FROM ite_scores WHERE resident_id = v_resident_id;

  -- Insert PGY-1 Score (2024)
  INSERT INTO ite_scores (
    resident_id, program_id, test_date, academic_year, pgy_level, 
    raw_score, scaled_score, percentile
  ) VALUES (
    v_resident_id, v_program_id, '2024-02-25', '2023-2024', 1, 
    70, 210, 65
  );

  -- Insert PGY-2 Score (2025)
  INSERT INTO ite_scores (
    resident_id, program_id, test_date, academic_year, pgy_level, 
    raw_score, scaled_score, percentile
  ) VALUES (
    v_resident_id, v_program_id, '2025-02-25', '2024-2025', 2, 
    78, 235, 82
  );

  RAISE NOTICE 'Added scores for Resident %', v_resident_id;
END $$;
