-- ============================================================================
-- SEED: EMERGENCY MEDICINE 18-MONTH CURRICULUM
-- Based on 2022 Model of Clinical Practice of Emergency Medicine
-- Tintinalli's Emergency Medicine 9th Edition
-- ============================================================================

-- Insert the EM curriculum
INSERT INTO public.specialty_curricula (
    specialty,
    name,
    version,
    total_months,
    description,
    source_reference,
    is_active
) VALUES (
    'emergency_medicine',
    '18-Month EM Didactic Curriculum',
    'v3',
    18,
    'Spiral curriculum covering 12 modules across 18 months. Months 1-12: Primary Cycle (foundational). Months 13-18: Mastery Cycle (integration and review).',
    'Based on 2022 Model of Clinical Practice of Emergency Medicine, Tintinalli''s Emergency Medicine 9th Edition',
    true
) ON CONFLICT (specialty, version) DO NOTHING;

-- Get the curriculum ID for foreign key references
DO $$
DECLARE
    v_curriculum_id UUID;
BEGIN
    SELECT id INTO v_curriculum_id 
    FROM public.specialty_curricula 
    WHERE specialty = 'emergency_medicine' AND version = 'v3';

    -- ========================================================================
    -- MONTH 1: Resuscitation & Acute Signs/Symptoms
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 1, 1, 'Resuscitation & Acute Signs/Symptoms', 
     'Approach to the critically ill patient; ABCDE framework; Shock physiology',
     ARRAY['Ch 11 Sudden Cardiac Death', 'Ch 12 Approach to Nontraumatic Shock', 'Ch 13 Approach to Traumatic Shock'],
     ARRAY['Shock', 'Sepsis'],
     'Introduction to POCUS; Machine orientation',
     'BLS/ACLS review; IO placement',
     'Journal Club'),
    
    (v_curriculum_id, 1, 2, 'Resuscitation & Acute Signs/Symptoms',
     'Abnormal vital signs: Fever workup, Hypothermia management, Hypotension algorithms',
     ARRAY['Ch 151 Sepsis', 'Ch 209 Hypothermia', 'Ch 119 Fever and Serious Bacterial Illness'],
     ARRAY['Sepsis', 'Hypothermia'],
     'IVC assessment for volume status',
     'Airway station: BVM, OPA/NPA',
     'M&M'),
    
    (v_curriculum_id, 1, 3, 'Resuscitation & Acute Signs/Symptoms',
     'Altered mental status: Differential diagnosis, AEIOU-TIPS, Toxicologic vs metabolic',
     ARRAY['Ch 168 Altered Mental Status and Coma', 'Ch 140 Altered Mental Status in Children', 'Ch 176 General Management of Poisoned Patients'],
     ARRAY['Altered Mental Status', 'Toxicology'],
     'Ocular ultrasound: Pupil reactivity, ONSD',
     'RSI simulation; Direct laryngoscopy',
     'Case Conference'),
    
    (v_curriculum_id, 1, 4, 'Resuscitation & Acute Signs/Symptoms',
     'Dyspnea: Critical causes, BiPAP/CPAP indications, When to intubate',
     ARRAY['Ch 62 Respiratory Distress', 'Ch 28 Noninvasive Airway Management', 'Ch 29A Tracheal Intubation', 'Ch 29B Mechanical Ventilation'],
     ARRAY['Respiratory Emergencies', 'Airway'],
     'Lung ultrasound basics: A-lines, B-lines',
     'Video laryngoscopy; Surgical airway',
     'QI')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- MONTH 2: Cardiovascular Disorders
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 2, 1, 'Cardiovascular Disorders',
     'Cardiopulmonary arrest: ACLS algorithms, Hs and Ts, Post-ROSC care',
     ARRAY['Ch 11 Sudden Cardiac Death', 'Ch 22 Basic CPR', 'Ch 24 Cardiac Resuscitation', 'Ch 26 Post-Cardiac Arrest Syndrome'],
     ARRAY['Cardiac Arrest', 'ACLS'],
     'Cardiac ultrasound: Subxiphoid view for activity',
     'Megacode simulation',
     'Journal Club'),
    
    (v_curriculum_id, 2, 2, 'Cardiovascular Disorders',
     'Dysrhythmias I: Narrow complex tachycardias, Rate vs rhythm control',
     ARRAY['Ch 18 Cardiac Rhythm Disturbances', 'Ch 19 Pharmacology of Antiarrhythmics'],
     ARRAY['Dysrhythmias', 'SVT'],
     'Cardiac ultrasound: Parasternal long axis (PLAX)',
     'Synchronized cardioversion; Adenosine push',
     'ECG Workshop'),
    
    (v_curriculum_id, 2, 3, 'Cardiovascular Disorders',
     'Dysrhythmias II: Wide complex tachycardias, Bradycardia, Pacing indications',
     ARRAY['Ch 18 Cardiac Rhythm Disturbances', 'Ch 33 Cardiac Pacing and Implanted Defibrillation'],
     ARRAY['VTach', 'Bradycardia', 'Pacemakers'],
     'Cardiac ultrasound: Parasternal short axis (PSAX)',
     'Transcutaneous and transvenous pacing setup',
     'M&M'),
    
    (v_curriculum_id, 2, 4, 'Cardiovascular Disorders',
     'ACS/STEMI: Risk stratification, Reperfusion strategies, Cardiogenic shock',
     ARRAY['Ch 48 Chest Pain', 'Ch 49 Acute Coronary Syndromes', 'Ch 50 Cardiogenic Shock', 'Ch 51 Low-Probability ACS'],
     ARRAY['ACS', 'STEMI', 'Chest Pain'],
     'Cardiac ultrasound: Apical 4-chamber, Global LV function',
     'Bedside cardiac ultrasound practice',
     'Case Conference')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- MONTH 3: CV II + Pulmonary Intro
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 3, 1, 'CV II + Pulmonary Intro',
     'Heart failure: Acute decompensated HF, Flash pulmonary edema, Cardiorenal syndrome',
     ARRAY['Ch 53 Acute Heart Failure', 'Ch 20 Pharmacology of Vasopressors and Inotropes'],
     ARRAY['Heart Failure', 'Pulmonary Edema'],
     'Cardiac: E-point septal separation (EPSS) for EF',
     'Pericardiocentesis (task trainer)',
     'Journal Club'),
    
    (v_curriculum_id, 3, 2, 'CV II + Pulmonary Intro',
     'Vascular emergencies: Aortic dissection, AAA, Acute limb ischemia',
     ARRAY['Ch 59 Aortic Dissection and Related Syndromes', 'Ch 60 Aneurysmal Disease', 'Ch 61 Arterial Occlusion'],
     ARRAY['Aortic Emergencies', 'Vascular'],
     'Aortic ultrasound: Abdominal aorta measurement',
     'Aortic ultrasound for AAA',
     'M&M'),
    
    (v_curriculum_id, 3, 3, 'CV II + Pulmonary Intro',
     'Acute airway disorders: Epiglottitis, Angioedema, Foreign body',
     ARRAY['Ch 246 Neck and Upper Airway', 'Ch 126 Stridor and Drooling in Children', 'Ch 30 Surgical Airways'],
     ARRAY['Airway Emergencies', 'ENT'],
     'Airway ultrasound: Cricothyroid membrane ID',
     'Awake intubation discussion; Bougie use',
     'Case Conference'),
    
    (v_curriculum_id, 3, 4, 'CV II + Pulmonary Intro',
     'Pneumothorax: Spontaneous, Tension, Iatrogenic; Hemothorax',
     ARRAY['Ch 68 Pneumothorax', 'Ch 261 Pulmonary Trauma'],
     ARRAY['Pneumothorax', 'Thoracic Trauma'],
     'Thoracic ultrasound: Lung sliding, Lung point',
     'Thoracic ultrasound practice',
     'Simulation')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- MONTH 4: Pulmonary & Thoracic Disorders
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 4, 1, 'Pulmonary & Thoracic Disorders',
     'Asthma and COPD exacerbations: Severity scoring, Treatment escalation, NIV',
     ARRAY['Ch 69 Acute Asthma and Status Asthmaticus', 'Ch 70 COPD', 'Ch 127 Wheezing in Children'],
     ARRAY['Asthma', 'COPD'],
     'Lung US: B-line patterns, Pulmonary edema vs COPD',
     'Chest tube insertion (cadaver/sim)',
     'Journal Club'),
    
    (v_curriculum_id, 4, 2, 'Pulmonary & Thoracic Disorders',
     'Pulmonary embolism: Risk stratification (Wells, PERC, YEARS), Anticoagulation, Thrombolytics',
     ARRAY['Ch 56 Venous Thromboembolism Including PE', 'Ch 239 Thrombotics and Antithrombotics'],
     ARRAY['PE', 'DVT', 'Anticoagulation'],
     'DVT ultrasound: Compression technique, Femoral/popliteal',
     'Thoracentesis (ultrasound-guided)',
     'Case Conference'),
    
    (v_curriculum_id, 4, 3, 'Pulmonary & Thoracic Disorders',
     'Pneumonia: CAP, HAP, Aspiration; Sepsis bundles',
     ARRAY['Ch 65 Community-Acquired Pneumonia', 'Ch 128 Pneumonia in Children', 'Ch 151 Sepsis'],
     ARRAY['Pneumonia', 'Sepsis'],
     'Lung US: Consolidation, Hepatization, Air bronchograms',
     'Pleural ultrasound: Effusion quantification',
     'M&M'),
    
    (v_curriculum_id, 4, 4, 'Pulmonary & Thoracic Disorders',
     'Pleural disease: Empyema, Malignant effusion; Pulmonary hypertension emergencies',
     ARRAY['Ch 66 Lung Empyema and Abscess', 'Ch 58 Pulmonary Hypertension', 'Ch 63 Hemoptysis'],
     ARRAY['Pleural Effusion', 'Pulmonary HTN'],
     'Pleural US: Effusion characterization, Thoracentesis marking',
     'Integrated thoracic POCUS exam',
     'QI')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- MONTH 5: Abdominal & Gastroenterology
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 5, 1, 'Abdominal & Gastroenterology',
     'Acute abdominal pain: Systematic approach, Surgical vs medical, Pediatric considerations',
     ARRAY['Ch 71 Acute Abdominal Pain', 'Ch 133 Acute Abdominal Pain in Children'],
     ARRAY['Abdominal Pain', 'Surgical Abdomen'],
     'Abdominal ultrasound overview: Systematic approach',
     'NG tube placement',
     'Case Conference'),
    
    (v_curriculum_id, 5, 2, 'Abdominal & Gastroenterology',
     'Upper GI emergencies: Esophageal perforation, Boerhaave, Variceal bleeding, PUD',
     ARRAY['Ch 75 Upper GI Bleeding', 'Ch 77 Esophageal Emergencies', 'Ch 78 Peptic Ulcer Disease'],
     ARRAY['GI Bleeding', 'Esophageal Emergencies'],
     'RUQ ultrasound: Gallbladder anatomy, Wall measurement',
     'Biliary US: Gallbladder, CBD measurement',
     'Journal Club'),
    
    (v_curriculum_id, 5, 3, 'Abdominal & Gastroenterology',
     'Lower GI emergencies: Appendicitis, Diverticulitis, Bowel obstruction, Volvulus',
     ARRAY['Ch 76 Lower GI Bleeding', 'Ch 81 Acute Appendicitis', 'Ch 82 Diverticulitis', 'Ch 83 Bowel Obstruction'],
     ARRAY['Appendicitis', 'Bowel Obstruction', 'Diverticulitis'],
     'Bowel US: SBO findings, Free fluid assessment',
     'Bowel ultrasound: SBO findings',
     'M&M'),
    
    (v_curriculum_id, 5, 4, 'Abdominal & Gastroenterology',
     'Hepatobiliary emergencies: Cholecystitis, Cholangitis, Hepatic failure, Ascites',
     ARRAY['Ch 79 Pancreatitis and Cholecystitis', 'Ch 80 Hepatic Disorders', 'Ch 84 Hernias'],
     ARRAY['Biliary Disease', 'Liver Emergencies'],
     'RUQ: Sonographic Murphys, CBD dilation, Pericholecystic fluid',
     'Paracentesis (ultrasound-guided)',
     'Simulation')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- MONTH 6: Trauma I
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 6, 1, 'Trauma I',
     'Primary and secondary survey; Trauma team activation; ATLS principles',
     ARRAY['Ch 254 Trauma in Adults', 'Ch 110 Pediatric Trauma', 'Ch 255 Trauma in the Elderly'],
     ARRAY['Trauma', 'ATLS'],
     'FAST exam: All four views introduction',
     'FAST exam: All four views',
     'Trauma M&M'),
    
    (v_curriculum_id, 6, 2, 'Trauma I',
     'Head trauma: TBI classification, ICP management, Herniation syndromes',
     ARRAY['Ch 257 Head Trauma', 'Ch 111 Minor Head Injury and Concussion in Children'],
     ARRAY['Head Trauma', 'TBI'],
     'Ocular ultrasound: ONSD for ICP',
     'eFAST: Adding thoracic views',
     'Journal Club'),
    
    (v_curriculum_id, 6, 3, 'Trauma I',
     'Spine trauma: Clearance protocols, Spinal cord injury, Neurogenic shock',
     ARRAY['Ch 258 Spine Trauma', 'Ch 112 Cervical Spine Injury in Children'],
     ARRAY['Spine Trauma', 'Spinal Cord Injury'],
     'FAST review: RUQ (Morison pouch) technique',
     'C-spine immobilization; Log roll',
     'Case Conference'),
    
    (v_curriculum_id, 6, 4, 'Trauma I',
     'Thoracic trauma: Rib fractures, Flail chest, Pulmonary contusion, Cardiac injury',
     ARRAY['Ch 261 Pulmonary Trauma', 'Ch 262 Cardiac Trauma'],
     ARRAY['Chest Trauma', 'Cardiac Trauma'],
     'eFAST: Pneumothorax detection, Hemothorax',
     'Chest tube in trauma; Autotransfusion',
     'Simulation')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- MONTHS 7-18: Additional curriculum (abbreviated for brevity)
    -- Full implementation would include all 18 months
    -- ========================================================================
    
    -- Month 7: Trauma II + Environmental
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 7, 1, 'Trauma II + Environmental', 'Abdominal trauma: Solid organ injury, Hollow viscus, Pelvic fractures', ARRAY['Ch 263 Abdominal Trauma', 'Ch 264 Trauma to Flank/Buttocks', 'Ch 272 Pelvis Injuries'], ARRAY['Abdominal Trauma', 'Pelvic Fractures'], 'FAST: LUQ (perisplenic), Pelvic views', 'DPL discussion; Pelvic binder', 'Case Conference'),
    (v_curriculum_id, 7, 2, 'Trauma II + Environmental', 'Burns: Classification, Fluid resuscitation, Airway considerations, Escharotomy', ARRAY['Ch 217 Thermal Burns', 'Ch 218 Chemical Burns', 'Ch 219 Electrical/Lightning Injuries'], ARRAY['Burns', 'Electrical Injuries'], 'Airway ultrasound review', 'Wound debridement; Escharotomy demo', 'M&M'),
    (v_curriculum_id, 7, 3, 'Trauma II + Environmental', 'Heat illness: Heat stroke, Exertional heat injury, Cooling methods', ARRAY['Ch 210 Heat Emergencies'], ARRAY['Heat Emergencies'], 'IVC assessment: Volume status in heat illness', 'Cooling simulation', 'Journal Club'),
    (v_curriculum_id, 7, 4, 'Trauma II + Environmental', 'Cold illness and dysbarism: Hypothermia, Frostbite, DCS, AGE', ARRAY['Ch 208 Cold Injuries', 'Ch 209 Hypothermia', 'Ch 214 Diving Disorders', 'Ch 215 Drowning'], ARRAY['Hypothermia', 'Frostbite', 'Diving Emergencies'], 'Cardiac ultrasound: Hypothermic heart assessment', 'Rewarming protocols', 'Case Conference')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- Month 8: Orthopedics & Musculoskeletal
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 8, 1, 'Orthopedics & Musculoskeletal', 'Upper extremity fractures: Shoulder, Elbow, Wrist, Hand', ARRAY['Ch 267 Initial Evaluation', 'Ch 268-271 Hand/Wrist/Elbow/Shoulder'], ARRAY['Upper Extremity Fractures'], 'MSK ultrasound: Long bone fracture detection', 'Shoulder reduction techniques', 'Radiology Rounds'),
    (v_curriculum_id, 8, 2, 'Orthopedics & Musculoskeletal', 'Lower extremity fractures: Hip, Knee, Ankle; Pediatric (Salter-Harris)', ARRAY['Ch 273-277 Hip/Knee/Leg/Ankle/Foot', 'Ch 141 Pediatric Orthopedic Emergencies'], ARRAY['Lower Extremity Fractures', 'Pediatric Ortho'], 'MSK ultrasound: Hip effusion, Knee effusion', 'Hip reduction; Knee aspiration', 'M&M'),
    (v_curriculum_id, 8, 3, 'Orthopedics & Musculoskeletal', 'Dislocations: Shoulder, Elbow, Hip, Patella', ARRAY['Ch 37 Procedural Sedation', 'Ch 267', 'Ch 271', 'Ch 273'], ARRAY['Dislocations', 'Procedural Sedation'], 'MSK ultrasound: Shoulder dislocation confirmation', 'Procedural sedation; Multiple reduction techniques', 'Simulation'),
    (v_curriculum_id, 8, 4, 'Orthopedics & Musculoskeletal', 'Compartment syndrome, Rhabdomyolysis, Open fractures', ARRAY['Ch 278 Compartment Syndrome', 'Ch 89 Rhabdomyolysis', 'Ch 266 Trauma to Extremities'], ARRAY['Compartment Syndrome', 'Rhabdomyolysis'], 'Soft tissue ultrasound: Foreign body detection', 'Compartment pressure measurement; Splinting lab', 'Case Conference')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- MONTH 9: Cutaneous + Neurology I
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 9, 1, 'Cutaneous + Neurology I', 'Skin infections: Cellulitis, Abscess, Necrotizing fasciitis', ARRAY['Ch 152 Soft Tissue Infections', 'Ch 248 Initial Evaluation of Skin Disorders'], ARRAY['Soft Tissue Infections', 'NecFasc'], 'Soft tissue US: Abscess vs cellulitis, Cobblestoning', 'I&D workshop; Wound packing', 'Journal Club'),
    (v_curriculum_id, 9, 2, 'Cutaneous + Neurology I', 'Dermatologic emergencies: SJS/TEN, DRESS, Erythroderma', ARRAY['Ch 249 Generalized Skin Disorders', 'Ch 142 Rashes in Children'], ARRAY['Dermatologic Emergencies'], 'Soft tissue: Necrotizing fasciitis findings', 'Wound closure techniques', 'M&M'),
    (v_curriculum_id, 9, 3, 'Cutaneous + Neurology I', 'Stroke: Ischemic stroke, tPA criteria, Thrombectomy, Hemorrhagic stroke', ARRAY['Ch 167 Stroke Syndromes', 'Ch 166 Spontaneous SAH and Intracerebral Hemorrhage'], ARRAY['Stroke', 'tPA', 'Hemorrhagic Stroke'], 'Transcranial Doppler: Introduction (if available)', 'NIH Stroke Scale practice', 'Simulation'),
    (v_curriculum_id, 9, 4, 'Cutaneous + Neurology I', 'Seizures: Status epilepticus, First-time seizure, Eclampsia', ARRAY['Ch 171 Seizures and Status Epilepticus', 'Ch 138 Seizures in Children', 'Ch 100 Maternal Emergencies'], ARRAY['Seizures', 'Status Epilepticus'], 'Ocular ultrasound review: Papilledema detection', 'Benzodiazepine dosing; Airway in seizure', 'Case Conference')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- MONTH 10: Neurology II + Psychiatry
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 10, 1, 'Neurology II + Psychiatry', 'Headache emergencies: SAH, Meningitis, CVT, Temporal arteritis', ARRAY['Ch 165 Headache', 'Ch 166 Spontaneous SAH', 'Ch 139 Headache in Children'], ARRAY['Headache', 'SAH', 'Meningitis'], 'Ocular ultrasound: ONSD for elevated ICP', 'Lumbar puncture (sim and live)', 'Journal Club'),
    (v_curriculum_id, 10, 2, 'Neurology II + Psychiatry', 'CNS infections: Meningitis, Encephalitis, Brain abscess', ARRAY['Ch 174 CNS and Spinal Infections', 'Ch 120 Meningitis in Children', 'Ch 175 CNS Procedures'], ARRAY['Meningitis', 'Encephalitis'], 'LP ultrasound: Spine landmark identification', 'LP interpretation workshop', 'M&M'),
    (v_curriculum_id, 10, 3, 'Neurology II + Psychiatry', 'Psychiatric emergencies: Acute agitation, Psychosis, Excited delirium', ARRAY['Ch 286 Mental Health Disorders', 'Ch 287 Acute Agitation', 'Ch 290 Psychoses'], ARRAY['Psychiatric Emergencies', 'Agitation'], 'Review: Ruling out medical causes with POCUS', 'Verbal de-escalation; Safe restraint application', 'Case Conference'),
    (v_curriculum_id, 10, 4, 'Neurology II + Psychiatry', 'Mood disorders, Suicide risk assessment, Substance use emergencies', ARRAY['Ch 289 Mood and Anxiety Disorders', 'Ch 292 Substance Use Disorders', 'Ch 149 Behavioral Disorders in Children'], ARRAY['Suicide Risk', 'Substance Abuse'], 'Ultrasound portfolio review: Core competencies check', 'Columbia Suicide Severity Rating Scale', 'Ethics Discussion')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- MONTH 11: OB/GYN + Renal/GU
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 11, 1, 'OB/GYN + Renal/GU', 'First trimester emergencies: Ectopic pregnancy, Miscarriage, Hyperemesis', ARRAY['Ch 98 Ectopic Pregnancy', 'Ch 72 Nausea and Vomiting', 'Ch 96 Abnormal Uterine Bleeding'], ARRAY['Ectopic Pregnancy', 'Early Pregnancy'], 'Pelvic ultrasound: Transabdominal IUP identification', 'Pelvic ultrasound: IUP, Fetal heart rate', 'Case Conference'),
    (v_curriculum_id, 11, 2, 'OB/GYN + Renal/GU', 'Third trimester and peripartum: Pre-eclampsia/Eclampsia, Abruption, Cord prolapse', ARRAY['Ch 100 Maternal Emergencies After 20 Weeks', 'Ch 101 Emergency Delivery', 'Ch 25 Resuscitation in Pregnancy'], ARRAY['Pre-eclampsia', 'Emergency Delivery'], 'OB ultrasound: Fetal heart rate, Presentation assessment', 'Precipitous delivery simulation', 'M&M'),
    (v_curriculum_id, 11, 3, 'OB/GYN + Renal/GU', 'Renal emergencies: AKI, Hyperkalemia, Dialysis emergencies', ARRAY['Ch 88 Acute Kidney Injury', 'Ch 90 End-Stage Renal Disease', 'Ch 17 Fluids and Electrolytes'], ARRAY['Renal Failure', 'Hyperkalemia', 'Dialysis'], 'Renal ultrasound: Hydronephrosis grading', 'Bladder ultrasound; Foley placement', 'Journal Club'),
    (v_curriculum_id, 11, 4, 'OB/GYN + Renal/GU', 'GU emergencies: Testicular torsion, Priapism, Paraphimosis, UTI/Pyelo', ARRAY['Ch 93 Male Genital Problems', 'Ch 94 Urologic Stone Disease', 'Ch 91 UTI and Hematuria', 'Ch 136 Pediatric Urologic/Gyn'], ARRAY['Testicular Torsion', 'UTI', 'Kidney Stones'], 'Testicular ultrasound: Color Doppler for torsion', 'Testicular ultrasound; Dorsal slit discussion', 'Simulation')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- MONTH 12: Pediatrics + HEENT
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 12, 1, 'Pediatrics + HEENT', 'Pediatric resuscitation: PALS, Neonatal resuscitation, Sepsis', ARRAY['Ch 108 Resuscitation of Neonates', 'Ch 109 Resuscitation of Children', 'Ch 119 Fever and Serious Bacterial Illness'], ARRAY['Pediatric Resuscitation', 'PALS'], 'Pediatric ultrasound: Size/depth adjustments, Probes', 'Pediatric megacode', 'Journal Club'),
    (v_curriculum_id, 12, 2, 'Pediatrics + HEENT', 'Pediatric emergencies: Croup, Bronchiolitis, Intussusception, Pyloric stenosis', ARRAY['Ch 126 Stridor and Drooling', 'Ch 127 Wheezing', 'Ch 133 Acute Abdominal Pain in Children', 'Ch 116 Neonatal Emergencies'], ARRAY['Pediatric Respiratory', 'Pediatric GI'], 'Pediatric abdominal: Pyloric stenosis, Intussusception', 'Pediatric IV/IO placement', 'M&M'),
    (v_curriculum_id, 12, 3, 'Pediatrics + HEENT', 'Eye emergencies: Acute vision loss, Globe rupture, Retinal detachment', ARRAY['Ch 241 Eye Emergencies', 'Ch 122 Eye Emergencies in Children'], ARRAY['Eye Emergencies', 'Ophthalmology'], 'Ocular US: Retinal detachment, Vitreous hemorrhage, Lens dislocation', 'Slit lamp exam; Tonometry; Lateral canthotomy', 'Workshop'),
    (v_curriculum_id, 12, 4, 'Pediatrics + HEENT', 'ENT emergencies: Epistaxis, Peritonsillar abscess, FB removal', ARRAY['Ch 242 Ear Disorders', 'Ch 244 Nose and Sinuses', 'Ch 245 Oral and Dental', 'Ch 246 Neck and Upper Airway'], ARRAY['ENT Emergencies', 'Dental'], 'Soft tissue neck: Peritonsillar abscess localization', 'Epistaxis control; PTA drainage', 'Case Conference')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- PHASE 2: MASTERY CYCLE (Months 13-18)
    -- ========================================================================

    -- ========================================================================
    -- MONTH 13: Toxicology Deep Dive
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 13, 1, 'Toxicology Deep Dive', 'Toxidromes: Recognition and management; Decontamination principles', ARRAY['Ch 176 General Management of Poisoned Patients', 'Ch 202 Anticholinergics'], ARRAY['Toxidromes', 'Poisoning'], 'POCUS in toxicology: Cardiac effects, Bladder retention', 'Gastric lavage discussion; Whole bowel irrigation', 'Poison Control Integration'),
    (v_curriculum_id, 13, 2, 'Toxicology Deep Dive', 'Specific poisonings I: Acetaminophen, Salicylates, TCAs, Lithium', ARRAY['Ch 190 Acetaminophen', 'Ch 189 Salicylates', 'Ch 177 Cyclic Antidepressants', 'Ch 181 Lithium'], ARRAY['Acetaminophen', 'Salicylates', 'TCA OD'], 'Cardiac ultrasound: QRS widening correlates', 'NAC protocol; Lipid emulsion', 'Journal Club'),
    (v_curriculum_id, 13, 3, 'Toxicology Deep Dive', 'Specific poisonings II: Opioids, Sedative-hypnotics, Sympathomimetics', ARRAY['Ch 186 Opioids', 'Ch 183 Benzodiazepines', 'Ch 187 Cocaine and Amphetamines', 'Ch 182 Barbiturates'], ARRAY['Opioid OD', 'Stimulant Toxicity'], 'Lung ultrasound: Aspiration, ARDS patterns', 'Naloxone strategies; High-dose insulin', 'Case Conference'),
    (v_curriculum_id, 13, 4, 'Toxicology Deep Dive', 'Withdrawal syndromes: Alcohol, Benzodiazepine, Opioid; CIWA/COWS protocols', ARRAY['Ch 185 Alcohols', 'Ch 292 Substance Use Disorders', 'Ch 183 Benzodiazepines'], ARRAY['Alcohol Withdrawal', 'Opioid Withdrawal'], 'IVC/Cardiac: Volume assessment in withdrawal', 'Withdrawal management simulation', 'M&M')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- MONTH 14: Hematology/Oncology/Immune
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 14, 1, 'Hematology/Oncology/Immune', 'Hematologic emergencies: Sickle cell crisis, DIC, TTP/HUS', ARRAY['Ch 236 Sickle Cell Disease', 'Ch 233 Acquired Bleeding Disorders', 'Ch 237 Acquired Hemolytic Anemia', 'Ch 143 Sickle Cell in Children'], ARRAY['Sickle Cell', 'Coagulopathy'], 'Splenic ultrasound: Sequestration assessment', 'Blood product administration', 'Journal Club'),
    (v_curriculum_id, 14, 2, 'Hematology/Oncology/Immune', 'Oncologic emergencies: Febrile neutropenia, Tumor lysis, SVC syndrome, Spinal cord compression', ARRAY['Ch 240 Emergency Complications of Malignancy', 'Ch 145 Oncologic Emergencies in Children'], ARRAY['Oncologic Emergencies'], 'DVT ultrasound: Upper extremity technique', 'Central line discussion', 'M&M'),
    (v_curriculum_id, 14, 3, 'Hematology/Oncology/Immune', 'Anaphylaxis and allergic emergencies: Epinephrine dosing, Refractory anaphylaxis', ARRAY['Ch 14 Allergy and Anaphylaxis'], ARRAY['Anaphylaxis', 'Allergic Reactions'], 'Airway ultrasound: Angioedema assessment', 'Epi-pen training; Anaphylaxis simulation', 'Case Conference'),
    (v_curriculum_id, 14, 4, 'Hematology/Oncology/Immune', 'Transplant emergencies: Rejection, Infection in immunocompromised', ARRAY['Ch 297 The Transplant Patient', 'Ch 155 HIV Infection'], ARRAY['Transplant', 'Immunocompromised'], 'Renal transplant ultrasound: Doppler assessment', 'Integrated case: Undifferentiated sick patient', 'QI')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- MONTH 15: Administration & Systems-Based Practice
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 15, 1, 'Administration & Systems', 'EMTALA: Legal requirements, Transfers, On-call responsibilities', ARRAY['Ch 303 Legal Issues in Emergency Medicine'], ARRAY['EMTALA', 'Medicolegal'], 'Ultrasound documentation: Medical-legal considerations', 'Documentation workshop', 'Legal Case Review'),
    (v_curriculum_id, 15, 2, 'Administration & Systems', 'Risk management: Medical-legal pitfalls, Documentation, Malpractice prevention', ARRAY['Ch 303 Legal Issues in Emergency Medicine', 'Ch 27 Ethical Issues of Resuscitation'], ARRAY['Risk Management'], 'QA review: Ultrasound image quality assessment', 'Difficult conversation simulation', 'M&M'),
    (v_curriculum_id, 15, 3, 'Administration & Systems', 'Quality improvement: PDSA cycles, Metrics, Patient safety', ARRAY['Ch 1 Emergency Medical Services'], ARRAY['QI', 'Patient Safety'], 'Ultrasound QI project discussion', 'QI project presentations', 'Journal Club'),
    (v_curriculum_id, 15, 4, 'Administration & Systems', 'Mass casualty and disaster medicine: Triage, Surge capacity, Decontamination', ARRAY['Ch 5-10 Disaster Medicine'], ARRAY['Disaster Medicine', 'MCI'], 'POCUS in austere environments: Portable protocols', 'MCI tabletop exercise', 'Case Conference')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- MONTH 16: Communication & Professionalism
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 16, 1, 'Communication & Professionalism', 'Delivering difficult news: Death notification, Prognosis discussions', ARRAY['Ch 301 Death Notification and Advance Directives', 'Ch 300 Palliative Care'], ARRAY['End of Life', 'Communication'], 'Teaching ultrasound: Peer instruction techniques', 'Standardized patient: Death notification', 'Panel Discussion'),
    (v_curriculum_id, 16, 2, 'Communication & Professionalism', 'Cultural humility and implicit bias: Recognition, Mitigation, Health equity', ARRAY['Ch 299 The Transgender Patient', 'Ch 298 The Patient with Morbid Obesity'], ARRAY['Health Equity', 'Special Populations'], 'Ultrasound in special populations: Body habitus', 'Implicit bias workshop', 'Journal Club'),
    (v_curriculum_id, 16, 3, 'Communication & Professionalism', 'Special populations: LGBTQ+ care, Gender-affirming therapy, Disability-competent care', ARRAY['Ch 299 The Transgender Patient', 'Ch 148 Child With Special Healthcare Needs'], ARRAY['LGBTQ+ Health', 'Disability'], 'Pediatric ultrasound review: Age-specific considerations', 'Case-based discussion', 'Panel Discussion'),
    (v_curriculum_id, 16, 4, 'Communication & Professionalism', 'Physician wellness: Burnout recognition, Resilience, Peer support', ARRAY['Ch 27 Ethical Issues of Resuscitation'], ARRAY['Wellness', 'Burnout'], 'Ultrasound portfolio completion: Final competency review', 'Wellness inventory; Debriefing practice', 'Wellness Presentation')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- MONTH 17: High-Yield Review & Remediation
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 17, 1, 'High-Yield Review', 'Resuscitation and cardiovascular review: Case-based integration', ARRAY['Ch 11-14, 18, 22-26, 48-53 Resuscitation and CV'], ARRAY['Comprehensive CV Review'], 'Cardiac POCUS review: Integrated assessment', 'Cardiac arrest with reversible causes sim', 'Board-Style Questions'),
    (v_curriculum_id, 17, 2, 'High-Yield Review', 'Pulmonary and trauma review: Complex scenarios', ARRAY['Ch 56, 62, 65, 68-70, 254, 257-258, 261-263 Pulm/Trauma'], ARRAY['Comprehensive Pulm/Trauma Review'], 'eFAST review: Rapid trauma assessment', 'Trauma resuscitation sim', 'Oral Board Practice'),
    (v_curriculum_id, 17, 3, 'High-Yield Review', 'Abdominal, neuro, and pediatric review: Pitfalls and pearls', ARRAY['Ch 71, 79-81, 165-167, 171, 108-109, 119 GI/Neuro/Peds'], ARRAY['Comprehensive GI/Neuro/Peds Review'], 'Abdominal/Pelvic POCUS review', 'Pediatric status epilepticus sim', 'Board-Style Questions'),
    (v_curriculum_id, 17, 4, 'High-Yield Review', 'Toxicology and environmental review: Challenging cases', ARRAY['Ch 176, 185-190, 208-210, 217 Tox/Environmental'], ARRAY['Comprehensive Tox/Environmental Review'], 'Advanced applications: Procedural guidance', 'Unknown toxidrome sim', 'Oral Board Practice')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    -- ========================================================================
    -- MONTH 18: Integration, Assessment & Transition
    -- ========================================================================
    
    INSERT INTO public.curriculum_topics (curriculum_id, month, week, month_name, core_content, tintinalli_chapters, rosh_topics, ultrasound_competency, procedures_sim, conference_type)
    VALUES
    (v_curriculum_id, 18, 1, 'Integration & Transition', 'Undifferentiated patient I: Critical thinking frameworks', ARRAY['Ch 12 Approach to Nontraumatic Shock', 'Ch 62 Respiratory Distress', 'Ch 71 Acute Abdominal Pain', 'Ch 168 Altered Mental Status'], ARRAY['Undifferentiated Patient'], 'Integrated POCUS: Multi-system assessment', 'High-fidelity sim: Undifferentiated shock', 'Senior Resident Teaching'),
    (v_curriculum_id, 18, 2, 'Integration & Transition', 'Undifferentiated patient II: Cognitive biases, Diagnostic error', ARRAY['Ch 164 Neurologic Examination', 'Ch 48 Chest Pain', 'Ch 52 Syncope'], ARRAY['Diagnostic Reasoning', 'Cognitive Errors'], 'POCUS decision-making: When to scan, When not to', 'High-fidelity sim: Atypical presentations', 'Cognitive Autopsy Workshop'),
    (v_curriculum_id, 18, 3, 'Integration & Transition', 'Comprehensive OSCE: All domains', ARRAY['Integrated review of all sections'], ARRAY['Comprehensive Review'], 'Ultrasound OSCE stations', 'Multi-station practical exam', 'Feedback and Remediation'),
    (v_curriculum_id, 18, 4, 'Integration & Transition', 'Transition of care: Handoffs, Supervision, Teaching juniors', ARRAY['Ch 1 EMS', 'Ch 303 Legal Issues'], ARRAY['Transitions', 'Teaching'], 'Teaching ultrasound to juniors: Faculty development', 'Teaching workshop; Handoff simulation', 'Graduation Conference')
    ON CONFLICT (curriculum_id, month, week) DO NOTHING;

    RAISE NOTICE 'EM Curriculum seeded successfully - all 72 weeks';
END $$;

-- Verify the seed
SELECT 
    sc.name as curriculum,
    COUNT(ct.id) as topics_count,
    MIN(ct.month) as first_month,
    MAX(ct.month) as last_month
FROM public.specialty_curricula sc
LEFT JOIN public.curriculum_topics ct ON ct.curriculum_id = sc.id
WHERE sc.specialty = 'emergency_medicine'
GROUP BY sc.id, sc.name;
