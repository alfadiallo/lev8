-- =====================================================
-- PULSE CHECK - Demo Seed Data
-- Run this after the migrations to populate demo data
-- =====================================================
-- 
-- IMPORTANT: Run these migrations FIRST (in order):
--   1. supabase/migrations/20260118000001_pulsecheck_module.sql
--   2. supabase/migrations/20260119000001_add_pulsecheck_healthsystems.sql
--   3. supabase/migrations/20260119000002_pulsecheck_demo_visitors.sql
--   4. supabase/migrations/20260122000001_pulsecheck_metrics.sql
--   5. supabase/migrations/20260123000001_pulsecheck_frequency.sql
--
-- =====================================================

-- Clear existing data (for re-running) - safe delete that won't fail if tables don't exist
DO $$
BEGIN
  -- Delete in correct order due to foreign key constraints
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pulsecheck_reminders') THEN
    DELETE FROM pulsecheck_reminders;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pulsecheck_ratings') THEN
    DELETE FROM pulsecheck_ratings;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pulsecheck_imports') THEN
    DELETE FROM pulsecheck_imports;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pulsecheck_cycles') THEN
    DELETE FROM pulsecheck_cycles;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pulsecheck_providers') THEN
    DELETE FROM pulsecheck_providers;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pulsecheck_directors') THEN
    DELETE FROM pulsecheck_directors;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pulsecheck_departments') THEN
    DELETE FROM pulsecheck_departments;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pulsecheck_sites') THEN
    DELETE FROM pulsecheck_sites;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pulsecheck_healthsystems') THEN
    DELETE FROM pulsecheck_healthsystems;
  END IF;
END $$;

-- =====================================================
-- HEALTHSYSTEMS (with frequency configuration)
-- =====================================================
INSERT INTO pulsecheck_healthsystems (id, name, abbreviation, address, is_active, default_frequency, default_cycle_start_month) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Metro Healthsystem', 'MHS', '123 Medical Center Dr, Boston, MA', true, 'quarterly', 1);

-- =====================================================
-- SITES (All under Metro Healthsystem)
-- =====================================================
INSERT INTO pulsecheck_sites (id, name, region, address, healthsystem_id, is_active) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Metro General', 'Northeast', '123 Medical Center Dr, Boston, MA', '00000000-0000-0000-0000-000000000001', true),
  ('11111111-0000-0000-0000-000000000002', 'Metro Valley', 'West', '456 Healthcare Blvd, Phoenix, AZ', '00000000-0000-0000-0000-000000000001', true),
  ('11111111-0000-0000-0000-000000000003', 'Metro Lakeside', 'Midwest', '789 Lakeshore Ave, Chicago, IL', '00000000-0000-0000-0000-000000000001', true);

-- =====================================================
-- DEPARTMENTS
-- =====================================================
INSERT INTO pulsecheck_departments (id, site_id, name, specialty, is_active) VALUES
  -- Metro General Hospital
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Emergency Medicine', 'Emergency Medicine', true),
  -- Valley Medical Center
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 'Emergency Medicine', 'Emergency Medicine', true),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002', 'Urgent Care', 'Urgent Care', true),
  -- Lakeside Community Hospital
  ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000003', 'Emergency Medicine', 'Emergency Medicine', true);

-- =====================================================
-- DIRECTORS
-- =====================================================
INSERT INTO pulsecheck_directors (id, department_id, healthsystem_id, name, email, role, is_active) VALUES
  -- Regional Medical Director (healthsystem level - Metro Healthsystem)
  ('33333333-0000-0000-0000-000000000001', NULL, '00000000-0000-0000-0000-000000000001', 'Dr. Michael Thompson', 'michael.thompson@metrohealth.com', 'regional_director', true),
  
  -- Admin Assistant (healthsystem level - Metro Healthsystem)
  ('33333333-0000-0000-0000-000000000003', NULL, '00000000-0000-0000-0000-000000000001', 'Amanda Chen', 'amanda.chen@metrohealth.com', 'admin_assistant', true),
  
  -- Medical Directors (department level)
  ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', NULL, 'Dr. James Wilson', 'james.wilson@metrohealth.com', 'medical_director', true),
  ('33333333-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000003', NULL, 'Dr. Robert Garcia', 'robert.garcia@metrohealth.com', 'medical_director', true),
  ('33333333-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000004', NULL, 'Dr. Emily Wilson', 'emily.wilson@metrohealth.com', 'associate_medical_director', true),
  ('33333333-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000005', NULL, 'Dr. David Kim', 'david.kim@metrohealth.com', 'medical_director', true);

-- =====================================================
-- PROVIDERS
-- =====================================================
INSERT INTO pulsecheck_providers (id, name, email, provider_type, credential, primary_department_id, primary_director_id, hire_date, is_active) VALUES
  -- Metro General - Emergency Medicine (Dr. Wilson's team)
  ('44444444-0000-0000-0000-000000000001', 'James Anderson', 'james.anderson@metrohealth.com', 'physician', 'MD', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004', '2022-07-01', true),
  ('44444444-0000-0000-0000-000000000002', 'Lisa Chen', 'lisa.chen@metrohealth.com', 'physician', 'DO', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004', '2021-08-15', true),
  ('44444444-0000-0000-0000-000000000003', 'Marcus Williams', 'marcus.williams@metrohealth.com', 'apc', 'PA-C', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004', '2023-01-10', true),
  ('44444444-0000-0000-0000-000000000004', 'Sarah Johnson', 'sarah.johnson@metrohealth.com', 'apc', 'NP', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004', '2022-03-20', true),
  ('44444444-0000-0000-0000-000000000005', 'Kevin Park', 'kevin.park@metrohealth.com', 'physician', 'MD', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004', '2020-06-01', true),
  
  -- Metro Valley - Emergency Medicine (Dr. Garcia's team)
  ('44444444-0000-0000-0000-000000000009', 'Carlos Rodriguez', 'carlos.rodriguez@metrohealth.com', 'physician', 'MD', '22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000006', '2020-01-15', true),
  ('44444444-0000-0000-0000-000000000010', 'Michelle Davis', 'michelle.davis@metrohealth.com', 'physician', 'MD', '22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000006', '2022-04-01', true),
  ('44444444-0000-0000-0000-000000000011', 'Brian Scott', 'brian.scott@metrohealth.com', 'apc', 'PA-C', '22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000006', '2021-06-20', true),
  
  -- Metro Valley - Urgent Care (Dr. Emily Wilson's team)
  ('44444444-0000-0000-0000-000000000012', 'Amy Foster', 'amy.foster@metrohealth.com', 'physician', 'DO', '22222222-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000007', '2023-02-01', true),
  ('44444444-0000-0000-0000-000000000013', 'Daniel Moore', 'daniel.moore@metrohealth.com', 'apc', 'NP', '22222222-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000007', '2022-08-15', true),
  
  -- Metro Lakeside - Emergency Medicine (Dr. Kim's team)
  ('44444444-0000-0000-0000-000000000014', 'Jennifer White', 'jennifer.white@metrohealth.com', 'physician', 'MD', '22222222-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000008', '2021-03-01', true),
  ('44444444-0000-0000-0000-000000000015', 'Ryan Taylor', 'ryan.taylor@metrohealth.com', 'physician', 'DO', '22222222-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000008', '2022-10-15', true),
  ('44444444-0000-0000-0000-000000000016', 'Samantha Brown', 'samantha.brown@metrohealth.com', 'apc', 'PA-C', '22222222-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000008', '2023-05-01', true);

-- =====================================================
-- RATING CYCLES (Historical + Current)
-- =====================================================
INSERT INTO pulsecheck_cycles (id, name, description, start_date, due_date, reminder_cadence, status, created_by) VALUES
  -- Historical cycles (completed)
  ('55555555-0000-0000-0000-000000000002', 'Q2 2025 Pulse Check', 'Second quarter 2025 evaluation', '2025-04-01', '2025-06-30', 'weekly', 'completed', '33333333-0000-0000-0000-000000000001'),
  ('55555555-0000-0000-0000-000000000003', 'Q3 2025 Pulse Check', 'Third quarter 2025 evaluation', '2025-07-01', '2025-09-30', 'weekly', 'completed', '33333333-0000-0000-0000-000000000001'),
  ('55555555-0000-0000-0000-000000000004', 'Q4 2025 Pulse Check', 'Fourth quarter 2025 evaluation', '2025-10-01', '2025-12-31', 'weekly', 'completed', '33333333-0000-0000-0000-000000000001'),
  -- Current cycle (active)
  ('55555555-0000-0000-0000-000000000001', 'Q1 2026 Pulse Check', 'First quarter provider performance evaluation', '2026-01-01', '2026-03-31', 'weekly', 'active', '33333333-0000-0000-0000-000000000001');

-- =====================================================
-- HISTORICAL RATINGS (Metro General - Q2/Q3/Q4 2025)
-- Shows trends over time for sparklines
-- =====================================================

-- James Anderson: Improving trend (3.8 → 4.2 → 4.5)
-- Q2 2025 - Starting point (overall ~3.8)
INSERT INTO pulsecheck_ratings (id, cycle_id, provider_id, director_id, 
  eq_empathy_rapport, eq_communication, eq_stress_management, eq_self_awareness, eq_adaptability,
  pq_reliability, pq_integrity, pq_teachability, pq_documentation, pq_leadership,
  iq_clinical_management, iq_evidence_based, iq_procedural,
  metric_los, metric_imaging_util, metric_imaging_ct, metric_imaging_us, metric_imaging_mri, metric_pph,
  notes, status, completed_at) VALUES
  ('77777777-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004',
   4, 3, 4, 4, 4,
   4, 4, 4, 3, 3,
   4, 4, 4,
   195, 42.5, 55.0, 32.5, 40.0, 1.65,
   'Good start, room for growth', 'completed', '2025-06-25');

-- Q3 2025 - Improving (overall ~4.2)
INSERT INTO pulsecheck_ratings (id, cycle_id, provider_id, director_id, 
  eq_empathy_rapport, eq_communication, eq_stress_management, eq_self_awareness, eq_adaptability,
  pq_reliability, pq_integrity, pq_teachability, pq_documentation, pq_leadership,
  iq_clinical_management, iq_evidence_based, iq_procedural,
  metric_los, metric_imaging_util, metric_imaging_ct, metric_imaging_us, metric_imaging_mri, metric_pph,
  notes, status, completed_at) VALUES
  ('77777777-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004',
   4, 4, 4, 4, 5,
   5, 4, 4, 4, 4,
   5, 4, 4,
   178, 38.2, 48.0, 28.5, 38.0, 1.78,
   'Significant improvement this quarter', 'completed', '2025-09-28');

-- Q4 2025 - Strong (overall ~4.5)
INSERT INTO pulsecheck_ratings (id, cycle_id, provider_id, director_id, 
  eq_empathy_rapport, eq_communication, eq_stress_management, eq_self_awareness, eq_adaptability,
  pq_reliability, pq_integrity, pq_teachability, pq_documentation, pq_leadership,
  iq_clinical_management, iq_evidence_based, iq_procedural,
  metric_los, metric_imaging_util, metric_imaging_ct, metric_imaging_us, metric_imaging_mri, metric_pph,
  notes, status, completed_at) VALUES
  ('77777777-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004',
   5, 4, 5, 4, 5,
   5, 5, 4, 4, 4,
   5, 5, 5,
   165, 35.8, 42.5, 26.0, 39.0, 1.92,
   'Excellent quarter, ready for leadership role', 'completed', '2025-12-20');

-- Lisa Chen: Stable high performer (4.4 → 4.5 → 4.5)
-- Q2 2025
INSERT INTO pulsecheck_ratings (id, cycle_id, provider_id, director_id, 
  eq_empathy_rapport, eq_communication, eq_stress_management, eq_self_awareness, eq_adaptability,
  pq_reliability, pq_integrity, pq_teachability, pq_documentation, pq_leadership,
  iq_clinical_management, iq_evidence_based, iq_procedural,
  metric_los, metric_imaging_util, metric_imaging_ct, metric_imaging_us, metric_imaging_mri, metric_pph,
  notes, status, completed_at) VALUES
  ('77777777-0000-0000-0000-000000000004', '55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000004',
   4, 5, 5, 4, 4,
   4, 5, 4, 5, 4,
   4, 5, 4,
   152, 41.0, 52.0, 35.0, 36.0, 2.05,
   'Consistently excellent', 'completed', '2025-06-22');

-- Q3 2025
INSERT INTO pulsecheck_ratings (id, cycle_id, provider_id, director_id, 
  eq_empathy_rapport, eq_communication, eq_stress_management, eq_self_awareness, eq_adaptability,
  pq_reliability, pq_integrity, pq_teachability, pq_documentation, pq_leadership,
  iq_clinical_management, iq_evidence_based, iq_procedural,
  metric_los, metric_imaging_util, metric_imaging_ct, metric_imaging_us, metric_imaging_mri, metric_pph,
  notes, status, completed_at) VALUES
  ('77777777-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000004',
   4, 5, 5, 4, 5,
   4, 5, 5, 5, 4,
   5, 5, 4,
   148, 39.5, 48.5, 32.0, 38.0, 2.12,
   'Maintains high standards', 'completed', '2025-09-25');

-- Q4 2025
INSERT INTO pulsecheck_ratings (id, cycle_id, provider_id, director_id, 
  eq_empathy_rapport, eq_communication, eq_stress_management, eq_self_awareness, eq_adaptability,
  pq_reliability, pq_integrity, pq_teachability, pq_documentation, pq_leadership,
  iq_clinical_management, iq_evidence_based, iq_procedural,
  metric_los, metric_imaging_util, metric_imaging_ct, metric_imaging_us, metric_imaging_mri, metric_pph,
  notes, status, completed_at) VALUES
  ('77777777-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000004',
   4, 5, 5, 5, 4,
   5, 5, 5, 5, 4,
   4, 5, 5,
   145, 38.0, 45.0, 30.0, 39.0, 2.18,
   'Role model for the department', 'completed', '2025-12-18');

-- Marcus Williams: Declining trend (4.0 → 3.9 → 3.8)
-- Q2 2025
INSERT INTO pulsecheck_ratings (id, cycle_id, provider_id, director_id, 
  eq_empathy_rapport, eq_communication, eq_stress_management, eq_self_awareness, eq_adaptability,
  pq_reliability, pq_integrity, pq_teachability, pq_documentation, pq_leadership,
  iq_clinical_management, iq_evidence_based, iq_procedural,
  metric_los, metric_imaging_util, metric_imaging_ct, metric_imaging_us, metric_imaging_mri, metric_pph,
  notes, status, completed_at) VALUES
  ('77777777-0000-0000-0000-000000000007', '55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000004',
   4, 4, 4, 4, 4,
   4, 4, 4, 4, 4,
   4, 4, 4,
   188, 48.5, 62.0, 38.5, 45.0, 1.55,
   'Solid performance', 'completed', '2025-06-28');

-- Q3 2025
INSERT INTO pulsecheck_ratings (id, cycle_id, provider_id, director_id, 
  eq_empathy_rapport, eq_communication, eq_stress_management, eq_self_awareness, eq_adaptability,
  pq_reliability, pq_integrity, pq_teachability, pq_documentation, pq_leadership,
  iq_clinical_management, iq_evidence_based, iq_procedural,
  metric_los, metric_imaging_util, metric_imaging_ct, metric_imaging_us, metric_imaging_mri, metric_pph,
  notes, status, completed_at) VALUES
  ('77777777-0000-0000-0000-000000000008', '55555555-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000004',
   4, 4, 3, 4, 4,
   4, 4, 4, 3, 4,
   4, 4, 4,
   195, 52.0, 68.0, 42.0, 46.0, 1.48,
   'Some concerns about documentation and stress management', 'completed', '2025-09-30');

-- Q4 2025
INSERT INTO pulsecheck_ratings (id, cycle_id, provider_id, director_id, 
  eq_empathy_rapport, eq_communication, eq_stress_management, eq_self_awareness, eq_adaptability,
  pq_reliability, pq_integrity, pq_teachability, pq_documentation, pq_leadership,
  iq_clinical_management, iq_evidence_based, iq_procedural,
  metric_los, metric_imaging_util, metric_imaging_ct, metric_imaging_us, metric_imaging_mri, metric_pph,
  notes, status, completed_at) VALUES
  ('77777777-0000-0000-0000-000000000009', '55555555-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000004',
   4, 4, 3, 4, 4,
   4, 4, 4, 3, 3,
   4, 3, 4,
   205, 55.2, 72.5, 45.0, 48.0, 1.42,
   'Need to address declining metrics and documentation', 'completed', '2025-12-22');

-- =====================================================
-- SAMPLE RATINGS (Mix of completed and pending)
-- =====================================================

-- Dr. Wilson's (new medical director) completed ratings (3 of 5) - Q1 2026
INSERT INTO pulsecheck_ratings (id, cycle_id, provider_id, director_id, 
  eq_empathy_rapport, eq_communication, eq_stress_management, eq_self_awareness, eq_adaptability,
  pq_reliability, pq_integrity, pq_teachability, pq_documentation, pq_leadership,
  iq_clinical_management, iq_evidence_based, iq_procedural,
  metric_los, metric_imaging_util, metric_imaging_ct, metric_imaging_us, metric_imaging_mri, metric_pph,
  notes, strengths, areas_for_improvement, status, completed_at) VALUES
  
  -- James Anderson Q1 2026 (continuing improvement trend: 4.5)
  ('66666666-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004',
   5, 4, 4, 4, 5,
   5, 5, 4, 4, 4,
   5, 4, 5,
   158, 33.5, 40.0, 25.0, 35.5, 2.01,
   'Strong performer, excellent team player', 'Exceptional clinical skills and patient rapport', 'Could improve documentation timeliness', 'completed', NOW() - INTERVAL '5 days'),
   
  -- Lisa Chen Q1 2026 (stable high: 4.5)
  ('66666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000004',
   4, 5, 5, 4, 4,
   4, 5, 5, 5, 4,
   4, 5, 4,
   142, 36.5, 42.0, 28.5, 39.0, 2.22,
   'Excellent physician with strong evidence-based approach', 'Thorough documentation, stays current with literature', 'Continue developing leadership skills', 'completed', NOW() - INTERVAL '3 days'),
   
  -- Marcus Williams Q1 2026 (continuing decline: 3.8)
  ('66666666-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000004',
   4, 4, 3, 4, 4,
   4, 4, 5, 3, 3,
   4, 3, 4,
   212, 58.0, 75.0, 48.0, 51.0, 1.38,
   'Good progress in first year', 'Very teachable, eager to learn', 'Work on stress management during high volume', 'completed', NOW() - INTERVAL '1 day');

-- Dr. Wilson's pending ratings (2 of 5)
INSERT INTO pulsecheck_ratings (id, cycle_id, provider_id, director_id, status) VALUES
  ('66666666-0000-0000-0000-000000000004', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000004', 'pending'),
  ('66666666-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000004', 'pending');

-- Dr. Garcia's completed ratings (all complete)
INSERT INTO pulsecheck_ratings (id, cycle_id, provider_id, director_id, 
  eq_empathy_rapport, eq_communication, eq_stress_management, eq_self_awareness, eq_adaptability,
  pq_reliability, pq_integrity, pq_teachability, pq_documentation, pq_leadership,
  iq_clinical_management, iq_evidence_based, iq_procedural,
  notes, strengths, areas_for_improvement, status, completed_at) VALUES
  
  ('66666666-0000-0000-0000-000000000009', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000009', '33333333-0000-0000-0000-000000000006',
   5, 5, 5, 5, 4,
   5, 5, 4, 5, 5,
   5, 5, 5,
   'Outstanding physician, department leader', 'Exceptional in all areas, natural mentor', 'None significant', 'completed', NOW() - INTERVAL '10 days'),
   
  ('66666666-0000-0000-0000-000000000010', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000010', '33333333-0000-0000-0000-000000000006',
   4, 4, 4, 3, 4,
   4, 4, 4, 4, 3,
   4, 4, 4,
   'Solid performer', 'Reliable and thorough', 'Develop more self-awareness about impact on team', 'completed', NOW() - INTERVAL '8 days'),
   
  ('66666666-0000-0000-0000-000000000011', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000011', '33333333-0000-0000-0000-000000000006',
   4, 4, 4, 4, 5,
   5, 4, 5, 4, 4,
   4, 4, 4,
   'Excellent PA, very adaptable', 'Quick learner, great with patients', 'Continue building procedural skills', 'completed', NOW() - INTERVAL '7 days');

-- Dr. Emily Wilson's ratings (1 completed, 1 pending)
INSERT INTO pulsecheck_ratings (id, cycle_id, provider_id, director_id, 
  eq_empathy_rapport, eq_communication, eq_stress_management, eq_self_awareness, eq_adaptability,
  pq_reliability, pq_integrity, pq_teachability, pq_documentation, pq_leadership,
  iq_clinical_management, iq_evidence_based, iq_procedural,
  notes, strengths, areas_for_improvement, status, completed_at) VALUES
  
  ('66666666-0000-0000-0000-000000000012', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000012', '33333333-0000-0000-0000-000000000007',
   3, 4, 3, 3, 4,
   4, 4, 4, 3, 3,
   4, 4, 3,
   'New physician showing good progress', 'Strong clinical foundation', 'Improve documentation quality and stress management', 'completed', NOW() - INTERVAL '2 days');

INSERT INTO pulsecheck_ratings (id, cycle_id, provider_id, director_id, status) VALUES
  ('66666666-0000-0000-0000-000000000013', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000013', '33333333-0000-0000-0000-000000000007', 'pending');

-- Dr. Kim's ratings (all pending)
INSERT INTO pulsecheck_ratings (id, cycle_id, provider_id, director_id, status) VALUES
  ('66666666-0000-0000-0000-000000000014', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000014', '33333333-0000-0000-0000-000000000008', 'pending'),
  ('66666666-0000-0000-0000-000000000015', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000015', '33333333-0000-0000-0000-000000000008', 'pending'),
  ('66666666-0000-0000-0000-000000000016', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000016', '33333333-0000-0000-0000-000000000008', 'pending');

-- =====================================================
-- TEST ACCOUNTS SUMMARY
-- =====================================================
-- 
-- Regional Medical Director (healthsystem level - Metro Healthsystem):
--   Email: michael.thompson@metrohealth.com
--
-- Admin Assistant (healthsystem level - Metro Healthsystem):
--   Email: amanda.chen@metrohealth.com
--
-- Medical Directors (can rate their providers):
--   Email: james.wilson@metrohealth.com (Metro General, 5 providers, 3 completed, 2 pending)
--   Email: robert.garcia@metrohealth.com (Metro Valley, 3 providers, all completed)
--   Email: emily.wilson@metrohealth.com (Metro Valley Urgent Care, 2 providers, 1 completed, 1 pending)
--   Email: david.kim@metrohealth.com (Metro Lakeside, 3 providers, all pending)
--
-- =====================================================
