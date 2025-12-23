-- Get resident IDs for residents with EQ+PQ+IQ data
SELECT 
  r.id as resident_id,
  up.full_name,
  ac.class_year,
  COUNT(sr.id) as rating_count
FROM public.residents r
JOIN public.user_profiles up ON r.user_id = up.id
JOIN public.academic_classes ac ON r.class_id = ac.id
LEFT JOIN public.structured_ratings sr ON r.id = sr.resident_id
WHERE up.full_name IN ('Alexandra Blanco', 'Spencer Rice', 'Farah Azzouz', 'Kenneth Holton')
GROUP BY r.id, up.full_name, ac.class_year
ORDER BY rating_count DESC;

