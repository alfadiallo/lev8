-- ============================================================================
-- TRUTHS MODULE - SOURCES OF TRUTH
-- ============================================================================
-- Create table and policies for storing reference documents, protocols, and rubrics
-- Created: 2025-01-24

-- Drop existing table if it exists (for idempotency)
DROP TABLE IF EXISTS public.truth_documents CASCADE;

-- Create truth_documents table
CREATE TABLE public.truth_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Document metadata
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'ai_protocols',
    'evaluation_rubrics', 
    'simulation_guidelines',
    'policies',
    'other'
  )),
  
  -- File information
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'markdown')),
  file_size_bytes INTEGER,
  storage_path TEXT NOT NULL UNIQUE, -- Supabase Storage path
  
  -- Access control (for future use)
  visibility TEXT DEFAULT 'all' CHECK (visibility IN ('all', 'physicians_apcs', 'admin_only')),
  
  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  version TEXT DEFAULT '1.0',
  tags TEXT[], -- Array for flexible categorization
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_truth_documents_category ON public.truth_documents(category);
CREATE INDEX IF NOT EXISTS idx_truth_documents_visibility ON public.truth_documents(visibility);
CREATE INDEX IF NOT EXISTS idx_truth_documents_created ON public.truth_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_truth_documents_tags ON public.truth_documents USING GIN(tags);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_truth_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_truth_documents_updated_at_trigger
  BEFORE UPDATE ON public.truth_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_truth_documents_updated_at();

-- Enable Row-Level Security
ALTER TABLE public.truth_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "authenticated_users_view_truth_documents" ON public.truth_documents;
DROP POLICY IF EXISTS "super_admin_manage_truth_documents" ON public.truth_documents;

-- RLS Policy: All authenticated users can view documents
CREATE POLICY "authenticated_users_view_truth_documents" ON public.truth_documents
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS Policy: Only super_admin can insert, update, or delete documents
CREATE POLICY "super_admin_manage_truth_documents" ON public.truth_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- Comments for documentation
COMMENT ON TABLE public.truth_documents IS 'Reference documents, protocols, and rubrics that provide transparency about Lev8 analytics and evaluation criteria';
COMMENT ON COLUMN public.truth_documents.title IS 'Display title of the document';
COMMENT ON COLUMN public.truth_documents.category IS 'Document category: ai_protocols, evaluation_rubrics, clinical_guidelines, policies, or other';
COMMENT ON COLUMN public.truth_documents.storage_path IS 'Path to file in Supabase Storage bucket (truth-documents)';
COMMENT ON COLUMN public.truth_documents.visibility IS 'Access control level (for future use with Physicians/APCs group)';
COMMENT ON COLUMN public.truth_documents.tags IS 'Array of tags for flexible categorization and search';

