# Truths Module - Setup Guide

**Created:** January 24, 2025  
**Status:** Complete - Ready for Use

---

## Overview

The Truths module provides a centralized repository for reference documents, protocols, and rubrics that demonstrate transparency about Lev8's analytics, evaluation criteria, and clinical guidelines.

**Key Features:**
- Document categorization (AI Protocols, Evaluation Rubrics, Clinical Guidelines, Policies, Other)
- Full-text search and filtering
- Secure file storage with Supabase Storage
- Role-based access control (Super Admin upload, all users view)
- PDF and Markdown support

---

## Implementation Summary

### 1. Database Schema

**Migration:** `supabase/migrations/20250124000001_truths_module.sql`

**Tables Created:**
- `truth_documents` - Stores document metadata

**Key Columns:**
- `id` (UUID) - Primary key
- `title` (TEXT) - Document title
- `description` (TEXT) - Optional description
- `category` (TEXT) - One of: `ai_protocols`, `evaluation_rubrics`, `clinical_guidelines`, `policies`, `other`
- `file_name` (TEXT) - Original filename
- `file_type` (TEXT) - `pdf` or `markdown`
- `file_size_bytes` (INTEGER) - File size
- `storage_path` (TEXT) - Unique path in Supabase Storage
- `visibility` (TEXT) - Access control level (default: `all`)
- `tags` (TEXT[]) - Array of tags for search
- `version` (TEXT) - Document version
- `uploaded_by` (UUID) - References `auth.users`
- `created_at`, `updated_at` (TIMESTAMPTZ) - Timestamps

**RLS Policies:**
- All authenticated users can SELECT (view documents)
- Only `super_admin` can INSERT, UPDATE, DELETE

---

### 2. Supabase Storage

**Bucket:** `truth-documents`

**Configuration:**
- Private bucket (requires authentication)
- 50MB file size limit
- Allowed MIME types: `application/pdf`, `text/markdown`, `text/plain`

**Setup Script:** `scripts/setup-truths-storage.ts`

**Storage Policies (apply via SQL Editor):**

```sql
-- Allow authenticated users to download documents
CREATE POLICY "authenticated_users_download_truth_documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'truth-documents');

-- Allow super_admin to upload documents
CREATE POLICY "super_admin_upload_truth_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'truth-documents' AND
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'super_admin'
  )
);

-- Allow super_admin to delete documents
CREATE POLICY "super_admin_delete_truth_documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'truth-documents' AND
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'super_admin'
  )
);
```

---

### 3. API Endpoints

**Base Path:** `/api/truths`

#### GET `/api/truths`
List all documents with optional filtering.

**Query Parameters:**
- `category` - Filter by category (e.g., `ai_protocols`)
- `search` - Search in title, description, or tags

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "title": "ACGME Common Program Requirements",
      "description": "...",
      "category": "policies",
      "file_type": "pdf",
      "file_size_bytes": 1024000,
      "tags": ["acgme", "residency"],
      "created_at": "2025-01-24T10:00:00Z"
    }
  ]
}
```

#### POST `/api/truths`
Upload a new document (super_admin only).

**Request:** `multipart/form-data`
- `file` (File) - PDF or Markdown file
- `title` (string) - Document title
- `description` (string, optional) - Description
- `category` (string) - Category
- `tags` (string, optional) - Comma-separated tags

**Response:**
```json
{
  "id": "uuid",
  "message": "Document uploaded successfully",
  "document": { ... }
}
```

#### GET `/api/truths/[id]/download`
Get a signed URL to download a document.

**Response:**
```json
{
  "url": "https://...",
  "file_name": "document.pdf",
  "file_type": "pdf"
}
```

#### DELETE `/api/truths/[id]`
Delete a document (super_admin only).

**Response:**
```json
{
  "message": "Document deleted successfully"
}
```

---

### 4. Frontend Components

**Main Page:** `app/(dashboard)/truths/page.tsx`
- Document listing with search and category filters
- Upload button (super_admin only)
- Responsive grid layout

**Components:**
- `components/truths/DocumentCard.tsx` - Individual document display with download/delete actions
- `components/truths/UploadDocumentModal.tsx` - Upload interface with form validation
- `lib/truths/storage.ts` - Utility functions for storage operations
- `lib/types/truths.ts` - TypeScript interfaces and constants

**Navigation:**
- Added "Truths" to sidebar in `app/(dashboard)/layout.tsx`
- Top-level module (same level as Learn, Reflect, Understand)

---

### 5. File Structure

```
/app/(dashboard)/truths/
  page.tsx                    # Main truths listing page
  
/app/api/truths/
  route.ts                    # GET (list), POST (upload)
  [id]/
    route.ts                  # DELETE
    download/
      route.ts                # GET (download file)
      
/components/truths/
  DocumentCard.tsx            # Individual document display
  UploadDocumentModal.tsx     # Upload interface (super_admin)
  
/lib/truths/
  storage.ts                  # Supabase Storage utilities
  
/lib/types/
  truths.ts                   # TypeScript interfaces
  
/supabase/migrations/
  20250124000001_truths_module.sql
  
/scripts/
  setup-truths-storage.ts     # Create storage bucket
  upload-acgme-pdf.ts         # Upload first document
  seed-first-truth-document.sql # SQL seed script
```

---

## Setup Steps

### Step 1: Run Database Migration

```bash
# In Supabase SQL Editor, run:
supabase/migrations/20250124000001_truths_module.sql
```

### Step 2: Create Storage Bucket

```bash
# Run the storage setup script
npx tsx scripts/setup-truths-storage.ts
```

Then apply the storage policies shown in the script output via Supabase SQL Editor.

### Step 3: Upload First Document

The ACGME PDF is already in your project at:
`docs/_guidance/Truths/guide-to-the-common-program-requirements-residency.pdf`

Upload it using the script:

```bash
npx tsx scripts/upload-acgme-pdf.ts
```

**Or** manually via the UI:
1. Log in as a super_admin user
2. Navigate to `/truths`
3. Click "Upload Document"
4. Fill in the form:
   - **Title:** ACGME Common Program Requirements - Residency
   - **Description:** ACGME common program requirements for residency training programs
   - **Category:** Policies
   - **Tags:** acgme, residency, requirements, compliance, accreditation
5. Select the PDF file and upload

---

## Usage

### For All Users (Residents, Faculty, Program Directors)

1. Navigate to the "Truths" module from the sidebar
2. Browse all available documents
3. Use the category filter to narrow by type
4. Use the search bar to find specific documents
5. Click "Download" to view any document

### For Super Admins Only

1. Click "Upload Document" button
2. Select a PDF or Markdown file
3. Fill in title, description, category, and tags
4. Submit to make the document available to all users
5. Delete documents if needed using the "Delete" button on each card

---

## Category Descriptions

- **AI Protocols** - Guidelines for AI-generated analysis (e.g., SWOT, anonymization)
- **Evaluation Rubrics** - Assessment frameworks (e.g., EQ+PQ+IQ)
- **Clinical Guidelines** - Medical protocols and standards
- **Policies** - Institutional policies and requirements (e.g., ACGME)
- **Other** - Miscellaneous reference documents

---

## Future Enhancements (Not in PoC)

- In-app PDF viewer
- Markdown renderer for .md files
- Version history tracking
- Document approval workflow
- Physicians/APCs access group with restricted visibility
- Document expiration dates
- Usage analytics (who downloaded what)
- Document commenting/feedback

---

## Verification

After setup, verify the module is working:

1. **Database:** Check that `truth_documents` table exists
   ```sql
   SELECT * FROM public.truth_documents;
   ```

2. **Storage:** Verify bucket exists in Supabase Dashboard → Storage

3. **UI:** Navigate to `/truths` and confirm:
   - Page loads without errors
   - Documents are displayed (if any uploaded)
   - Search and filter work
   - Download buttons work
   - Upload button visible for super_admin

---

## Troubleshooting

### Issue: "Failed to fetch documents"
- **Solution:** Check RLS policies are applied correctly
- **Verify:** User is authenticated

### Issue: "Failed to upload document"
- **Solution:** Verify user has `super_admin` role
- **Check:** Storage bucket exists and policies are applied

### Issue: "Failed to download document"
- **Solution:** Check storage path is correct in database
- **Verify:** File exists in Supabase Storage bucket

### Issue: Upload button not visible
- **Solution:** Ensure logged-in user has `role = 'super_admin'` in `user_profiles` table

---

## Summary

The Truths module is now fully implemented and ready for use. It provides:

✅ Secure document storage and management  
✅ Role-based access control  
✅ Search and filtering capabilities  
✅ Clean, intuitive UI  
✅ First document (ACGME PDF) ready to upload  

**Next Steps:**
1. Run the database migration
2. Set up the storage bucket
3. Upload the ACGME PDF
4. Add more documents as needed

For questions or issues, refer to this guide or check the implementation files listed above.


