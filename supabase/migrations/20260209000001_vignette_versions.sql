-- Vignette version history: stores a full snapshot of vignette_data on every save
-- Enables diff view, audit trail, and rollback in the Studio editor

CREATE TABLE IF NOT EXISTS public.vignette_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vignette_id UUID NOT NULL REFERENCES public.vignettes(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    vignette_data JSONB NOT NULL,
    change_summary TEXT,
    changed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    changed_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(vignette_id, version_number)
);

-- Fast lookup: most recent versions for a vignette
CREATE INDEX IF NOT EXISTS idx_vignette_versions_vignette
    ON public.vignette_versions(vignette_id, version_number DESC);

-- RLS: only authenticated users can read version history
ALTER TABLE public.vignette_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vignette versions"
    ON public.vignette_versions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role can manage vignette versions"
    ON public.vignette_versions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
