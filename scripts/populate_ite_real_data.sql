-- Run this in Supabase SQL Editor to populate exact ITE data
-- WARNING: This will clear existing ITE scores first.

DO $$
DECLARE
  v_program_id UUID;
  v_resident_id UUID;
  v_resident_record RECORD;
  v_json_data JSONB;
  v_resident_item JSONB;
  v_name TEXT;
  v_pgy1_ite INT; v_pgy1_pct INT;
  v_pgy2_ite INT; v_pgy2_pct INT;
  v_pgy3_ite INT; v_pgy3_pct INT;
BEGIN
  -- Get Program ID (assuming single program)
  SELECT id INTO v_program_id FROM programs LIMIT 1;

  -- Clear existing scores
  DELETE FROM ite_scores;

  -- Define the data
  v_json_data := '[
    {"name": "Nadine Ajami", "class": 2025, "pgy1": [67, 55], "pgy2": [69, 32], "pgy3": [68, 16]},
    {"name": "Sebastian Fresquet", "class": 2025, "pgy1": [68, 59], "pgy2": [86, 96], "pgy3": [86, 92]},
    {"name": "Sara Greenwald", "class": 2025, "pgy1": [66, 51], "pgy2": [65, 15], "pgy3": [79, 72]},
    {"name": "Jalyn Joseph", "class": 2025, "pgy1": [67, 55], "pgy2": [70, 37], "pgy3": [75, 52]},
    {"name": "Ryan Kelly", "class": 2025, "pgy1": [63, 35], "pgy2": [74, 58], "pgy3": [75, 52]},
    {"name": "Hadley Modeen", "class": 2025, "pgy1": [59, 18], "pgy2": [65, 15], "pgy3": [72, 36]},
    {"name": "Ambika Shivarajpur", "class": 2025, "pgy1": [63, 35], "pgy2": [65, 15], "pgy3": [79, 72]},
    {"name": "Larissa Tavares", "class": 2025, "pgy1": [52, 2], "pgy2": [62, 7], "pgy3": [71, 30]},
    {"name": "Jennifer Truong", "class": 2025, "pgy1": [62, 31], "pgy2": [69, 32], "pgy3": [77, 62]},
    {"name": "Carly Whittaker", "class": 2025, "pgy1": [63, 35], "pgy2": [70, 37], "pgy3": [74, 46]},
    
    {"name": "Morgan Reel", "class": 2026, "pgy1": [66, 59], "pgy2": [74, 72], "pgy3": null},
    {"name": "Andrew Gonedes", "class": 2026, "pgy1": [69, 71], "pgy2": [81, 93], "pgy3": null},
    {"name": "Noy Lutwak", "class": 2026, "pgy1": [60, 28], "pgy2": [74, 72], "pgy3": null},
    {"name": "Kenneth Holton", "class": 2026, "pgy1": [57, 14], "pgy2": [73, 67], "pgy3": null},
    {"name": "Simon Londono", "class": 2026, "pgy1": [81, 97], "pgy2": [90, 99], "pgy3": null},
    {"name": "Mariam Attia", "class": 2026, "pgy1": [81, 97], "pgy2": [82, 93], "pgy3": null},
    {"name": "Anastasia Alpizar", "class": 2026, "pgy1": [74, 88], "pgy2": [72, 62], "pgy3": null},
    {"name": "Andrei Simon", "class": 2026, "pgy1": [65, 53], "pgy2": [72, 62], "pgy3": null},
    {"name": "Alyse Nelsen", "class": 2026, "pgy1": [63, 43], "pgy2": [73, 67], "pgy3": null},
    {"name": "Richard Halpern", "class": 2026, "pgy1": [74, 88], "pgy2": [76, 81], "pgy3": null},
    
    {"name": "Farah Azzouz", "class": 2027, "pgy1": [63, 51], "pgy2": null, "pgy3": null},
    {"name": "Alexandra Blanco", "class": 2027, "pgy1": [66, 65], "pgy2": null, "pgy3": null},
    {"name": "Nicholas Booth", "class": 2027, "pgy1": [63, 51], "pgy2": null, "pgy3": null},
    {"name": "Aleksandr Butovskiy", "class": 2027, "pgy1": [66, 65], "pgy2": null, "pgy3": null},
    {"name": "Marianne Lopez", "class": 2027, "pgy1": [66, 65], "pgy2": null, "pgy3": null},
    {"name": "Spencer Rice", "class": 2027, "pgy1": [67, 70], "pgy2": null, "pgy3": null},
    {"name": "Claudia Risi", "class": 2027, "pgy1": [59, 28], "pgy2": null, "pgy3": null},
    {"name": "Cale Schneider", "class": 2027, "pgy1": [69, 79], "pgy2": null, "pgy3": null},
    {"name": "Kyle Seifert", "class": 2027, "pgy1": [66, 65], "pgy2": null, "pgy3": null},
    {"name": "Samantha Stein", "class": 2027, "pgy1": [66, 65], "pgy2": null, "pgy3": null}
  ]';

  -- Iterate and Insert
  FOR v_resident_item IN SELECT * FROM jsonb_array_elements(v_json_data) LOOP
    v_name := v_resident_item->>'name';
    
    -- Find Resident ID by Name (fuzzy match or exact)
    SELECT r.id INTO v_resident_id
    FROM residents r
    JOIN user_profiles up ON r.user_id = up.id
    WHERE up.full_name ILIKE v_name
    LIMIT 1;

    IF v_resident_id IS NOT NULL THEN
      -- PGY 1
      IF v_resident_item->'pgy1' IS NOT NULL AND jsonb_typeof(v_resident_item->'pgy1') != 'null' THEN
        v_pgy1_ite := (v_resident_item->'pgy1'->>0)::int;
        v_pgy1_pct := (v_resident_item->'pgy1'->>1)::int;
        INSERT INTO ite_scores (resident_id, academic_year, test_date, pgy_level, raw_score, percentile)
        VALUES (v_resident_id, '2022-2023', '2023-02-25', 1, v_pgy1_ite, v_pgy1_pct);
      END IF;

      -- PGY 2
      IF v_resident_item->'pgy2' IS NOT NULL AND jsonb_typeof(v_resident_item->'pgy2') != 'null' THEN
        v_pgy2_ite := (v_resident_item->'pgy2'->>0)::int;
        v_pgy2_pct := (v_resident_item->'pgy2'->>1)::int;
        INSERT INTO ite_scores (resident_id, academic_year, test_date, pgy_level, raw_score, percentile)
        VALUES (v_resident_id, '2023-2024', '2024-02-25', 2, v_pgy2_ite, v_pgy2_pct);
      END IF;

      -- PGY 3
      IF v_resident_item->'pgy3' IS NOT NULL AND jsonb_typeof(v_resident_item->'pgy3') != 'null' THEN
        v_pgy3_ite := (v_resident_item->'pgy3'->>0)::int;
        v_pgy3_pct := (v_resident_item->'pgy3'->>1)::int;
        INSERT INTO ite_scores (resident_id, academic_year, test_date, pgy_level, raw_score, percentile)
        VALUES (v_resident_id, '2024-2025', '2025-02-25', 3, v_pgy3_ite, v_pgy3_pct);
      END IF;
      
      -- Also update/set their class year if needed (optional, handled by classes table ideally)
    ELSE
      RAISE NOTICE 'Resident not found: %', v_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'ITE Data import complete.';
END $$;

