-- Seed Basic Data for Lev8
-- Run this in Supabase SQL Editor

-- Insert health system (if not exists)
INSERT INTO health_systems (id, name, abbreviation, location)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Memorial Healthcare System',
  'MHS',
  'Hollywood, FL'
)
ON CONFLICT (id) DO NOTHING;

-- Insert program (if not exists)
INSERT INTO programs (id, health_system_id, name, specialty)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Emergency Medicine Residency',
  'Emergency Medicine'
)
ON CONFLICT (id) DO NOTHING;

-- Insert academic classes (if not exists)
INSERT INTO academic_classes (program_id, class_year, start_date, is_active)
VALUES 
  ('b0000000-0000-0000-0000-000000000001', 'PGY-1', '2024-07-01', true),
  ('b0000000-0000-0000-0000-000000000001', 'PGY-2', '2023-07-01', true),
  ('b0000000-0000-0000-0000-000000000001', 'PGY-3', '2022-07-01', true)
ON CONFLICT DO NOTHING;

-- Insert module buckets (if not exists)
INSERT INTO module_buckets (institution_id, name, description, display_order, is_active)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'Learn', 'Educational content and clinical learning modules', 1, true),
  ('a0000000-0000-0000-0000-000000000001', 'Grow', 'Personal development and reflection tools', 2, true),
  ('a0000000-0000-0000-0000-000000000001', 'Understand', 'Assessment and comprehension modules', 3, true)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Seed data inserted successfully!' as message;

