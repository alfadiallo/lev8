-- ============================================================================
-- Quick Check: Verify Programs Exist
-- Run this to check if programs are set up correctly
-- ============================================================================

-- Check health systems
SELECT '=== HEALTH SYSTEMS ===' as info;
SELECT id, name, abbreviation, location 
FROM public.health_systems
ORDER BY created_at;

-- Check programs
SELECT '=== PROGRAMS ===' as info;
SELECT 
  p.id,
  p.name,
  p.specialty,
  hs.name as institution_name
FROM public.programs p
LEFT JOIN public.health_systems hs ON hs.id = p.health_system_id
ORDER BY p.created_at;

-- Check academic classes
SELECT '=== ACADEMIC CLASSES ===' as info;
SELECT 
  ac.id,
  ac.class_year,
  ac.is_active,
  p.name as program_name
FROM public.academic_classes ac
LEFT JOIN public.programs p ON p.id = ac.program_id
ORDER BY ac.created_at;

-- Summary
SELECT '=== SUMMARY ===' as info;
SELECT 
  (SELECT COUNT(*) FROM public.health_systems) as health_systems_count,
  (SELECT COUNT(*) FROM public.programs) as programs_count,
  (SELECT COUNT(*) FROM public.academic_classes) as academic_classes_count;




