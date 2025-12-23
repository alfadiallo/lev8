-- ============================================================================
-- Import MED-001 Vignette (Complete SQL Version)
-- This script imports the full MED-001 vignette with all data
-- Run this in Supabase SQL Editor after running seed scripts
-- ============================================================================

DO $$
DECLARE
  v_institution_id UUID := NULL; -- NULL = Global vignette (available to all institutions)
  v_vignette_id UUID;
  v_vignette_data JSONB;
BEGIN
  -- Vignettes are global (institution_id = NULL) so no need to check for health system
  -- This allows all users from all institutions to access MED-001

  -- Build complete vignette data (v2 structure)
  v_vignette_data := jsonb_build_object(
    'version', 2,
    'id', 'MED-001-adenosine-error-v1',
    'category', 'medical-error-disclosure',
    'subcategory', 'medication-error',
    'title', 'Disclosing a Medication Error: Adenosine Administration in VT',
    'shortTitle', 'Adenosine VT Error',
    'description', 'Practice disclosing a serious medication error where adenosine was given for ventricular tachycardia, resulting in cardiac arrest. Focus on honest disclosure, managing emotions, and rebuilding trust.',
    'difficulty', jsonb_build_array('beginner', 'intermediate', 'advanced'),
    'estimatedDuration', 15,
    'debriefDuration', 10,
    'totalSessionTime', 25,
    'learningObjectives', jsonb_build_array(
      jsonb_build_object('id', 'obj-1', 'category', 'Communication', 'objective', 'Deliver clear, honest error disclosure using appropriate language'),
      jsonb_build_object('id', 'obj-2', 'category', 'Emotional Intelligence', 'objective', 'Manage family emotional responses while maintaining composure'),
      jsonb_build_object('id', 'obj-3', 'category', 'Professionalism', 'objective', 'Accept responsibility appropriately without admitting legal liability'),
      jsonb_build_object('id', 'obj-4', 'category', 'Patient Safety', 'objective', 'Discuss system improvements to prevent future errors')
    ),
    'prerequisites', jsonb_build_array('basic-communication-skills', 'understanding-medical-errors'),
    'tags', jsonb_build_array('medical-error', 'disclosure', 'cardiac', 'emergency-medicine', 'medication-error', 'cardiac-arrest', 'difficult-conversations', 'family-communication', 'adenosine', 'ventricular-tachycardia'),
    'clinicalContext', jsonb_build_array('emergency-medicine', 'cardiology', 'critical-care', 'patient-safety'),
    'relatedVignettes', jsonb_build_array('MED-002-wrong-site-surgery-v1', 'UO-001-unexpected-arrest-v1'),
    'suggestedPreparation', jsonb_build_array('Review institution error disclosure policy', 'AHRQ CANDOR Toolkit basics', 'VT vs SVT differentiation review'),
    'createdDate', '2025-01-15',
    'lastModified', '2025-01-15',
    'authors', jsonb_build_array('Virtual Sim Team'),
    'reviewers', jsonb_build_array('Emergency Medicine Faculty'),
    'aiModel', 'gemini-1.5-pro',
    'responseStyle', 'conversational',
    'maxResponseLength', 150,
    'assessmentWeights', jsonb_build_object('empathy', 0.4, 'clarity', 0.3, 'accountability', 0.3),
    'passingScore', 0.7,
    'excellenceScore', 0.85,
    'completionCriteria', jsonb_build_object(
      'minimumDuration', 10,
      'phasesCompleted', jsonb_build_array('opening', 'disclosure', 'emotional_processing', 'next_steps'),
      'assessmentSubmitted', true
    ),
    'customizable', jsonb_build_object(
      'institutionPolicies', true,
      'localProtocols', true,
      'culturalAdaptation', true
    ),
    -- Clinical Data
    'clinicalData', jsonb_build_object(
      'patient', jsonb_build_object(
        'demographics', jsonb_build_object('age', 72, 'gender', 'male', 'identifier', 'Patient J.D.'),
        'medicalHistory', jsonb_build_array('dilated cardiomyopathy', 'hypertension', 'chronic systolic heart failure (EF 35%)', 'previous MI (2019)'),
        'presentation', jsonb_build_object(
          'chiefComplaint', 'palpitations and dizziness',
          'vitals', jsonb_build_object('hr', 180, 'bp', '90/60', 'rhythm', 'wide-complex tachycardia', 'spo2', '94% on room air', 'rr', 22, 'temp', '98.6°F'),
          'ekgFindings', jsonb_build_object('rate', 180, 'rhythm', 'regular wide-complex tachycardia', 'qrsWidth', '160ms', 'morphology', 'LBBB pattern')
        )
      ),
      'clinicalEvents', jsonb_build_object(
        'initialAssessment', jsonb_build_object('time', '14:00', 'findings', 'Alert but anxious, diaphoretic, speaking in short sentences'),
        'misdiagnosis', jsonb_build_object('time', '14:15', 'error', 'Misinterpreted as SVT with aberrancy', 'reasoning', 'Regular rhythm, patient hemodynamically stable', 'actualDiagnosis', 'Ventricular tachycardia'),
        'intervention', jsonb_build_object('time', '14:15', 'medication', 'adenosine 6mg IV push', 'route', 'right antecubital IV', 'flush', '20mL normal saline rapid flush'),
        'complication', jsonb_build_object('time', '14:16', 'event', 'Degenerated to ventricular fibrillation', 'patientStatus', 'Loss of consciousness, pulseless'),
        'resuscitation', jsonb_build_object(
          'time', '14:16-14:22',
          'interventions', jsonb_build_array('CPR initiated immediately', 'Defibrillation 200J biphasic x2', 'Epinephrine 1mg IV x2', 'Amiodarone 300mg IV'),
          'outcome', 'ROSC achieved at 14:22'
        ),
        'currentStatus', jsonb_build_object(
          'time', '14:22',
          'location', 'Medical ICU',
          'condition', 'Intubated and sedated',
          'vitals', 'Stable on norepinephrine drip',
          'neuroStatus', 'Following commands when sedation lightened',
          'prognosis', 'Guarded but showing signs of neurological recovery'
        )
      ),
      'timeline', jsonb_build_array(
        jsonb_build_object('time', '0 min', 'event', 'Patient presents to ED with palpitations'),
        jsonb_build_object('time', '10 min', 'event', 'IV access obtained, initial labs drawn'),
        jsonb_build_object('time', '14 min', 'event', '12-lead EKG shows wide-complex tachycardia'),
        jsonb_build_object('time', '15 min', 'event', 'Decision made to give adenosine for presumed SVT'),
        jsonb_build_object('time', '15 min 30 sec', 'event', 'Adenosine 6mg administered'),
        jsonb_build_object('time', '16 min', 'event', 'Patient develops VF arrest'),
        jsonb_build_object('time', '16-22 min', 'event', 'ACLS protocol, CPR, defibrillation x2'),
        jsonb_build_object('time', '22 min', 'event', 'ROSC achieved'),
        jsonb_build_object('time', '30 min', 'event', 'Post-arrest care initiated, cooling protocol'),
        jsonb_build_object('time', '45 min', 'event', 'Transferred to ICU'),
        jsonb_build_object('time', '2 hours', 'event', 'Family arrives, needs disclosure')
      ),
      'errorAnalysis', jsonb_build_object(
        'category', 'Diagnostic error leading to inappropriate treatment',
        'severity', 'Category D - Error reached patient and required intervention',
        'preventability', 'Preventable with proper EKG interpretation',
        'contributingFactors', jsonb_build_array('Time pressure in busy ED', 'Cognitive bias (anchoring on SVT diagnosis)', 'Inadequate evaluation of QRS morphology', 'No senior consultation before treatment')
      ),
      'teachingPoints', jsonb_build_object(
        'clinical', jsonb_build_array('VT vs SVT with aberrancy differentiation', 'Adenosine contraindications in wide-complex tachycardia', 'Importance of systematic EKG interpretation', 'When to consult cardiology before treatment'),
        'communication', jsonb_build_array('Timely and honest error disclosure', 'Managing family emotions during crisis', 'Rebuilding trust after medical error', 'Balancing honesty with hope'),
        'systems', jsonb_build_array('Importance of cognitive timeouts', 'Value of senior consultation', 'Error reporting and system improvement', 'Supporting staff after adverse events')
      )
    ),
    -- Avatar Profiles (simplified for SQL)
    'avatars', jsonb_build_object(
      'primaryAvatar', jsonb_build_object(
        'spouse', jsonb_build_object(
          'identity', jsonb_build_object('name', 'Margaret', 'age', 68, 'relationship', 'spouse of 45 years', 'occupation', 'retired elementary school teacher'),
          'psychology', jsonb_build_object(
            'basePersonality', 'Caring educator who values clear communication and honesty',
            'medicalKnowledge', 'Limited medical knowledge, relies heavily on trust in healthcare providers',
            'personalityTraits', jsonb_build_array('Detail-oriented from years of teaching', 'Protective of her husband', 'Values competence and professionalism', 'Becomes assertive when anxious')
          ),
          'communicationStyle', jsonb_build_object(
            'vocabulary', 'Educated but not medical',
            'speechPatterns', jsonb_build_object(
              'calm', 'Measured, thoughtful questions',
              'stressed', 'Rapid-fire questions, interrupting',
              'angry', 'Sharp, accusatory statements'
            )
          )
        )
      )
    ),
    -- Conversation Design (simplified - full structure is complex)
    'conversation', jsonb_build_object(
      'conversationMetadata', jsonb_build_object(
        'expectedDuration', 15,
        'settingDescription', 'Private family conference room near ICU',
        'participantPositioning', 'Seated at round table, doctor across from family',
        'emotionalArc', 'Shock → Anger → Questioning → Processing → Next steps'
      ),
      'phases', jsonb_build_array(
        jsonb_build_object(
          'id', 'preparation',
          'name', 'Pre-Conversation Preparation',
          'duration', 'Before family arrives',
          'objective', 'Learner prepares mentally and reviews facts'
        ),
        jsonb_build_object(
          'id', 'opening',
          'name', 'Initial Contact',
          'duration', '0-3 minutes',
          'objective', 'Establish setting and prepare for disclosure',
          'avatarState', jsonb_build_object(
            'emotional', 'anxious',
            'expectations', 'Wants immediate information',
            'openingLine', 'Doctor? The nurse said you needed to speak with me about my husband. Is everything okay? He seemed stable when I left last night.'
          )
        ),
        jsonb_build_object(
          'id', 'disclosure',
          'name', 'Error Disclosure',
          'duration', '3-7 minutes',
          'objective', 'Deliver error information clearly and honestly',
          'criticalPhase', true
        ),
        jsonb_build_object(
          'id', 'emotional_processing',
          'name', 'Managing Emotional Response',
          'duration', '7-11 minutes',
          'objective', 'Support family through emotional reaction'
        ),
        jsonb_build_object(
          'id', 'clinical_questions',
          'name', 'Detailed Questions Phase',
          'duration', '11-13 minutes',
          'objective', 'Address specific concerns and questions'
        ),
        jsonb_build_object(
          'id', 'next_steps',
          'name', 'Planning and Closure',
          'duration', '13-15 minutes',
          'objective', 'Establish path forward'
        )
      ),
      'conversationMechanics', jsonb_build_object(
        'emotionalTracking', jsonb_build_object(
          'method', 'continuous',
          'scale', jsonb_build_object(
            'min', 0,
            'max', 1,
            'thresholds', jsonb_build_object('concerned', 0.3, 'upset', 0.5, 'angry', 0.7, 'hostile', 0.9)
          )
        )
      ),
      'assessmentHooks', jsonb_build_object(
        'empathy', jsonb_build_object(
          'semantic', true,
          'patterns', jsonb_build_array('emotional acknowledgment', 'validation phrases', 'reflective listening', 'genuine concern expression'),
          'antiPatterns', jsonb_build_array('minimizing emotions', 'rushing through feelings', 'false reassurance'),
          'weight', 0.4
        ),
        'clarity', jsonb_build_object(
          'semantic', true,
          'patterns', jsonb_build_array('plain language usage', 'structured explanation', 'checking understanding', 'appropriate detail level'),
          'antiPatterns', jsonb_build_array('medical jargon', 'vague explanations', 'information overload'),
          'weight', 0.3
        ),
        'accountability', jsonb_build_object(
          'semantic', true,
          'patterns', jsonb_build_array('clear responsibility acceptance', 'system improvement discussion', 'no blame shifting', 'honest disclosure'),
          'antiPatterns', jsonb_build_array('defensive responses', 'excuse making', 'minimizing error'),
          'weight', 0.3
        )
      )
    )
  );

  -- Check if vignette already exists (by title and category, since it's global)
  SELECT id INTO v_vignette_id
  FROM public.vignettes
  WHERE institution_id IS NULL
    AND title = 'Disclosing a Medication Error: Adenosine Administration in VT'
    AND category = 'medical-error-disclosure';

  IF v_vignette_id IS NULL THEN
    -- Insert new vignette
    INSERT INTO public.vignettes (
      institution_id,
      title,
      description,
      category,
      subcategory,
      difficulty,
      estimated_duration_minutes,
      vignette_data,
      is_public,
      is_active
    ) VALUES (
      v_institution_id,
      'Disclosing a Medication Error: Adenosine Administration in VT',
      'Practice disclosing a serious medication error where adenosine was given for ventricular tachycardia, resulting in cardiac arrest. Focus on honest disclosure, managing emotions, and rebuilding trust.',
      'MED',
      'medication-error',
      ARRAY['beginner', 'intermediate', 'advanced']::varchar[],
      15,
      v_vignette_data,
      false,
      true
    )
    RETURNING id INTO v_vignette_id;
    
    RAISE NOTICE '✅ MED-001 vignette created with ID: %', v_vignette_id;
  ELSE
    -- Update existing vignette
    UPDATE public.vignettes
    SET 
      description = 'Practice disclosing a serious medication error where adenosine was given for ventricular tachycardia, resulting in cardiac arrest. Focus on honest disclosure, managing emotions, and rebuilding trust.',
      difficulty = ARRAY['beginner', 'intermediate', 'advanced']::varchar[],
      estimated_duration_minutes = 15,
      vignette_data = v_vignette_data,
      is_active = true,
      updated_at = now()
    WHERE id = v_vignette_id;
    
    RAISE NOTICE '✅ MED-001 vignette updated (ID: %)', v_vignette_id;
  END IF;

END $$;

-- Verify the import
SELECT 
  '✅ MED-001 Import Complete!' as status,
  id,
  title,
  category,
  subcategory,
  difficulty,
  is_active,
  (vignette_data->>'version')::text as version,
  created_at
FROM public.vignettes
WHERE title = 'Disclosing a Medication Error: Adenosine Administration in VT'
AND category = 'MED';

