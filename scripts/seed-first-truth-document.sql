-- ============================================================================
-- SEED FIRST TRUTH DOCUMENT
-- ============================================================================
-- This script inserts the first document into the truth_documents table
-- The actual PDF file must be uploaded to Supabase Storage separately

-- Note: This assumes the file has already been uploaded to Supabase Storage
-- at the path: policies/guide-to-the-common-program-requirements-residency.pdf

INSERT INTO public.truth_documents (
  title,
  description,
  category,
  file_name,
  file_type,
  file_size_bytes,
  storage_path,
  visibility,
  version,
  tags,
  created_at,
  updated_at
)
VALUES (
  'ACGME Common Program Requirements - Residency',
  'ACGME common program requirements for residency training programs. This document outlines the standards and requirements that all ACGME-accredited residency programs must meet.',
  'policies',
  'guide-to-the-common-program-requirements-residency.pdf',
  'pdf',
  NULL, -- File size will be updated after upload
  'policies/guide-to-the-common-program-requirements-residency.pdf',
  'all',
  '1.0',
  ARRAY['acgme', 'residency', 'requirements', 'compliance', 'accreditation'],
  NOW(),
  NOW()
)
ON CONFLICT (storage_path) DO NOTHING;

-- Verify the insert
SELECT 
  id,
  title,
  category,
  file_name,
  storage_path,
  array_to_string(tags, ', ') as tags,
  created_at
FROM public.truth_documents
WHERE storage_path = 'policies/guide-to-the-common-program-requirements-residency.pdf';


