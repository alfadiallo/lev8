-- ============================================================================
-- FACULTY TABLE
-- ============================================================================
-- Create faculty table to store faculty member information
-- Links to user_profiles via user_id

-- Drop existing table if it exists (to handle schema changes)
DROP TABLE IF EXISTS public.faculty CASCADE;

CREATE TABLE public.faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  credentials TEXT, -- MD, DO, PhD, MPH, etc.
  email TEXT NOT NULL UNIQUE, -- Make email required and unique
  program_id UUID REFERENCES public.programs(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faculty_user_id ON public.faculty(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_program ON public.faculty(program_id);
CREATE INDEX IF NOT EXISTS idx_faculty_active ON public.faculty(is_active);

-- Add RLS policies for faculty table
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "authenticated_view_faculty" ON public.faculty;
DROP POLICY IF EXISTS "service_role_manage_faculty" ON public.faculty;

-- Allow all authenticated users to view faculty (for now - can be restricted later)
CREATE POLICY "authenticated_view_faculty" ON public.faculty
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow service role to manage faculty
CREATE POLICY "service_role_manage_faculty" ON public.faculty
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.faculty IS 'Faculty members who evaluate residents';
COMMENT ON COLUMN public.faculty.user_id IS 'Links to auth.users and user_profiles';
COMMENT ON COLUMN public.faculty.credentials IS 'Medical credentials (MD, DO, PhD, MPH, etc.)';
COMMENT ON COLUMN public.faculty.program_id IS 'The residency program this faculty belongs to';

