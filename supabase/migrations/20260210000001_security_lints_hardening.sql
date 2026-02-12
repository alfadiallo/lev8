-- ============================================================================
-- Supabase Security Lints Hardening
-- Fixes:
--   - RLS Disabled in Public (selected tables)
--   - Policy exists but RLS disabled (safety re-enable)
--   - Security Definer View (migrate to security_invoker)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Enable RLS on flagged public tables
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rosh_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.evaluation_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.feedback_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.swot_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.procedure_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.access_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.device_trusts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.evaluation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resident_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.medhub_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.health_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.academic_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.medhub_name_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vignette_versions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2) Service role full-access policies for newly RLS-protected tables
--    (keeps server-side/background jobs functioning while still protecting
--     anon/authenticated traffic through explicit policies)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'rosh_completion',
    'evaluation_periods',
    'feedback_comments',
    'swot_analyses',
    'performance_metrics',
    'procedure_logs',
    'generated_reports',
    'audit_logs',
    'access_permissions',
    'evaluation_comments',
    'resident_metrics',
    'medhub_staging',
    'medhub_name_overrides'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = t AND c.relkind = 'r'
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS service_role_manage_%I ON public.%I', t, t);
      EXECUTE format(
        'CREATE POLICY service_role_manage_%I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Lookup table policies required by active authenticated flows
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS health_systems_authenticated_select ON public.health_systems;
CREATE POLICY health_systems_authenticated_select ON public.health_systems
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS programs_authenticated_select ON public.programs;
CREATE POLICY programs_authenticated_select ON public.programs
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS academic_classes_authenticated_select ON public.academic_classes;
CREATE POLICY academic_classes_authenticated_select ON public.academic_classes
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Service role management for lookup tables
DROP POLICY IF EXISTS service_role_manage_health_systems ON public.health_systems;
CREATE POLICY service_role_manage_health_systems ON public.health_systems
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_manage_programs ON public.programs;
CREATE POLICY service_role_manage_programs ON public.programs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_manage_academic_classes ON public.academic_classes;
CREATE POLICY service_role_manage_academic_classes ON public.academic_classes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Device trust should be user-scoped under RLS
DROP POLICY IF EXISTS device_trusts_select_own ON public.device_trusts;
CREATE POLICY device_trusts_select_own ON public.device_trusts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS device_trusts_insert_own ON public.device_trusts;
CREATE POLICY device_trusts_insert_own ON public.device_trusts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS device_trusts_delete_own ON public.device_trusts;
CREATE POLICY device_trusts_delete_own ON public.device_trusts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS service_role_manage_device_trusts ON public.device_trusts;
CREATE POLICY service_role_manage_device_trusts ON public.device_trusts
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 4) Convert externally consumed flagged views to security invoker
-- ---------------------------------------------------------------------------
ALTER VIEW IF EXISTS public.rosh_completion_latest SET (security_invoker = true);
ALTER VIEW IF EXISTS public.methodology_evolution_summary SET (security_invoker = true);
ALTER VIEW IF EXISTS public.residents_with_pgy SET (security_invoker = true);
ALTER VIEW IF EXISTS public.pending_evolution_triggers SET (security_invoker = true);
ALTER VIEW IF EXISTS public.ite_scores_with_rank SET (security_invoker = true);
ALTER VIEW IF EXISTS public.pulsecheck_dept_imaging_averages SET (security_invoker = true);
ALTER VIEW IF EXISTS public.rosh_class_averages SET (security_invoker = true);
ALTER VIEW IF EXISTS public.resident_version_comparison SET (security_invoker = true);
ALTER VIEW IF EXISTS public.ite_class_statistics SET (security_invoker = true);
ALTER VIEW IF EXISTS public.pulsecheck_site_settings SET (security_invoker = true);
ALTER VIEW IF EXISTS public.pulsecheck_ratings_with_totals SET (security_invoker = true);
