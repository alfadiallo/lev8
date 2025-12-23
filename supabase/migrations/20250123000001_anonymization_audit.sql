-- ============================================================================
-- ANONYMIZATION AUDIT LOG
-- ============================================================================
-- Track what data was sent to external AI APIs for privacy compliance
-- Created: 2025-01-23

-- Drop existing table if it exists (for idempotency)
DROP TABLE IF EXISTS public.ai_anonymization_log CASCADE;

CREATE TABLE public.ai_anonymization_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What was analyzed
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  period_label TEXT NOT NULL,
  
  -- Anonymization details
  pseudonym TEXT NOT NULL, -- e.g., "Resident A", "Resident B"
  n_comments_sent INTEGER NOT NULL,
  
  -- API details
  api_provider TEXT DEFAULT 'anthropic' CHECK (api_provider IN ('anthropic', 'openai', 'other')),
  api_model TEXT, -- e.g., "claude-sonnet-4-20250514"
  
  -- Privacy flags
  data_sanitized BOOLEAN DEFAULT true NOT NULL,
  phi_scrubbed BOOLEAN DEFAULT true NOT NULL,
  names_anonymized BOOLEAN DEFAULT true NOT NULL,
  dates_generalized BOOLEAN DEFAULT true NOT NULL,
  
  -- Timestamps
  analysis_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_anonymization_log_resident ON public.ai_anonymization_log(resident_id);
CREATE INDEX IF NOT EXISTS idx_anonymization_log_timestamp ON public.ai_anonymization_log(analysis_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_anonymization_log_provider ON public.ai_anonymization_log(api_provider);

-- Row-Level Security
ALTER TABLE public.ai_anonymization_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "service_role_full_access_anonymization_log" ON public.ai_anonymization_log;
DROP POLICY IF EXISTS "program_directors_view_anonymization_log" ON public.ai_anonymization_log;

-- Service role has full access (for scripts)
CREATE POLICY "service_role_full_access_anonymization_log" ON public.ai_anonymization_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Program directors can view audit logs for their program
CREATE POLICY "program_directors_view_anonymization_log" ON public.ai_anonymization_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.residents r ON up.id = r.user_id
      WHERE r.id = ai_anonymization_log.resident_id
      AND up.role = 'program_director'
      AND auth.uid() = up.id
    )
  );

-- Comments
COMMENT ON TABLE public.ai_anonymization_log IS 'Audit trail of data sent to external AI APIs for privacy compliance';
COMMENT ON COLUMN public.ai_anonymization_log.pseudonym IS 'Anonymized identifier used in place of real name';
COMMENT ON COLUMN public.ai_anonymization_log.data_sanitized IS 'Whether all PII was removed before sending';
COMMENT ON COLUMN public.ai_anonymization_log.phi_scrubbed IS 'Whether Protected Health Information was scrubbed';
COMMENT ON COLUMN public.ai_anonymization_log.names_anonymized IS 'Whether real names were replaced with pseudonyms';
COMMENT ON COLUMN public.ai_anonymization_log.dates_generalized IS 'Whether specific dates were generalized';


