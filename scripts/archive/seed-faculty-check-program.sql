-- ============================================================================
-- CHECK EXISTING PROGRAMS
-- ============================================================================
-- Run this first to see what programs exist

SELECT 
  id,
  name,
  health_system_id
FROM public.programs
ORDER BY name;

-- Also check health systems
SELECT 
  id,
  name
FROM public.health_systems
ORDER BY name;

