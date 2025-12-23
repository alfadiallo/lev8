-- Create Test Analytics Data for Larissa Tavares
-- Resident ID: 3ba5dff9-5699-4499-8e51-0d8cd930b764
-- Schema-compliant version matching analytics_foundation.sql

-- ============================================================================
-- CLEANUP: Delete any existing test data for Larissa
-- ============================================================================
DELETE FROM public.ite_scores WHERE resident_id = '3ba5dff9-5699-4499-8e51-0d8cd930b764';
DELETE FROM public.period_scores WHERE resident_id = '3ba5dff9-5699-4499-8e51-0d8cd930b764';
DELETE FROM public.swot_summaries WHERE resident_id = '3ba5dff9-5699-4499-8e51-0d8cd930b764';

-- ============================================================================
-- SWOT SUMMARIES (JSONB format with theme/description objects)
-- ============================================================================

-- PGY-1 Fall
INSERT INTO public.swot_summaries (resident_id, period_label, strengths, weaknesses, opportunities, threats, n_comments_analyzed, ai_confidence) VALUES (
  '3ba5dff9-5699-4499-8e51-0d8cd930b764', 'PGY-1 Fall',
  '[{"theme": "Patient Communication", "description": "Demonstrates excellent communication with patients and families"}, {"theme": "Clinical Curiosity", "description": "Eager to learn and asks thoughtful questions"}, {"theme": "Teamwork", "description": "Works well within the team structure"}, {"theme": "History Taking", "description": "Strong ability to gather comprehensive histories"}]'::jsonb,
  '[{"theme": "Physical Exam", "description": "Occasionally rushes through physical exams"}, {"theme": "Documentation", "description": "Needs more practice with procedure documentation"}, {"theme": "Time Management", "description": "Time management during busy shifts could be improved"}]'::jsonb,
  '[{"theme": "Clinical Reasoning", "description": "Great foundation for developing advanced clinical reasoning"}, {"theme": "Leadership", "description": "Showing early leadership potential with students"}, {"theme": "Interdisciplinary", "description": "Strong rapport with nursing staff"}]'::jsonb,
  '[{"theme": "Burnout Risk", "description": "High volume environment can be overwhelming"}, {"theme": "Work-Life Balance", "description": "Need to maintain self-care"}]'::jsonb,
  28, 0.85
);

-- PGY-1 Spring
INSERT INTO public.swot_summaries (resident_id, period_label, strengths, weaknesses, opportunities, threats, n_comments_analyzed, ai_confidence) VALUES (
  '3ba5dff9-5699-4499-8e51-0d8cd930b764', 'PGY-1 Spring',
  '[{"theme": "Workflow Efficiency", "description": "Significant improvement in time management and workflow"}, {"theme": "Multitasking", "description": "Excellent at managing multiple patients simultaneously"}, {"theme": "Clinical Decision-Making", "description": "Strong clinical decisions with increased confidence"}, {"theme": "Collaboration", "description": "Outstanding teamwork"}]'::jsonb,
  '[{"theme": "Resuscitations", "description": "Still developing comfort with high-acuity resuscitations"}, {"theme": "Documentation Lag", "description": "Documentation can lag during busy shifts"}, {"theme": "Difficult Conversations", "description": "Needs more experience with difficult conversations"}]'::jsonb,
  '[{"theme": "Autonomy", "description": "Ready for more autonomy in patient management"}, {"theme": "Technical Skills", "description": "Could benefit from additional ultrasound training"}, {"theme": "Teaching", "description": "Natural teaching ability should be leveraged"}]'::jsonb,
  '[{"theme": "Over-confidence", "description": "Risk of over-confidence as skills develop"}, {"theme": "Attention to Detail", "description": "Maintain attention during routine cases"}]'::jsonb,
  32, 0.87
);

-- PGY-2 Fall
INSERT INTO public.swot_summaries (resident_id, period_label, strengths, weaknesses, opportunities, threats, n_comments_analyzed, ai_confidence) VALUES (
  '3ba5dff9-5699-4499-8e51-0d8cd930b764', 'PGY-2 Fall',
  '[{"theme": "Resuscitation Leadership", "description": "Excelling in resuscitation team leadership"}, {"theme": "Complex Cases", "description": "Excellent clinical judgment in complex cases"}, {"theme": "Procedural Skills", "description": "Strong procedural skills with high success rates"}, {"theme": "Mentorship", "description": "Exceptional at teaching junior residents"}]'::jsonb,
  '[{"theme": "Over-responsibility", "description": "Sometimes takes on too much responsibility"}, {"theme": "Delegation", "description": "Needs to work on delegation"}, {"theme": "Perfectionism", "description": "Can be perfectionistic leading to stress"}]'::jsonb,
  '[{"theme": "Simulation Education", "description": "Leadership role in simulation training"}, {"theme": "Research", "description": "Potential for research involvement"}, {"theme": "Advanced Skills", "description": "Develop advanced airway management expertise"}]'::jsonb,
  '[{"theme": "Workload", "description": "Workload intensity increasing"}, {"theme": "Boundaries", "description": "Need to set better boundaries"}, {"theme": "Criticism Sensitivity", "description": "Risk of taking criticism too personally"}]'::jsonb,
  34, 0.89
);

-- PGY-2 Spring
INSERT INTO public.swot_summaries (resident_id, period_label, strengths, weaknesses, opportunities, threats, n_comments_analyzed, ai_confidence) VALUES (
  '3ba5dff9-5699-4499-8e51-0d8cd930b764', 'PGY-2 Spring',
  '[{"theme": "Consistent Excellence", "description": "Excellent performance across all domains"}, {"theme": "Critical Care", "description": "Outstanding in critical care scenarios"}, {"theme": "Leadership", "description": "Natural leader during mass casualty drills"}, {"theme": "Respect", "description": "Highly respected by peers and faculty"}]'::jsonb,
  '[{"theme": "Self-Doubt", "description": "Tendency to second-guess correct decisions"}, {"theme": "Confidence", "description": "Needs more confidence in own judgment"}, {"theme": "Balance", "description": "Work-life balance continues to be challenging"}]'::jsonb,
  '[{"theme": "Chief Resident", "description": "Ready for chief resident responsibilities"}, {"theme": "QI Leadership", "description": "Could lead quality improvement project"}, {"theme": "Fellowship", "description": "Excellent candidate for advanced fellowship"}]'::jsonb,
  '[{"theme": "Imposter Syndrome", "description": "Imposter syndrome despite strong performance"}, {"theme": "Perspective", "description": "Need to maintain perspective during difficult cases"}]'::jsonb,
  38, 0.91
);

-- PGY-3 Fall
INSERT INTO public.swot_summaries (resident_id, period_label, strengths, weaknesses, opportunities, threats, n_comments_analyzed, ai_confidence) VALUES (
  '3ba5dff9-5699-4499-8e51-0d8cd930b764', 'PGY-3 Fall',
  '[{"theme": "Near-Attending Level", "description": "Functioning at near-attending level"}, {"theme": "Clinical Reasoning", "description": "Exceptional clinical reasoning and decision-making"}, {"theme": "Mentorship Excellence", "description": "Outstanding mentor to junior residents"}, {"theme": "QI Leadership", "description": "Leads quality improvement initiatives effectively"}]'::jsonb,
  '[{"theme": "Uncertainty", "description": "Needs to continue developing comfort with uncertainty"}, {"theme": "Self-Critical", "description": "Can be too self-critical"}, {"theme": "Board Stress", "description": "Board exam preparation adding stress"}]'::jsonb,
  '[{"theme": "Subspecialty", "description": "Perfect time for subspecialty exploration"}, {"theme": "Department Leadership", "description": "Leadership opportunities in department committees"}, {"theme": "Academic Medicine", "description": "Potential for academic medicine career"}]'::jsonb,
  '[{"theme": "Board Exam Anxiety", "description": "Board exam anxiety"}, {"theme": "Job Search", "description": "Job search stress"}, {"theme": "Momentum", "description": "Maintaining momentum through final year"}]'::jsonb,
  36, 0.92
);

-- PGY-3 Spring
INSERT INTO public.swot_summaries (resident_id, period_label, strengths, weaknesses, opportunities, threats, n_comments_analyzed, ai_confidence) VALUES (
  '3ba5dff9-5699-4499-8e51-0d8cd930b764', 'PGY-3 Spring',
  '[{"theme": "Exceptional Performance", "description": "Consistently exceptional across all competencies"}, {"theme": "Role Model", "description": "Serves as role model for entire program"}, {"theme": "Patient Outcomes", "description": "Outstanding patient outcomes"}, {"theme": "Teaching Excellence", "description": "Exceptional teaching and mentorship skills"}]'::jsonb,
  '[{"theme": "Transition Planning", "description": "Transition planning to attending role"}, {"theme": "Boundary Setting", "description": "Needs to establish boundaries as attending"}, {"theme": "Anxiety", "description": "Some anxiety about independent practice"}]'::jsonb,
  '[{"theme": "Academic Positions", "description": "Strong candidate for academic positions"}, {"theme": "Medical Education", "description": "Natural fit for medical education roles"}, {"theme": "Leadership", "description": "Potential for leadership in emergency medicine"}]'::jsonb,
  '[{"theme": "Transition Stress", "description": "Transition to attending life"}, {"theme": "Financial", "description": "Financial pressures"}, {"theme": "Confidence", "description": "Maintaining confidence in new role"}]'::jsonb,
  38, 0.93
);

-- ============================================================================
-- PERIOD SCORES (Faculty/AI scores, no self-assessment for simplicity)
-- ============================================================================

-- PGY-1 Fall
INSERT INTO public.period_scores (
  resident_id, period_label,
  faculty_eq_avg, faculty_pq_avg, faculty_iq_avg, faculty_n_raters,
  ai_eq_avg, ai_pq_avg, ai_iq_avg, ai_n_comments, ai_confidence_avg
) VALUES (
  '3ba5dff9-5699-4499-8e51-0d8cd930b764', 'PGY-1 Fall',
  7.8, 6.5, 7.2, 8,
  7.6, 6.8, 7.4, 28, 0.85
);

-- PGY-1 Spring
INSERT INTO public.period_scores (
  resident_id, period_label,
  faculty_eq_avg, faculty_pq_avg, faculty_iq_avg, faculty_n_raters,
  ai_eq_avg, ai_pq_avg, ai_iq_avg, ai_n_comments, ai_confidence_avg
) VALUES (
  '3ba5dff9-5699-4499-8e51-0d8cd930b764', 'PGY-1 Spring',
  8.2, 7.3, 7.8, 10,
  8.0, 7.5, 8.0, 32, 0.87
);

-- PGY-2 Fall
INSERT INTO public.period_scores (
  resident_id, period_label,
  faculty_eq_avg, faculty_pq_avg, faculty_iq_avg, faculty_n_raters,
  ai_eq_avg, ai_pq_avg, ai_iq_avg, ai_n_comments, ai_confidence_avg
) VALUES (
  '3ba5dff9-5699-4499-8e51-0d8cd930b764', 'PGY-2 Fall',
  8.5, 8.1, 8.3, 12,
  8.3, 8.2, 8.5, 34, 0.89
);

-- PGY-2 Spring
INSERT INTO public.period_scores (
  resident_id, period_label,
  faculty_eq_avg, faculty_pq_avg, faculty_iq_avg, faculty_n_raters,
  ai_eq_avg, ai_pq_avg, ai_iq_avg, ai_n_comments, ai_confidence_avg
) VALUES (
  '3ba5dff9-5699-4499-8e51-0d8cd930b764', 'PGY-2 Spring',
  8.8, 8.5, 8.6, 14,
  8.6, 8.7, 8.8, 38, 0.91
);

-- PGY-3 Fall
INSERT INTO public.period_scores (
  resident_id, period_label,
  faculty_eq_avg, faculty_pq_avg, faculty_iq_avg, faculty_n_raters,
  ai_eq_avg, ai_pq_avg, ai_iq_avg, ai_n_comments, ai_confidence_avg
) VALUES (
  '3ba5dff9-5699-4499-8e51-0d8cd930b764', 'PGY-3 Fall',
  9.0, 8.7, 8.8, 15,
  8.8, 8.9, 9.0, 36, 0.92
);

-- PGY-3 Spring
INSERT INTO public.period_scores (
  resident_id, period_label,
  faculty_eq_avg, faculty_pq_avg, faculty_iq_avg, faculty_n_raters,
  ai_eq_avg, ai_pq_avg, ai_iq_avg, ai_n_comments, ai_confidence_avg
) VALUES (
  '3ba5dff9-5699-4499-8e51-0d8cd930b764', 'PGY-3 Spring',
  9.2, 8.9, 9.0, 16,
  9.0, 9.1, 9.2, 38, 0.93
);

-- ============================================================================
-- ITE SCORES
-- ============================================================================

INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, percentile, raw_score) VALUES
  ('3ba5dff9-5699-4499-8e51-0d8cd930b764', '2023-03-15'::date, '2022-2023', 'PGY-1', 2, 52),
  ('3ba5dff9-5699-4499-8e51-0d8cd930b764', '2024-03-15'::date, '2023-2024', 'PGY-2', 7, 62),
  ('3ba5dff9-5699-4499-8e51-0d8cd930b764', '2025-03-15'::date, '2024-2025', 'PGY-3', 30, 71);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- SWOT summaries
SELECT period_label, jsonb_array_length(strengths) as n_strengths, jsonb_array_length(weaknesses) as n_weaknesses, n_comments_analyzed, ai_confidence
FROM public.swot_summaries
WHERE resident_id = '3ba5dff9-5699-4499-8e51-0d8cd930b764'
ORDER BY period_label;

-- Period scores
SELECT period_label, faculty_eq_avg, faculty_pq_avg, faculty_iq_avg, ai_n_comments
FROM public.period_scores
WHERE resident_id = '3ba5dff9-5699-4499-8e51-0d8cd930b764'
ORDER BY period_label;

-- ITE scores
SELECT test_date, pgy_level, academic_year, percentile, raw_score
FROM public.ite_scores
WHERE resident_id = '3ba5dff9-5699-4499-8e51-0d8cd930b764'
ORDER BY test_date;

/*
✅ Created test data for Larissa Tavares (3ba5dff9-5699-4499-8e51-0d8cd930b764):
- 6 SWOT summaries (JSONB format with theme/description objects)
- 6 Period scores (Faculty and AI scores)
- 3 ITE scores

Next: Start dev server and test the dashboard!
  npm run dev
  http://localhost:3000/modules/understand/overview
*/
