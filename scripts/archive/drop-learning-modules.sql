-- Drop all learning module tables for fresh migration
DROP TABLE IF EXISTS public.running_board_sessions CASCADE;
DROP TABLE IF EXISTS public.running_board_configs CASCADE;
DROP TABLE IF EXISTS public.acls_sessions CASCADE;
DROP TABLE IF EXISTS public.acls_scenarios CASCADE;
DROP TABLE IF EXISTS public.session_analytics CASCADE;
DROP TABLE IF EXISTS public.training_sessions CASCADE;
DROP TABLE IF EXISTS public.case_attempts CASCADE;
DROP TABLE IF EXISTS public.vignettes CASCADE;
DROP TABLE IF EXISTS public.clinical_cases CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;

-- Drop the update function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Verification
SELECT 
  table_name,
  '❌ Should be GONE' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'modules', 'clinical_cases', 'case_attempts', 'vignettes',
    'training_sessions', 'session_analytics', 'acls_scenarios',
    'acls_sessions', 'running_board_configs', 'running_board_sessions'
  );


