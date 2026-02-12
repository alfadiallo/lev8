-- ============================================================================
-- Supabase Warning Hardening
-- Addresses:
--   - function_search_path_mutable
--   - rls_policy_always_true (targeted)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Fix mutable search_path for app-defined public functions
--    (skip extension-owned functions)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  fn_signature TEXT;
BEGIN
  FOR fn_signature IN
    SELECT p.oid::regprocedure::text
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
        WHERE cfg LIKE 'search_path=%'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend d
        JOIN pg_extension e ON e.oid = d.refobjid
        WHERE d.classid = 'pg_proc'::regclass
          AND d.objid = p.oid
          AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path TO public, pg_catalog',
      fn_signature
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Harden access_requests permissive INSERT policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS access_requests_insert ON public.access_requests;
DROP POLICY IF EXISTS access_requests_insert_public ON public.access_requests;

CREATE POLICY access_requests_insert_public ON public.access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    personal_email IS NOT NULL
    AND full_name IS NOT NULL
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND created_user_id IS NULL
  );

-- ---------------------------------------------------------------------------
-- 3) Harden interview_sessions permissive INSERT policy
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create sessions" ON public.interview_sessions;

CREATE POLICY "Users can create sessions" ON public.interview_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      created_by_user_id = auth.uid()
      OR creator_email = (
        SELECT email FROM public.user_profiles WHERE id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 4) Harden ccc_note_history permissive INSERT policy
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "ccc_note_history_insert" ON public.ccc_note_history;

CREATE POLICY "ccc_note_history_insert" ON public.ccc_note_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    changed_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.ccc_notes n
      WHERE n.id = note_id
    )
  );

-- ---------------------------------------------------------------------------
-- 5) Restrict Pulse Check "full access" policies to service_role
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role has full access to pulsecheck_sites" ON public.pulsecheck_sites;
CREATE POLICY "Service role has full access to pulsecheck_sites" ON public.pulsecheck_sites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to pulsecheck_departments" ON public.pulsecheck_departments;
CREATE POLICY "Service role has full access to pulsecheck_departments" ON public.pulsecheck_departments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to pulsecheck_directors" ON public.pulsecheck_directors;
CREATE POLICY "Service role has full access to pulsecheck_directors" ON public.pulsecheck_directors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to pulsecheck_providers" ON public.pulsecheck_providers;
CREATE POLICY "Service role has full access to pulsecheck_providers" ON public.pulsecheck_providers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to pulsecheck_cycles" ON public.pulsecheck_cycles;
CREATE POLICY "Service role has full access to pulsecheck_cycles" ON public.pulsecheck_cycles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to pulsecheck_ratings" ON public.pulsecheck_ratings;
CREATE POLICY "Service role has full access to pulsecheck_ratings" ON public.pulsecheck_ratings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to pulsecheck_reminders" ON public.pulsecheck_reminders;
CREATE POLICY "Service role has full access to pulsecheck_reminders" ON public.pulsecheck_reminders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to pulsecheck_imports" ON public.pulsecheck_imports;
CREATE POLICY "Service role has full access to pulsecheck_imports" ON public.pulsecheck_imports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to pulsecheck_healthsystems" ON public.pulsecheck_healthsystems;
CREATE POLICY "Service role has full access to pulsecheck_healthsystems" ON public.pulsecheck_healthsystems
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
