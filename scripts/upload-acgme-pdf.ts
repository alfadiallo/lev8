#!/usr/bin/env tsx
/**
 * Upload the ACGME PDF to Supabase Storage and create database entry
 * This script handles the complete upload process for the first truth document
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Path to the PDF file
const PDF_PATH = join(process.cwd(), 'docs/_guidance/Truths/guide-to-the-common-program-requirements-residency.pdf');
const STORAGE_PATH = 'policies/guide-to-the-common-program-requirements-residency.pdf';

async function uploadACGMEDocument() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Upload ACGME PDF - First Truth Document                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Read the PDF file
    console.log('📄 Reading PDF file...');
    const fileBuffer = readFileSync(PDF_PATH);
    const fileStats = statSync(PDF_PATH);
    const fileSizeBytes = fileStats.size;
    
    console.log(`   File size: ${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Path: ${PDF_PATH}\n`);

    // Upload to Supabase Storage
    console.log('☁️  Uploading to Supabase Storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('truth-documents')
      .upload(STORAGE_PATH, fileBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true // Overwrite if exists
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    console.log(`   ✓ Uploaded to: ${STORAGE_PATH}\n`);

    // Insert metadata into database
    console.log('💾 Creating database entry...');
    const { data: dbData, error: dbError } = await supabase
      .from('truth_documents')
      .upsert({
        title: 'ACGME Common Program Requirements - Residency',
        description: 'ACGME common program requirements for residency training programs. This document outlines the standards and requirements that all ACGME-accredited residency programs must meet.',
        category: 'policies',
        file_name: 'guide-to-the-common-program-requirements-residency.pdf',
        file_type: 'pdf',
        file_size_bytes: fileSizeBytes,
        storage_path: STORAGE_PATH,
        visibility: 'all',
        version: '1.0',
        tags: ['acgme', 'residency', 'requirements', 'compliance', 'accreditation']
      }, {
        onConflict: 'storage_path'
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Failed to create database entry: ${dbError.message}`);
    }

    console.log('   ✓ Database entry created\n');

    // Display summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  Upload Complete                                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('Document Details:');
    console.log(`  ID: ${dbData.id}`);
    console.log(`  Title: ${dbData.title}`);
    console.log(`  Category: ${dbData.category}`);
    console.log(`  File Size: ${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Tags: ${dbData.tags?.join(', ')}`);
    console.log(`  Storage Path: ${dbData.storage_path}`);
    console.log('\n✅ The document is now available in the Truths module!');
    console.log('   Navigate to /truths to view it.\n');

  } catch (error) {
    console.error('\n❌ Error during upload:', error);
    process.exit(1);
  }
}

// Run the upload
uploadACGMEDocument();


