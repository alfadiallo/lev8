-- CORRECTED: Run this in Supabase SQL Editor

DO $$
DECLARE
  v_morgan_id UUID;
  v_resident_record RECORD;
BEGIN
  -- 1. Get Morgan Reel's ID (R021)
  SELECT id INTO v_morgan_id
  FROM residents 
  WHERE anon_code = 'R021';

  IF v_morgan_id IS NULL THEN
    RAISE EXCEPTION 'Resident Morgan Reel (R021) not found';
  END IF;

  -- 2. Clear existing scores
  DELETE FROM ite_scores;

  -- 3. Insert Morgan's Scores
  -- PGY-1 (2024)
  INSERT INTO ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, scaled_score, percentile)
  VALUES (v_morgan_id, '2024-02-25', '2023-2024', 1, 66, 198, 59);

  -- PGY-2 (2025)
  INSERT INTO ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, scaled_score, percentile)
  VALUES (v_morgan_id, '2025-02-25', '2024-2025', 2, 74, 222, 72);

  -- 4. Insert Fake Classmate Scores for Averages
  FOR v_resident_record IN SELECT id FROM residents WHERE id != v_morgan_id LIMIT 15 LOOP
    
    -- Classmate PGY-1 Score
    INSERT INTO ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, scaled_score, percentile)
    VALUES (
      v_resident_record.id, 
      '2024-02-25', 
      '2023-2024', 
      1, 
      floor(random() * (80-50+1) + 50)::int,
      floor(random() * (240-150+1) + 150)::int,
      floor(random() * (90-20+1) + 20)::int
    );
    
    -- Classmate PGY-2 Score
    INSERT INTO ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, scaled_score, percentile)
    VALUES (
      v_resident_record.id, 
      '2025-02-25', 
      '2024-2025', 
      2, 
      floor(random() * (85-60+1) + 60)::int, 
      floor(random() * (250-170+1) + 170)::int,
      floor(random() * (95-30+1) + 30)::int
    );
  END LOOP;

  RAISE NOTICE 'ITE Data populated successfully';
END $$;
