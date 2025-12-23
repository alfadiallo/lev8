/**
 * Setup Supabase Storage Bucket for Voice Journal
 * Run with: npx tsx scripts/setup-storage.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  console.log('🔧 Setting up Supabase Storage...\n');

  // Check if bucket exists
  console.log('1. Checking if voice_journal bucket exists...');
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Error listing buckets:', listError);
    return;
  }

  const voiceJournalBucket = buckets?.find(b => b.name === 'voice_journal');

  if (voiceJournalBucket) {
    console.log('✅ Bucket "voice_journal" already exists');
    console.log('   Public:', voiceJournalBucket.public);
    console.log('   ID:', voiceJournalBucket.id);
  } else {
    console.log('⚠️  Bucket "voice_journal" does not exist');
    console.log('📦 Creating bucket...');

    const { data: newBucket, error: createError } = await supabase.storage.createBucket('voice_journal', {
      public: false, // Private bucket
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/mpeg']
    });

    if (createError) {
      console.error('❌ Error creating bucket:', createError);
      return;
    }

    console.log('✅ Bucket created successfully:', newBucket);
  }

  console.log('\n2. Checking bucket policies...');
  
  // Note: Storage policies are managed through Supabase Dashboard or SQL
  console.log('⚠️  Please ensure the following RLS policies are set in Supabase Dashboard:');
  console.log('\n--- Storage Policy for voice_journal bucket ---');
  console.log('Policy Name: Users can upload their own files');
  console.log('Operation: INSERT');
  console.log('Policy Definition:');
  console.log('  bucket_id = \'voice_journal\' AND auth.uid()::text = (storage.foldername(name))[1]');
  console.log('');
  console.log('Policy Name: Users can read their own files');
  console.log('Operation: SELECT');
  console.log('Policy Definition:');
  console.log('  bucket_id = \'voice_journal\' AND auth.uid()::text = (storage.foldername(name))[1]');
  console.log('');
  console.log('Policy Name: Users can delete their own files');
  console.log('Operation: DELETE');
  console.log('Policy Definition:');
  console.log('  bucket_id = \'voice_journal\' AND auth.uid()::text = (storage.foldername(name))[1]');
  
  console.log('\n✅ Storage setup complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Go to Supabase Dashboard > Storage > Policies');
  console.log('   2. Add the policies shown above if they don\'t exist');
  console.log('   3. Test uploading a voice journal entry');
}

setupStorage().catch(console.error);

