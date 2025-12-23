#!/usr/bin/env tsx
/**
 * Setup Supabase Storage bucket for truth documents
 * Run this script to create the truth-documents bucket with appropriate policies
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTruthsStorage() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Truths Module - Storage Setup                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some(b => b.name === 'truth-documents');

    if (bucketExists) {
      console.log('ℹ️  Bucket "truth-documents" already exists');
      console.log('   Skipping bucket creation...\n');
    } else {
      // Create the bucket
      console.log('📦 Creating storage bucket "truth-documents"...');
      const { data, error } = await supabase.storage.createBucket('truth-documents', {
        public: false, // Private bucket - requires authentication
        fileSizeLimit: 52428800, // 50MB limit
        allowedMimeTypes: ['application/pdf', 'text/markdown', 'text/plain']
      });

      if (error) {
        throw new Error(`Failed to create bucket: ${error.message}`);
      }

      console.log('✓ Storage bucket created successfully\n');
    }

    // Set up storage policies
    console.log('🔒 Setting up storage policies...');
    
    // Note: Storage policies are typically managed through Supabase Dashboard or SQL
    // The following policies should be applied via SQL Editor:
    
    console.log('\n📋 Apply these storage policies in Supabase SQL Editor:\n');
    console.log('-- Allow authenticated users to download documents');
    console.log('CREATE POLICY "authenticated_users_download_truth_documents"');
    console.log('ON storage.objects FOR SELECT');
    console.log('TO authenticated');
    console.log('USING (bucket_id = \'truth-documents\');\n');
    
    console.log('-- Allow super_admin to upload documents');
    console.log('CREATE POLICY "super_admin_upload_truth_documents"');
    console.log('ON storage.objects FOR INSERT');
    console.log('TO authenticated');
    console.log('WITH CHECK (');
    console.log('  bucket_id = \'truth-documents\' AND');
    console.log('  EXISTS (');
    console.log('    SELECT 1 FROM public.user_profiles');
    console.log('    WHERE user_profiles.id = auth.uid()');
    console.log('    AND user_profiles.role = \'super_admin\'');
    console.log('  )');
    console.log(');\n');
    
    console.log('-- Allow super_admin to delete documents');
    console.log('CREATE POLICY "super_admin_delete_truth_documents"');
    console.log('ON storage.objects FOR DELETE');
    console.log('TO authenticated');
    console.log('USING (');
    console.log('  bucket_id = \'truth-documents\' AND');
    console.log('  EXISTS (');
    console.log('    SELECT 1 FROM public.user_profiles');
    console.log('    WHERE user_profiles.id = auth.uid()');
    console.log('    AND user_profiles.role = \'super_admin\'');
    console.log('  )');
    console.log(');\n');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  Storage Setup Complete                                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('✓ Bucket "truth-documents" is ready');
    console.log('⚠️  Remember to apply the storage policies shown above\n');

  } catch (error) {
    console.error('\n❌ Error during storage setup:', error);
    process.exit(1);
  }
}

// Run the setup
setupTruthsStorage();


