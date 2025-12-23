-- Check Larissa's period scores
SELECT 
  ps.period_label,
  ps.faculty_eq_avg,
  ps.faculty_pq_avg,
  ps.faculty_iq_avg,
  ps.faculty_n_raters,
  ps.self_eq_avg,
  ps.self_pq_avg,
  ps.self_iq_avg,
  ps.self_faculty_gap_eq,
  ps.self_faculty_gap_pq,
  ps.self_faculty_gap_iq
FROM public.period_scores ps
WHERE ps.resident_id = '3ba5dff9-5699-4499-8e51-0d8cd930b764'
ORDER BY ps.period_label;

