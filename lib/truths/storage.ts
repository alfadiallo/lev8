/**
 * Supabase Storage utilities for truth documents
 */

import { createClient } from '@supabase/supabase-js';
import { TruthCategory, CATEGORY_LABELS, CATEGORY_COLORS } from '../types/truths';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Upload a document to Supabase Storage
 */
export async function uploadTruthDocument(
  file: File,
  metadata: { title: string; category: string }
): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Generate storage path: category/timestamp-filename
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${metadata.category}/${timestamp}-${sanitizedFileName}`;
  
  const { data: _data, error } = await supabase.storage
    .from('truth-documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
  
  return storagePath;
}

/**
 * Download a document from Supabase Storage
 */
export async function downloadTruthDocument(storagePath: string): Promise<Blob> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await supabase.storage
    .from('truth-documents')
    .download(storagePath);
  
  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
  
  return data;
}

/**
 * Get a signed URL for downloading a document
 */
export async function getTruthDocumentUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await supabase.storage
    .from('truth-documents')
    .createSignedUrl(storagePath, expiresIn);
  
  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }
  
  return data.signedUrl;
}

/**
 * Delete a document from Supabase Storage
 */
export async function deleteTruthDocument(storagePath: string): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { error } = await supabase.storage
    .from('truth-documents')
    .remove([storagePath]);
  
  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Get category display label
 */
export function getCategoryLabel(category: TruthCategory): string {
  return CATEGORY_LABELS[category] || category;
}

/**
 * Get category styling (color only - icons handled by components)
 */
export function getCategoryStyle(category: TruthCategory): { color: string } {
  return {
    color: CATEGORY_COLORS[category] || CATEGORY_COLORS.other
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size';
  
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

/**
 * Validate file type
 */
export function isValidFileType(file: File): boolean {
  const validTypes = ['application/pdf', 'text/markdown', 'text/plain'];
  return validTypes.includes(file.type);
}

/**
 * Get file type from filename
 */
export function getFileTypeFromName(fileName: string): 'pdf' | 'markdown' {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext === 'md' ? 'markdown' : 'pdf';
}

