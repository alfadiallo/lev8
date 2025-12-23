-- ============================================================================
-- Seed Clinical Cases for Emergency Medicine
-- Creates sample clinical cases for the Memorial EM program
-- ============================================================================

DO $$
DECLARE
  v_institution_id UUID;
  v_educator_id UUID;
BEGIN
  -- Get Memorial Healthcare System ID
  SELECT id INTO v_institution_id
  FROM public.health_systems
  WHERE name = 'Memorial Healthcare System'
  LIMIT 1;

  IF v_institution_id IS NULL THEN
    RAISE EXCEPTION 'Memorial Healthcare System not found. Run import-memorial-residents.sql first.';
  END IF;

  -- Get an educator user (we'll use the first faculty member we can find, or NULL)
  SELECT id INTO v_educator_id
  FROM public.user_profiles
  WHERE role IN ('faculty', 'program_director', 'super_admin')
  LIMIT 1;

  RAISE NOTICE 'Institution ID: %', v_institution_id;
  RAISE NOTICE 'Educator ID: %', COALESCE(v_educator_id::TEXT, 'NULL (will create without educator)');

  -- Insert Clinical Cases
  INSERT INTO public.clinical_cases (
    institution_id,
    title,
    description,
    difficulty,
    specialty,
    estimated_duration_minutes,
    case_data,
    created_by_user_id,
    is_public,
    is_active
  ) VALUES
  
  -- Case 1: Chest Pain
  (
    v_institution_id,
    'Acute Chest Pain - STEMI',
    'A 58-year-old male presents with crushing substernal chest pain radiating to the left arm. Evaluate and manage this patient with suspected ST-elevation myocardial infarction.',
    'intermediate',
    'Emergency Medicine',
    30,
    jsonb_build_object(
      'patient', jsonb_build_object(
        'age', 58,
        'sex', 'male',
        'chief_complaint', 'Chest pain',
        'vital_signs', jsonb_build_object(
          'bp', '160/95',
          'hr', 105,
          'rr', 22,
          'temp', 98.6,
          'spo2', 94
        )
      ),
      'presentation', 'Patient reports 2 hours of crushing substernal chest pain that started while mowing the lawn. Pain radiates to left arm and jaw. Associated with diaphoresis and nausea. History of hypertension and hyperlipidemia. Father died of MI at age 62.',
      'learning_objectives', jsonb_build_array(
        'Recognize STEMI presentation',
        'Initiate appropriate emergency treatment',
        'Activate cardiac catheterization lab',
        'Manage complications'
      ),
      'key_findings', jsonb_build_array(
        'ST elevation in leads II, III, aVF',
        'Elevated troponin',
        'Risk factors present'
      )
    ),
    v_educator_id,
    true,
    true
  ),

  -- Case 2: Sepsis
  (
    v_institution_id,
    'Septic Shock - Pneumonia',
    'A 72-year-old female with fever, confusion, and hypotension. Recognize and manage septic shock from community-acquired pneumonia.',
    'advanced',
    'Emergency Medicine',
    45,
    jsonb_build_object(
      'patient', jsonb_build_object(
        'age', 72,
        'sex', 'female',
        'chief_complaint', 'Fever and confusion',
        'vital_signs', jsonb_build_object(
          'bp', '82/50',
          'hr', 125,
          'rr', 28,
          'temp', 102.8,
          'spo2', 88
        )
      ),
      'presentation', 'Patient brought in by family with 3 days of cough, fever, and progressive confusion. History of COPD and diabetes. On exam: lethargic, decreased breath sounds right lower lobe, cool extremities.',
      'learning_objectives', jsonb_build_array(
        'Recognize septic shock',
        'Apply Surviving Sepsis Campaign guidelines',
        'Initiate early antibiotics and fluid resuscitation',
        'Consider vasopressor support'
      ),
      'key_findings', jsonb_build_array(
        'Hypotension refractory to fluids',
        'Elevated lactate (4.2)',
        'Right lower lobe infiltrate on CXR',
        'WBC 18,000'
      )
    ),
    v_educator_id,
    true,
    true
  ),

  -- Case 3: Stroke
  (
    v_institution_id,
    'Acute Ischemic Stroke - tPA Candidate',
    'A 65-year-old male with sudden onset right-sided weakness and aphasia. Evaluate for thrombolytic therapy.',
    'advanced',
    'Emergency Medicine',
    30,
    jsonb_build_object(
      'patient', jsonb_build_object(
        'age', 65,
        'sex', 'male',
        'chief_complaint', 'Sudden weakness',
        'vital_signs', jsonb_build_object(
          'bp', '185/105',
          'hr', 88,
          'rr', 16,
          'temp', 98.2,
          'spo2', 98
        )
      ),
      'presentation', 'Wife reports patient was fine at breakfast, then suddenly developed right arm weakness and difficulty speaking 45 minutes ago. No trauma. Takes aspirin daily for CAD. No history of bleeding disorders.',
      'learning_objectives', jsonb_build_array(
        'Perform rapid stroke assessment (NIHSS)',
        'Determine tPA eligibility',
        'Manage blood pressure in acute stroke',
        'Coordinate with neurology and radiology'
      ),
      'key_findings', jsonb_build_array(
        'NIHSS score 12',
        'Last known well 45 minutes ago',
        'CT head negative for hemorrhage',
        'No contraindications to tPA'
      )
    ),
    v_educator_id,
    true,
    true
  ),

  -- Case 4: Trauma
  (
    v_institution_id,
    'Multi-System Trauma - MVA',
    'A 28-year-old male involved in high-speed motor vehicle collision. Apply ATLS principles to manage polytrauma patient.',
    'advanced',
    'Emergency Medicine',
    60,
    jsonb_build_object(
      'patient', jsonb_build_object(
        'age', 28,
        'sex', 'male',
        'chief_complaint', 'Motor vehicle collision',
        'vital_signs', jsonb_build_object(
          'bp', '90/60',
          'hr', 130,
          'rr', 24,
          'temp', 97.8,
          'spo2', 92
        )
      ),
      'presentation', 'Unrestrained driver in head-on collision at 55 mph. GCS 13 at scene. Airbag deployed. Steering wheel deformity. Prolonged extrication. Complains of chest and abdominal pain.',
      'learning_objectives', jsonb_build_array(
        'Apply ATLS primary survey',
        'Identify life-threatening injuries',
        'Manage hemorrhagic shock',
        'Coordinate trauma team activation'
      ),
      'key_findings', jsonb_build_array(
        'Hypotension and tachycardia',
        'Chest wall tenderness',
        'Abdominal distension',
        'FAST exam positive'
      )
    ),
    v_educator_id,
    true,
    true
  ),

  -- Case 5: Pediatric Respiratory Distress
  (
    v_institution_id,
    'Pediatric Asthma Exacerbation',
    'A 6-year-old with severe asthma exacerbation. Manage pediatric respiratory emergency.',
    'intermediate',
    'Emergency Medicine',
    30,
    jsonb_build_object(
      'patient', jsonb_build_object(
        'age', 6,
        'sex', 'female',
        'chief_complaint', 'Difficulty breathing',
        'vital_signs', jsonb_build_object(
          'bp', '95/60',
          'hr', 145,
          'rr', 42,
          'temp', 98.9,
          'spo2', 89
        )
      ),
      'presentation', 'Mother reports 2 days of URI symptoms, now with severe wheezing and increased work of breathing. Using accessory muscles. Speaks in single words. History of asthma with previous hospitalizations. Ran out of controller medication last week.',
      'learning_objectives', jsonb_build_array(
        'Assess severity of asthma exacerbation',
        'Initiate appropriate bronchodilator therapy',
        'Consider corticosteroids and magnesium',
        'Recognize need for ICU admission'
      ),
      'key_findings', jsonb_build_array(
        'Severe respiratory distress',
        'Poor air movement bilaterally',
        'Retractions and accessory muscle use',
        'Minimal response to initial albuterol'
      )
    ),
    v_educator_id,
    true,
    true
  ),

  -- Case 6: Abdominal Pain
  (
    v_institution_id,
    'Acute Appendicitis',
    'A 22-year-old female with right lower quadrant pain. Evaluate and diagnose acute appendicitis.',
    'beginner',
    'Emergency Medicine',
    20,
    jsonb_build_object(
      'patient', jsonb_build_object(
        'age', 22,
        'sex', 'female',
        'chief_complaint', 'Abdominal pain',
        'vital_signs', jsonb_build_object(
          'bp', '118/72',
          'hr', 95,
          'rr', 18,
          'temp', 100.8,
          'spo2', 99
        )
      ),
      'presentation', 'Patient reports 24 hours of periumbilical pain that has migrated to right lower quadrant. Associated with nausea and one episode of vomiting. Denies diarrhea. LMP 2 weeks ago. No vaginal discharge.',
      'learning_objectives', jsonb_build_array(
        'Perform focused abdominal examination',
        'Order appropriate imaging',
        'Differentiate appendicitis from other causes',
        'Consult surgery appropriately'
      ),
      'key_findings', jsonb_build_array(
        'McBurney point tenderness',
        'Positive Rovsing sign',
        'Leukocytosis (WBC 14,500)',
        'CT shows inflamed appendix'
      )
    ),
    v_educator_id,
    true,
    true
  ),

  -- Case 7: Altered Mental Status
  (
    v_institution_id,
    'Hypoglycemia in Diabetic Patient',
    'A 45-year-old diabetic found confused at home. Recognize and treat severe hypoglycemia.',
    'beginner',
    'Emergency Medicine',
    15,
    jsonb_build_object(
      'patient', jsonb_build_object(
        'age', 45,
        'sex', 'male',
        'chief_complaint', 'Confusion',
        'vital_signs', jsonb_build_object(
          'bp', '135/85',
          'hr', 110,
          'rr', 20,
          'temp', 98.4,
          'spo2', 99
        )
      ),
      'presentation', 'EMS called by family for confusion. Patient with Type 1 diabetes, takes insulin. Missed lunch. Found sweating and confused. No recent illness. Takes long-acting and rapid-acting insulin.',
      'learning_objectives', jsonb_build_array(
        'Recognize hypoglycemia presentation',
        'Check point-of-care glucose',
        'Administer appropriate treatment',
        'Educate patient on prevention'
      ),
      'key_findings', jsonb_build_array(
        'Glucose 32 mg/dL',
        'Diaphoresis and tachycardia',
        'Confusion resolves with treatment',
        'Insulin dosing error identified'
      )
    ),
    v_educator_id,
    true,
    true
  ),

  -- Case 8: Allergic Reaction
  (
    v_institution_id,
    'Anaphylaxis - Food Allergy',
    'A 19-year-old with severe allergic reaction after eating at a restaurant. Recognize and treat anaphylaxis.',
    'intermediate',
    'Emergency Medicine',
    20,
    jsonb_build_object(
      'patient', jsonb_build_object(
        'age', 19,
        'sex', 'female',
        'chief_complaint', 'Difficulty breathing and rash',
        'vital_signs', jsonb_build_object(
          'bp', '85/55',
          'hr', 125,
          'rr', 28,
          'temp', 98.6,
          'spo2', 90
        )
      ),
      'presentation', 'Patient ate at Thai restaurant 20 minutes ago. Known peanut allergy but was told dish was peanut-free. Developed lip swelling, throat tightness, and diffuse urticaria. Friend called 911. Patient appears anxious and has audible stridor.',
      'learning_objectives', jsonb_build_array(
        'Recognize anaphylaxis criteria',
        'Administer epinephrine promptly',
        'Provide supportive care',
        'Arrange observation period'
      ),
      'key_findings', jsonb_build_array(
        'Angioedema of lips and tongue',
        'Diffuse urticaria',
        'Hypotension and tachycardia',
        'Respiratory compromise with stridor'
      )
    ),
    v_educator_id,
    true,
    true
  );

  RAISE NOTICE '✅ Created 8 Emergency Medicine clinical cases';

END $$;

-- Verify the insert
SELECT 
  title,
  difficulty,
  estimated_duration_minutes,
  is_active
FROM public.clinical_cases
ORDER BY difficulty, title;


