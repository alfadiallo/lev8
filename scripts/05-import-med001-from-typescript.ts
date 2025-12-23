// Import MED-001 Vignette from TypeScript Definition
// This script reads the TypeScript vignette and imports it into Supabase
// Usage: npx tsx scripts/05-import-med001-from-typescript.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { MED001AdenosineErrorVignette } from '../lib/vignettes/v2/MED-001-adenosine-error';
import { convertVignetteV2ToDatabase, validateVignetteV2 } from '../lib/vignettes/v2/convertToDatabaseFormat';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importMED001() {
  console.log('🔄 Importing MED-001 Vignette...\n');

  try {
    // Validate vignette
    console.log('📋 Validating vignette structure...');
    const validationErrors = validateVignetteV2(MED001AdenosineErrorVignette);
    if (validationErrors.length > 0) {
      console.error('❌ Validation errors:');
      validationErrors.forEach(err => console.error(`   - ${err}`));
      process.exit(1);
    }
    console.log('   ✅ Vignette structure is valid\n');

    // Vignettes are global (institution_id = null) - available to all institutions
    console.log('📋 Setting up global vignette (available to all institutions)...');
    const institutionId = null; // NULL = Global vignette
    
    // Convert to database format
    console.log('📋 Converting vignette to database format...');
    const dbVignette = convertVignetteV2ToDatabase(
      MED001AdenosineErrorVignette,
      institutionId as any // Pass null for global vignettes
    );
    // Override institution_id to null
    (dbVignette as any).institution_id = null;
    console.log('   ✅ Converted successfully (global vignette)\n');

    // Check if vignette already exists (global vignettes have institution_id = null)
    console.log('📋 Checking for existing vignette...');
    const { data: existing, error: checkError } = await supabase
      .from('vignettes')
      .select('id, title')
      .is('institution_id', null) // Global vignettes have null institution_id
      .eq('title', dbVignette.title)
      .eq('category', dbVignette.category)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking for existing vignette:', checkError);
      process.exit(1);
    }

    let result;
    if (existing) {
      console.log(`   ⚠️  Vignette already exists (ID: ${existing.id})`);
      console.log('   📝 Updating existing vignette...\n');
      
      const { data: updated, error: updateError } = await supabase
        .from('vignettes')
        .update({
          ...dbVignette,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating vignette:', updateError);
        process.exit(1);
      }

      result = updated;
      console.log('   ✅ Vignette updated successfully!\n');
    } else {
      console.log('   ✅ No existing vignette found');
      console.log('   📝 Creating new vignette...\n');
      
      const { data: inserted, error: insertError } = await supabase
        .from('vignettes')
        .insert(dbVignette)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating vignette:', insertError);
        console.error('   Details:', JSON.stringify(insertError, null, 2));
        process.exit(1);
      }

      result = inserted;
      console.log('   ✅ Vignette created successfully!\n');
    }

    // Display result
    console.log('📊 Vignette Details:');
    console.log(`   ID: ${result.id}`);
    console.log(`   Title: ${result.title}`);
    console.log(`   Category: ${result.category}`);
    console.log(`   Subcategory: ${result.subcategory}`);
    console.log(`   Difficulty: ${result.difficulty.join(', ')}`);
    console.log(`   Duration: ${result.estimated_duration_minutes} minutes`);
    console.log(`   Version: ${(result.vignette_data as any).version || 'unknown'}`);
    console.log(`   Active: ${result.is_active}`);
    console.log(`   Created: ${result.created_at}\n`);

    console.log('✅ MED-001 vignette import complete!\n');
    console.log('💡 Next steps:');
    console.log('   1. Verify the vignette appears in your application');
    console.log('   2. Test the conversation flow');
    console.log('   3. Check assessment scoring works correctly\n');

  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

importMED001().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

