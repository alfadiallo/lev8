-- Check if Larissa has any structured_ratings
SELECT 
  COUNT(*) as total_ratings,
  COUNT(CASE WHEN rater_type = 'faculty' THEN 1 END) as faculty_ratings,
  COUNT(CASE WHEN rater_type = 'self' THEN 1 END) as self_ratings
FROM public.structured_ratings
WHERE resident_id = '3ba5dff9-5699-4499-8e51-0d8cd930b764';

-- Show all ratings for Larissa
SELECT 
  rater_type,
  period_label,
  eq_avg,
  pq_avg,
  iq_avg,
  created_at
FROM public.structured_ratings
WHERE resident_id = '3ba5dff9-5699-4499-8e51-0d8cd930b764'
ORDER BY created_at DESC;

-- Check what residents DO have ratings
SELECT 
  up.full_name,
  COUNT(*) as rating_count
FROM public.structured_ratings sr
JOIN public.residents r ON sr.resident_id = r.id
JOIN public.user_profiles up ON r.user_id = up.id
GROUP BY up.full_name
ORDER BY rating_count DESC
LIMIT 10;

