-- Seed Running Board Cases and Presets
-- Run this AFTER the migration: 20250202000001_running_board.sql

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM public.running_board_presets;
-- DELETE FROM public.running_board_cases;

-- ============================================================================
-- SHIFT 1 CASES
-- ============================================================================

INSERT INTO public.running_board_cases (id, title, category, acuity_level, tags, patient_profile, timeline, debrief_points, is_global)
VALUES 
(
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Septic Shock w/ AMS',
  'Infectious',
  1,
  ARRAY['Geriatric', 'Sepsis', 'Shock'],
  '{"demographics": "68yo M", "chief_complaint": "Altered Mental Status", "initial_vitals": {"bp": "82/48", "hr": 118, "rr": 24, "o2": "89%", "temp": "38.9°C"}, "target_disposition": "ICU ready ~90 min"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "Patient is febrile (38.9°C) and altered. Watch for recognition of septic shock.", "checklist": [{"id": "s1_a_1", "label": "Identify as highest acuity", "is_critical": true}, {"id": "s1_a_2", "label": "Quick bedside assessment", "is_critical": false}, {"id": "s1_a_3", "label": "Recognize septic shock", "is_critical": true}]}, {"phase_id": 2, "time_label": "02:00-05:00", "script_prompt": "First Check-in. Identify if sepsis bundle started.", "conditional_triggers": [{"condition": "If sepsis not addressed", "script": "Nurse: Patient A looks worse than 10 minutes ago."}], "checklist": [{"id": "s1_a_4", "label": "2 large bore IVs", "is_critical": true}, {"id": "s1_a_5", "label": "Fluid bolus 30cc/kg", "is_critical": true}, {"id": "s1_a_6", "label": "Blood cultures STAT", "is_critical": true}, {"id": "s1_a_7", "label": "Broad-spectrum antibiotics", "is_critical": true}]}, {"phase_id": 3, "time_label": "05:00-08:00", "vitals_update": {"bp": "72/40", "hr": 120, "rr": 26, "o2": "88%", "temp": "38.9°C"}, "script_prompt": "Critical Update: Patient is hypotensive (72/40) and barely responding.", "conditional_triggers": [{"condition": "If bundle incomplete", "script": "Charge Nurse: Which patient is your priority? This guy is tanking."}], "checklist": [{"id": "s1_a_8", "label": "Continue resuscitation", "is_critical": true}, {"id": "s1_a_9", "label": "Reassess BP response", "is_critical": true}]}, {"phase_id": 4, "time_label": "08:00-10:00", "script_prompt": "Deterioration: Patient A still hypotensive despite fluids.", "vitals_update": {"bp": "70/38", "hr": 125, "rr": 28, "o2": "87%", "temp": "38.9°C"}, "checklist": [{"id": "s1_a_10", "label": "Start vasopressors", "is_critical": true}, {"id": "s1_a_11", "label": "Consider intubation", "is_critical": false}, {"id": "s1_a_12", "label": "Call ICU early", "is_critical": true}]}, {"phase_id": 5, "time_label": "10:00-12:00", "script_prompt": "Lab Results: WBC 24k, Lactate 4.8, Glucose 478.", "checklist": [{"id": "s1_a_13", "label": "Start insulin protocol", "is_critical": false}]}, {"phase_id": 6, "time_label": "12:00-15:00", "script_prompt": "Patient has poor access. Needs central line.", "checklist": [{"id": "s1_a_14", "label": "Place central line", "is_critical": true}, {"id": "s1_a_15", "label": "Source control discussion", "is_critical": false}]}, {"phase_id": 8, "time_label": "18:00-20:00", "script_prompt": "Responding to treatment. ICU aware.", "checklist": [{"id": "s1_a_16", "label": "Present to intensivist", "is_critical": false}]}]'::jsonb,
  ARRAY['Sepsis bundle timing', 'Peripheral vs Central pressors', 'Source control'],
  true
),
(
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Inferior STEMI',
  'Cardiovascular',
  1,
  ARRAY['STEMI', 'Chest Pain', 'Time Critical'],
  '{"demographics": "55yo M", "chief_complaint": "Chest Pain (Crushing)", "initial_vitals": {"bp": "142/88", "hr": 92, "rr": 20, "o2": "96%", "temp": "37.0°C"}, "target_disposition": "Cath lab <20 min"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "Crushing substernal pain.", "checklist": [{"id": "s1_b_1", "label": "Immediate EKG", "is_critical": true}, {"id": "s1_b_2", "label": "Recognize STEMI", "is_critical": true}, {"id": "s1_b_3", "label": "Activate Code Heart", "is_critical": true}]}, {"phase_id": 2, "time_label": "02:00-05:00", "script_prompt": "EKG shows elevation in II, III, aVF.", "conditional_triggers": [{"condition": "If STEMI not addressed", "script": "Tech: Do you want an EKG on the chest pain patient?"}], "checklist": [{"id": "s1_b_4", "label": "ASA 324mg chewed", "is_critical": true}, {"id": "s1_b_5", "label": "Heparin bolus", "is_critical": true}, {"id": "s1_b_6", "label": "Nitroglycerin (Caution in inf MI)", "is_critical": false}, {"id": "s1_b_7", "label": "P2Y12 Load", "is_critical": true}]}, {"phase_id": 3, "time_label": "05:00-08:00", "script_prompt": "Update: Cath lab is ready - they need him NOW!", "checklist": [{"id": "s1_b_8", "label": "Consent if time", "is_critical": false}, {"id": "s1_b_9", "label": "Transfer to cath lab", "is_critical": true}]}, {"phase_id": 4, "time_label": "08:00-10:00", "script_prompt": "Patient is in Cath Lab. Bed is being cleaned.", "checklist": []}]'::jsonb,
  ARRAY['Door to balloon time', 'Inferior MI and RV involvement', 'Nitroglycerin contraindications'],
  true
),
(
  'a1b2c3d4-0003-4000-8000-000000000003',
  'Stable Ectopic',
  'OBGYN',
  3,
  ARRAY['Pregnancy', 'Abdominal Pain', 'Stable'],
  '{"demographics": "26yo F", "chief_complaint": "Abd Pain/Vaginal Bleeding", "initial_vitals": {"bp": "108/68", "hr": 89, "rr": 18, "o2": "99%", "temp": "37.0°C"}, "target_disposition": "US ~2 hours"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "LMP 6 weeks ago. Hemodynamically stable.", "checklist": [{"id": "s1_c_1", "label": "Visual assessment", "is_critical": false}, {"id": "s1_c_2", "label": "Pregnancy concerns identified", "is_critical": true}]}, {"phase_id": 2, "time_label": "02:00-05:00", "script_prompt": "Patient awaiting workup.", "checklist": [{"id": "s1_c_3", "label": "Quantitative β-hCG STAT", "is_critical": true}, {"id": "s1_c_4", "label": "Type & Screen", "is_critical": true}]}, {"phase_id": 3, "time_label": "05:00-08:00", "script_prompt": "Cramping worsening slightly.", "checklist": [{"id": "s1_c_5", "label": "Pain control", "is_critical": false}]}, {"phase_id": 5, "time_label": "10:00-12:00", "script_prompt": "Lab Results: β-hCG 2,500. Concerning for ectopic.", "checklist": [{"id": "s1_c_6", "label": "Order formal US", "is_critical": true}, {"id": "s1_c_7", "label": "OB/GYN aware", "is_critical": false}]}, {"phase_id": 6, "time_label": "12:00-15:00", "script_prompt": "Significant other wants to discuss results. Is the baby okay?", "checklist": [{"id": "s1_c_8", "label": "Explain ectopic concerns", "is_critical": true}]}, {"phase_id": 8, "time_label": "18:00-20:00", "script_prompt": "US Results: No IUP. Complex mass. Free fluid.", "checklist": [{"id": "s1_c_9", "label": "OB/GYN Consult STAT", "is_critical": true}]}]'::jsonb,
  ARRAY['Discriminatory zone for beta-hCG', 'Psychosocial management of pregnancy loss'],
  true
),
(
  'a1b2c3d4-0004-4000-8000-000000000004',
  'Hand Laceration',
  'Trauma',
  4,
  ARRAY['Minor Procedure', 'Fast Track'],
  '{"demographics": "28yo M", "chief_complaint": "Hand Laceration", "initial_vitals": {"bp": "124/78", "hr": 72, "rr": 14, "o2": "100%", "temp": "36.8°C"}, "target_disposition": "Discharge"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "Simple laceration. Bleeding controlled.", "checklist": [{"id": "s1_d_1", "label": "Bleeding controlled check", "is_critical": false}]}, {"phase_id": 2, "time_label": "02:00-05:00", "script_prompt": "Patient asks about wait time.", "checklist": [{"id": "s1_d_2", "label": "Reassure about wait", "is_critical": false}]}, {"phase_id": 6, "time_label": "12:00-15:00", "script_prompt": "Patient angry about wait.", "checklist": [{"id": "s1_d_3", "label": "Address patient frustration", "is_critical": false}]}, {"phase_id": 8, "time_label": "18:00-20:00", "script_prompt": "Patient asks if you forgot about him.", "checklist": [{"id": "s1_d_4", "label": "Irrigate wound", "is_critical": true}, {"id": "s1_d_5", "label": "Suture", "is_critical": true}, {"id": "s1_d_6", "label": "Tetanus update", "is_critical": false}]}]'::jsonb,
  ARRAY['Resource management', 'De-escalation techniques'],
  true
);

-- ============================================================================
-- SHIFT 2 CASES
-- ============================================================================

INSERT INTO public.running_board_cases (id, title, category, acuity_level, tags, patient_profile, timeline, debrief_points, is_global)
VALUES 
(
  'a1b2c3d4-0005-4000-8000-000000000005',
  'Upper GI Bleed',
  'GI',
  1,
  ARRAY['Hemorrhage', 'Shock', 'Airway'],
  '{"demographics": "58yo M", "chief_complaint": "Vomiting Blood", "initial_vitals": {"bp": "90/60", "hr": 125, "rr": 24, "o2": "95%", "temp": "37.8°C"}, "target_disposition": "ICU/Endo"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "Pale, diaphoretic, vomiting blood. HR 125.", "conditional_triggers": [{"condition": "If no rapid IVs", "script": "Nurse: Do you want access and blood?"}], "checklist": [{"id": "s2_a_1", "label": "2 large IVs", "is_critical": true}, {"id": "s2_a_2", "label": "Fluids", "is_critical": true}, {"id": "s2_a_3", "label": "Blood type & cross", "is_critical": true}, {"id": "s2_a_4", "label": "Protonix (PPI)", "is_critical": false}, {"id": "s2_a_5", "label": "GI Consult", "is_critical": true}]}, {"phase_id": 3, "time_label": "05:00-08:00", "script_prompt": "Still hypotensive after fluids. BP drops further if no blood.", "checklist": [{"id": "s2_a_6", "label": "Start Blood Transfusion", "is_critical": true}]}, {"phase_id": 4, "time_label": "08:00-10:00", "script_prompt": "Hb 6.2 reported. Nurse: Blood bank waiting for orders.", "checklist": [{"id": "s2_a_7", "label": "Massive Transfusion Protocol", "is_critical": true}]}, {"phase_id": 6, "time_label": "12:00-15:00", "script_prompt": "Continues to vomit blood. Airway threatened.", "checklist": [{"id": "s2_a_8", "label": "Intubation decision", "is_critical": true}, {"id": "s2_a_9", "label": "Definitive Airway", "is_critical": true}]}]'::jsonb,
  ARRAY['Massive transfusion protocol', 'Intubation of GI bleeder (risks)'],
  true
),
(
  'a1b2c3d4-0006-4000-8000-000000000006',
  'Asthma Exacerbation',
  'Cardiovascular',
  2,
  ARRAY['Respiratory Distress', 'Asthma'],
  '{"demographics": "22yo F", "chief_complaint": "Severe SOB", "initial_vitals": {"bp": "128/78", "hr": 118, "rr": 34, "o2": "86%", "temp": "37.0°C"}, "target_disposition": "MICU"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "Speaking 2-3 words. Accessory muscle use.", "checklist": [{"id": "s2_b_1", "label": "Nebs back-to-back", "is_critical": true}, {"id": "s2_b_2", "label": "Steroids", "is_critical": true}, {"id": "s2_b_3", "label": "Magnesium Sulfate", "is_critical": true}]}, {"phase_id": 3, "time_label": "05:00-08:00", "script_prompt": "O2 sat falling. Distress persists.", "checklist": [{"id": "s2_b_4", "label": "Escalate therapy (BiPAP/Epi)", "is_critical": true}]}, {"phase_id": 4, "time_label": "08:00-10:00", "script_prompt": "RT: She is tiring out. RR 35, Sat 85%.", "checklist": [{"id": "s2_b_5", "label": "Consider Intubation", "is_critical": true}, {"id": "s2_b_6", "label": "Prepare RSI", "is_critical": false}]}, {"phase_id": 5, "time_label": "10:00-12:00", "script_prompt": "ABG: pH 7.25, CO2 55. Retaining CO2.", "checklist": [{"id": "s2_b_7", "label": "Recognize Hypercapnia", "is_critical": true}]}]'::jsonb,
  ARRAY['Permissive hypercapnia', 'Dangers of intubating asthmatics'],
  true
),
(
  'a1b2c3d4-0007-4000-8000-000000000007',
  'Occult Hip Fracture',
  'Trauma',
  3,
  ARRAY['Geriatric', 'Fall', 'Orthopedics'],
  '{"demographics": "82yo F", "chief_complaint": "Fall / Hip Pain", "initial_vitals": {"bp": "138/76", "hr": 92, "rr": 20, "o2": "98%", "temp": "36.9°C"}, "target_disposition": "Ortho Admission"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "Fall at home. Severe hip pain.", "checklist": [{"id": "s2_c_1", "label": "Order Pelvis XR", "is_critical": true}, {"id": "s2_c_2", "label": "Pain meds", "is_critical": false}]}, {"phase_id": 3, "time_label": "05:00-08:00", "script_prompt": "XR reported as No acute fracture. Patient still cannot move leg.", "checklist": [{"id": "s2_c_3", "label": "Recognize discrepancy", "is_critical": true}]}, {"phase_id": 4, "time_label": "08:00-10:00", "script_prompt": "Nurse: She is still in a lot of pain, are we missing something?", "checklist": [{"id": "s2_c_4", "label": "Order CT Pelvis/Hip", "is_critical": true}]}, {"phase_id": 5, "time_label": "10:00-12:00", "script_prompt": "CT Pelvis: Occult acetabular fracture found.", "checklist": [{"id": "s2_c_5", "label": "Consult Ortho", "is_critical": true}]}]'::jsonb,
  ARRAY['Occult fractures in elderly', 'Limitations of plain films'],
  true
),
(
  'a1b2c3d4-0008-4000-8000-000000000008',
  'Suicidal Ideation',
  'Neuro',
  3,
  ARRAY['Psych', 'Safety'],
  '{"demographics": "35yo M", "chief_complaint": "Suicidal Thoughts", "initial_vitals": {"bp": "122/74", "hr": 84, "rr": 16, "o2": "99%", "temp": "36.8°C"}, "target_disposition": "Psych Admission"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "Calm but tearful. Expresses suicidal thoughts.", "checklist": [{"id": "s2_d_1", "label": "Place sitter", "is_critical": true}, {"id": "s2_d_2", "label": "Remove belongings/safety search", "is_critical": true}, {"id": "s2_d_3", "label": "Psych consult", "is_critical": false}]}, {"phase_id": 3, "time_label": "05:00-08:00", "script_prompt": "Patient becomes agitated, wants to leave.", "checklist": [{"id": "s2_d_4", "label": "De-escalation", "is_critical": false}]}, {"phase_id": 4, "time_label": "08:00-10:00", "script_prompt": "Threatening to leave AMA.", "checklist": [{"id": "s2_d_5", "label": "Prevent elopement", "is_critical": true}, {"id": "s2_d_6", "label": "Security involvement", "is_critical": false}]}]'::jsonb,
  ARRAY['Medical clearance for psych', 'Legal holds and AMA'],
  true
);

-- ============================================================================
-- SHIFT 3 CASES
-- ============================================================================

INSERT INTO public.running_board_cases (id, title, category, acuity_level, tags, patient_profile, timeline, debrief_points, is_global)
VALUES 
(
  'a1b2c3d4-0009-4000-8000-000000000009',
  'Septic Shock (Bill)',
  'Infectious',
  1,
  ARRAY['Sepsis', 'DNR/POLST', 'Ethical'],
  '{"demographics": "74F, Nursing Home", "chief_complaint": "Altered Mental Status, Fever", "initial_vitals": {"bp": "88/52", "hr": 112, "rr": 22, "o2": "94%", "temp": "38.9°C"}, "target_disposition": "ICU (Pyelonephritis)"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "Usually oriented, now AMS. Decreased urine output x2 days.", "checklist": [{"id": "s3_bill_1", "label": "Recognizes sepsis", "is_critical": true}, {"id": "s3_bill_2", "label": "Order IV/Fluids", "is_critical": true}, {"id": "s3_bill_3", "label": "Order Lactate", "is_critical": true}, {"id": "s3_bill_4", "label": "Order Blood Cultures", "is_critical": true}, {"id": "s3_bill_5", "label": "Broad-spectrum Abx", "is_critical": true}]}, {"phase_id": 2, "time_label": "02:00-05:00", "script_prompt": "WBC 18.2, Lactate 4.8. BP 82/50 after 1L fluid. Not responding.", "checklist": [{"id": "s3_bill_6", "label": "Central Access / 2nd IV", "is_critical": true}, {"id": "s3_bill_7", "label": "Initiate Vasopressors (Norepi)", "is_critical": true}]}, {"phase_id": 4, "time_label": "05:00-08:00", "script_prompt": "Deterioration: Working hard to breathe. SpO2 88%. ABG pH 7.22.", "checklist": [{"id": "s3_bill_8", "label": "Prepare for Intubation", "is_critical": true}, {"id": "s3_bill_9", "label": "Add second pressor", "is_critical": false}]}, {"phase_id": 6, "time_label": "12:00-16:00", "script_prompt": "Nursing home faxes POLST: DNR but allows intubation for reversible causes. Son is confused.", "checklist": [{"id": "s3_bill_10", "label": "Discuss Goals of Care", "is_critical": true}, {"id": "s3_bill_11", "label": "Explain prognosis clearly", "is_critical": true}]}]'::jsonb,
  ARRAY['End of life discussions in acute settings', 'Management of fluid-refractory shock'],
  true
),
(
  'a1b2c3d4-0010-4000-8000-000000000010',
  'Ectopic Pregnancy (Ashley)',
  'OBGYN',
  1,
  ARRAY['Ruptured Ectopic', 'Hemorrhage', 'Young Female'],
  '{"demographics": "28F", "chief_complaint": "Lower Abd Pain x 6hrs", "initial_vitals": {"bp": "118/76", "hr": 88, "rr": 16, "o2": "99%", "temp": "37.1°C"}, "target_disposition": "OR (Salpingectomy)"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "Pain on right side. Spotting. LMP 7 weeks ago.", "checklist": [{"id": "s3_ash_1", "label": "Identify Ectopic Concern", "is_critical": true}, {"id": "s3_ash_2", "label": "Order β-hCG", "is_critical": true}, {"id": "s3_ash_3", "label": "POCUS Exam", "is_critical": true}]}, {"phase_id": 2, "time_label": "02:00-05:00", "script_prompt": "β-hCG Positive (6,200). Pain worsening.", "checklist": [{"id": "s3_ash_4", "label": "ObGyn Consult", "is_critical": true}, {"id": "s3_ash_5", "label": "Large-bore IV", "is_critical": true}]}, {"phase_id": 4, "time_label": "05:00-08:00", "script_prompt": "CRITICAL: BP drops to 94/62, HR 112. Patient dizzy. TVUS shows free fluid.", "checklist": [{"id": "s3_ash_6", "label": "Recognize Rupture", "is_critical": true}, {"id": "s3_ash_7", "label": "Call for emergent OR", "is_critical": true}, {"id": "s3_ash_8", "label": "Blood/Fluids resuscitation", "is_critical": true}]}, {"phase_id": 5, "time_label": "08:00-12:00", "script_prompt": "Hgb 8.2. Taking to OR.", "checklist": [{"id": "s3_ash_9", "label": "Confirm blood products ready", "is_critical": true}]}]'::jsonb,
  ARRAY['Hemodynamic collapse in ectopic', 'FAST exam in pregnancy'],
  true
),
(
  'a1b2c3d4-0011-4000-8000-000000000011',
  'Acute Stroke (Mary)',
  'Neuro',
  2,
  ARRAY['Stroke Code', 'tPA', 'Hypertension'],
  '{"demographics": "67M", "chief_complaint": "R-sided weakness, speech difficulty", "initial_vitals": {"bp": "178/98", "hr": 76, "rr": 14, "o2": "97%", "temp": "36.8°C"}, "target_disposition": "Neuro ICU"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "Face drooping, slurred speech. Last known well 45 mins ago.", "checklist": [{"id": "s3_mary_1", "label": "Activate Stroke Code", "is_critical": true}, {"id": "s3_mary_2", "label": "Determine Last Known Well", "is_critical": true}, {"id": "s3_mary_3", "label": "Order STAT CT/CTA", "is_critical": true}]}, {"phase_id": 2, "time_label": "02:00-05:00", "script_prompt": "CT Head: No bleed. NIHSS 14. Time: 75 mins from onset.", "checklist": [{"id": "s3_mary_4", "label": "Recommend tPA", "is_critical": true}, {"id": "s3_mary_5", "label": "Check contraindications", "is_critical": true}]}, {"phase_id": 4, "time_label": "05:00-08:00", "script_prompt": "During tPA, BP jumps to 210/115.", "checklist": [{"id": "s3_mary_6", "label": "Hold tPA temporarily", "is_critical": true}, {"id": "s3_mary_7", "label": "Administer Labetalol/Nicardipine", "is_critical": true}, {"id": "s3_mary_8", "label": "Target BP < 185/110", "is_critical": true}]}]'::jsonb,
  ARRAY['tPA contraindications', 'Blood pressure management in stroke'],
  true
),
(
  'a1b2c3d4-0012-4000-8000-000000000012',
  'AMS / Trauma (Richard)',
  'Trauma',
  2,
  ARRAY['Trauma', 'Hypoglycemia', 'Head Injury'],
  '{"demographics": "42M", "chief_complaint": "Found Unresponsive", "initial_vitals": {"bp": "142/88", "hr": 68, "rr": 12, "o2": "98%", "temp": "35.8°C"}, "target_disposition": "Trauma Observation"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "Found slumped. Smells like alcohol. Unresponsive.", "checklist": [{"id": "s3_rich_1", "label": "Check Fingerstick Glucose", "is_critical": true}, {"id": "s3_rich_2", "label": "Trauma Assessment", "is_critical": true}]}, {"phase_id": 2, "time_label": "02:00-05:00", "script_prompt": "Glucose 38 mg/dL. After D50, he wakes up but you find a 4cm occipital laceration.", "checklist": [{"id": "s3_rich_3", "label": "C-Collar application", "is_critical": true}, {"id": "s3_rich_4", "label": "Order CT Head/C-Spine", "is_critical": true}]}, {"phase_id": 5, "time_label": "08:00-12:00", "script_prompt": "CT Shows 8mm Subdural Hematoma. GCS 13.", "checklist": [{"id": "s3_rich_5", "label": "Consult Neurosurgery", "is_critical": true}, {"id": "s3_rich_6", "label": "Serial neuro checks", "is_critical": true}]}, {"phase_id": 6, "time_label": "12:00-16:00", "script_prompt": "Sister arrives, upset about his alcoholism.", "checklist": [{"id": "s3_rich_7", "label": "Address family concerns", "is_critical": false}, {"id": "s3_rich_8", "label": "Provide resources", "is_critical": false}]}]'::jsonb,
  ARRAY['Dont anchor on intoxication', 'Hypoglycemia management', 'Trauma in AMS'],
  true
);

-- ============================================================================
-- SHIFT 4 CASES
-- ============================================================================

INSERT INTO public.running_board_cases (id, title, category, acuity_level, tags, patient_profile, timeline, debrief_points, is_global)
VALUES 
(
  'a1b2c3d4-0013-4000-8000-000000000013',
  'Mesenteric Ischemia',
  'GI',
  1,
  ARRAY['Geriatric', 'Vascular', 'High Mortality'],
  '{"demographics": "72yo M (A-Fib)", "chief_complaint": "Severe Abd Pain (Screaming)", "initial_vitals": {"bp": "110/70", "hr": 102, "rr": 12, "o2": "96%", "temp": "37.1°C"}, "target_disposition": "OR (Surgery)"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "Screaming in agony but belly is soft. (Pain out of proportion).", "checklist": [{"id": "s4_a_1", "label": "Recognize Pain OOP", "is_critical": true}, {"id": "s4_a_2", "label": "Order Lactate", "is_critical": true}, {"id": "s4_a_3", "label": "Order CT Angio (Not plain CT)", "is_critical": true}]}, {"phase_id": 2, "time_label": "02:00-05:00", "script_prompt": "Pain unremitting despite morphine.", "checklist": [{"id": "s4_a_4", "label": "Surgical consult considered", "is_critical": true}]}, {"phase_id": 4, "time_label": "08:00-10:00", "script_prompt": "CT Scanner delayed 15 mins. Acidosis developing.", "checklist": [{"id": "s4_a_5", "label": "Advocate for immediate scan", "is_critical": true}]}, {"phase_id": 5, "time_label": "10:00-12:00", "script_prompt": "Lactate 5.5. WBC 22k. VBG pH 7.25.", "checklist": [{"id": "s4_a_6", "label": "Call Surgery STAT", "is_critical": true}]}, {"phase_id": 6, "time_label": "12:00-15:00", "script_prompt": "Surgeon: Patient needs CT first.", "checklist": [{"id": "s4_a_7", "label": "Push for bedside consult", "is_critical": true}]}]'::jsonb,
  ARRAY['Pain out of proportion', 'CT Angio vs CT Abdomen'],
  true
),
(
  'a1b2c3d4-0014-4000-8000-000000000014',
  'Cholangitis',
  'GI',
  2,
  ARRAY['Sepsis', 'Biliary', 'Reynolds Pentad'],
  '{"demographics": "55yo F", "chief_complaint": "Confused & Yellow", "initial_vitals": {"bp": "88/50", "hr": 115, "rr": 24, "o2": "94%", "temp": "39.4°C"}, "target_disposition": "GI (ERCP)"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "Patient hot to touch, confused, jaundiced.", "checklist": [{"id": "s4_b_1", "label": "Identify Reynolds Pentad", "is_critical": true}, {"id": "s4_b_2", "label": "Fluids 30cc/kg", "is_critical": true}, {"id": "s4_b_3", "label": "Broad Spectrum Abx", "is_critical": true}, {"id": "s4_b_4", "label": "RUQ Ultrasound", "is_critical": true}]}, {"phase_id": 2, "time_label": "02:00-05:00", "script_prompt": "BP drops to 80/40. Mental status declining.", "checklist": [{"id": "s4_b_5", "label": "Start Norepinephrine", "is_critical": true}]}, {"phase_id": 5, "time_label": "10:00-12:00", "script_prompt": "Labs: Bili 8.5, Alk Phos 400. US: Dilated CBD > 1cm.", "checklist": [{"id": "s4_b_6", "label": "Call GI for ERCP", "is_critical": true}]}]'::jsonb,
  ARRAY['Reynolds Pentad', 'Biliary decompression urgency'],
  true
),
(
  'a1b2c3d4-0015-4000-8000-000000000015',
  'Cirrhotic UGIB',
  'GI',
  1,
  ARRAY['Hemorrhage', 'Cirrhosis', 'Airway'],
  '{"demographics": "52yo M", "chief_complaint": "Vomiting Blood", "initial_vitals": {"bp": "90/52", "hr": 124, "rr": 22, "o2": "95%", "temp": "36.5°C"}, "target_disposition": "ICU/Endo"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "Room smells of blood. Active hematemesis.", "checklist": [{"id": "s4_c_1", "label": "2 Large Bore IVs", "is_critical": true}, {"id": "s4_c_2", "label": "Octreotide", "is_critical": true}, {"id": "s4_c_3", "label": "Ceftriaxone (Abx)", "is_critical": true}]}, {"phase_id": 2, "time_label": "02:00-05:00", "script_prompt": "BP 80/40. Confused.", "checklist": [{"id": "s4_c_4", "label": "Activate MTP", "is_critical": true}, {"id": "s4_c_5", "label": "Setup Suction/Airway", "is_critical": true}]}, {"phase_id": 6, "time_label": "12:00-15:00", "script_prompt": "GI refusing scope. Intubate first.", "checklist": [{"id": "s4_c_6", "label": "RSI with Ketamine/Etomidate", "is_critical": true}, {"id": "s4_c_7", "label": "Push dose pressors ready", "is_critical": true}]}]'::jsonb,
  ARRAY['Antibiotics in variceal bleed', 'Resuscitation before intubation'],
  true
),
(
  'a1b2c3d4-0016-4000-8000-000000000016',
  'LGIB on Eliquis',
  'GI',
  2,
  ARRAY['Anticoagulation', 'Reversal', 'Geriatric'],
  '{"demographics": "78yo F (A-Fib)", "chief_complaint": "BRBPR", "initial_vitals": {"bp": "108/60", "hr": 92, "rr": 18, "o2": "97%", "temp": "36.9°C"}, "target_disposition": "IR (Embolization)"}'::jsonb,
  '[{"phase_id": 1, "time_label": "00:00-02:00", "script_prompt": "Voluminous bright red blood per rectum. History of Eliquis.", "checklist": [{"id": "s4_d_1", "label": "Identify Eliquis use", "is_critical": true}, {"id": "s4_d_2", "label": "Hold Anticoagulation", "is_critical": true}, {"id": "s4_d_3", "label": "Order 4-Factor PCC", "is_critical": true}]}, {"phase_id": 2, "time_label": "02:00-05:00", "script_prompt": "Passes another 300cc clot. Lightheaded.", "checklist": [{"id": "s4_d_4", "label": "Fluid Bolus", "is_critical": true}]}, {"phase_id": 5, "time_label": "10:00-12:00", "script_prompt": "Hb 8.4 (Drop from 12). INR Normal (Trick question).", "checklist": [{"id": "s4_d_5", "label": "Order CTA Abd/Pelvis", "is_critical": true}]}, {"phase_id": 8, "time_label": "18:00-20:00", "script_prompt": "Result: Active blush in sigmoid.", "checklist": [{"id": "s4_d_6", "label": "Consult IR", "is_critical": true}]}]'::jsonb,
  ARRAY['DOAC reversal agents', 'Normal INR in DOAC use'],
  true
);

-- ============================================================================
-- PRESET SHIFTS
-- ============================================================================

INSERT INTO public.running_board_presets (id, name, description, case_ids, difficulty, is_global)
VALUES 
(
  'b2c3d4e5-0001-4000-8000-000000000001',
  'Shift 1: Bread & Butter',
  'Classic ED mix: Sepsis, STEMI, Stable Ectopic, and Minor Trauma. Good for building foundational multi-patient management skills.',
  ARRAY['a1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0002-4000-8000-000000000002', 'a1b2c3d4-0003-4000-8000-000000000003', 'a1b2c3d4-0004-4000-8000-000000000004']::uuid[],
  'intermediate',
  true
),
(
  'b2c3d4e5-0002-4000-8000-000000000002',
  'Shift 2: Challenging Mix',
  'Upper GI Bleed, Asthma, Occult Fracture, Psych Emergency. Tests airway management, hidden diagnoses, and psychiatric holds.',
  ARRAY['a1b2c3d4-0005-4000-8000-000000000005', 'a1b2c3d4-0006-4000-8000-000000000006', 'a1b2c3d4-0007-4000-8000-000000000007', 'a1b2c3d4-0008-4000-8000-000000000008']::uuid[],
  'advanced',
  true
),
(
  'b2c3d4e5-0003-4000-8000-000000000003',
  'Shift 3: Complex Scenarios',
  'Sepsis with DNR, Ruptured Ectopic, Acute Stroke, Trauma with Hypoglycemia. Heavy on ethical decisions and time-critical interventions.',
  ARRAY['a1b2c3d4-0009-4000-8000-000000000009', 'a1b2c3d4-0010-4000-8000-000000000010', 'a1b2c3d4-0011-4000-8000-000000000011', 'a1b2c3d4-0012-4000-8000-000000000012']::uuid[],
  'advanced',
  true
),
(
  'b2c3d4e5-0004-4000-8000-000000000004',
  'Shift 4: GI Disaster',
  'Mesenteric Ischemia, Cholangitis, Cirrhotic UGIB, LGIB on Anticoagulation. All GI-focused with surgical emergencies.',
  ARRAY['a1b2c3d4-0013-4000-8000-000000000013', 'a1b2c3d4-0014-4000-8000-000000000014', 'a1b2c3d4-0015-4000-8000-000000000015', 'a1b2c3d4-0016-4000-8000-000000000016']::uuid[],
  'advanced',
  true
);

-- Verify insertion
SELECT 'Cases inserted: ' || COUNT(*) FROM public.running_board_cases;
SELECT 'Presets inserted: ' || COUNT(*) FROM public.running_board_presets;



