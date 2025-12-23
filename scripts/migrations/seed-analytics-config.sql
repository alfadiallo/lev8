-- Seed data for Analytics configuration
-- Rotation types for MedHub evaluation classification

INSERT INTO public.rotation_types (evaluation_name, rotation_category, rotation_name, site_code) VALUES
  -- On-Service Rotations (Emergency Medicine)
  ('EM Resident Evaluation for EM Ultrasound', 'On', 'Ultrasound', 'MHW'),
  ('EM Resident Evaluation for EMS', 'On', 'EMS', 'MHW'),
  ('EM Resident Evaluation for Medicine', 'On', 'Medicine', 'MHW'),
  ('EM Resident Evaluation for Administration', 'On', 'Administration', 'MHW'),
  
  -- Main ED Evaluations
  ('End of Shift Evaluation Week 1', 'On', 'Main ED', 'MHW'),
  ('End of Shift Evaluation Week 2', 'On', 'Main ED', 'MHW'),
  ('End of Shift Evaluation Week 3', 'On', 'Main ED', 'MHW'),
  ('End of Shift Evaluation Week 4', 'On', 'Main ED', 'MHW'),
  ('Evaluation of Resident by Faculty Member - Emergency Medicine Clinical Shift Evaluation - Week 1', 'On', 'Main ED', 'MHW'),
  ('Evaluation of Resident by Faculty Member - Emergency Medicine Clinical Shift Evaluation - Week 2', 'On', 'Main ED', 'MHW'),
  ('Evaluation of Resident by Faculty Member - Emergency Medicine Clinical Shift Evaluation - Week 3', 'On', 'Main ED', 'MHW'),
  ('Evaluation of Resident by Faculty Member - Emergency Medicine Clinical Shift Evaluation - Week 4', 'On', 'Main ED', 'MHW'),
  
  -- Semi-Annual and Annual Evaluations
  ('PGY-1 Semi-Annual (Mid-Year) Evaluation', 'On', 'Main ED', 'MHW'),
  ('PGY-1 End of Year Evaluation', 'On', 'Main ED', 'MHW'),
  ('PGY-2 Semi-Annual (Mid-Year) Evaluation', 'On', 'Main ED', 'MHW'),
  ('PGY-2 End of Year Evaluation', 'On', 'Main ED', 'MHW'),
  ('PGY-3 Semi-Annual (Mid-Year) Evaluation', 'On', 'Main ED', 'MHW'),
  ('PGY-3 End of Year and Final Evaluation', 'On', 'Main ED', 'MHW'),
  ('Emergency Medicine PGY I Annual Resident Evaluation', 'On', 'Main ED', 'MHW'),
  
  -- Peer and Self Evaluations
  ('Resident Peer Evaluation', 'On', 'Main ED', 'MHW'),
  ('Resident Self Evaluation', 'On', 'Main ED', 'MHW'),
  ('Resident Self-Evaluation', 'On', 'Main ED', 'MHW'),
  
  -- MHM Site
  ('End of Shift Evaluation Week 1- MHM', 'On', 'Main ED', 'MHM'),
  ('End of Shift Evaluation Week 2 -MHM', 'On', 'Main ED', 'MHM'),
  ('End of Shift Evaluation Week 3- MHM', 'On', 'Main ED', 'MHM'),
  ('End of Shift Evaluation Week 4 - MHM', 'On', 'Main ED', 'MHM'),
  
  -- PGY-specific End of Shift
  ('PGY 1- Week 1 End of Shift', 'On', 'Main ED', 'MHW'),
  ('PGY 1- Week 2 End of Shift', 'On', 'Main ED', 'MHW'),
  ('PGY 1- Week 3 End of Shift', 'On', 'Main ED', 'MHW'),
  ('PGY 1- Week 4 End of Shift', 'On', 'Main ED', 'MHW'),
  ('PGY 2- Week 1 End of Shift', 'On', 'Main ED', 'MHW'),
  ('PGY 2- Week 2 End of Shift', 'On', 'Main ED', 'MHW'),
  ('PGY 2- Week 3 End of Shift', 'On', 'Main ED', 'MHW'),
  ('PGY 2- Week 4 End of Shift', 'On', 'Main ED', 'MHW'),
  ('PGY 3- Week 1 End of Shift', 'On', 'Main ED', 'MHW'),
  ('PGY 3- Week 2 End of Shift', 'On', 'Main ED', 'MHW'),
  ('PGY 3- Week 3 End of Shift', 'On', 'Main ED', 'MHW'),
  ('PGY 3- Week 4 End of Shift', 'On', 'Main ED', 'MHW'),
  
  -- Transitional Year
  ('Faculty Evaluation of Transitional Year Resident', 'On', 'Main ED', 'MHW'),
  
  -- Off-Service Rotations (Non-EM Specialties)
  ('EM Resident Evaluation for Orthopedics', 'Off', 'Orthopedics', 'MHW'),
  ('EM Resident Evaluation for the ICU', 'Off', 'ICU', 'MHW'),
  ('EM Resident Evaluation for the PICU', 'Off', 'PICU', 'MRH'),
  ('EM Resident Evaluation for the SICU', 'Off', 'SICU', 'MRH'),
  ('EM Resident Evaluation for the CVICU', 'Off', 'CVICU', 'MRH'),
  ('EM Resident Evaluation for Anesthesia', 'Off', 'Anesthesia', 'MHW'),
  ('EM Resident Evaluation for OB', 'Off', 'OB/GYN', 'MHW'),
  ('(2.0) MHS Faculty Evaluation of IM Resident - FLOOR ROTATION', 'Off', 'Internal Medicine Floor', 'MHW')
ON CONFLICT (evaluation_name) DO NOTHING;


