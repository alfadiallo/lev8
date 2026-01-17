import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSarahChen() {
  console.log('Fixing Sarah Chen user profile...');

  // 1. Check if user exists
  const { data: existingUser } = await supabase
    .from('user_profiles')
    .select('id, email, role')
    .eq('email', 'sarah.chen@hospital.edu')
    .single();

  if (existingUser) {
    console.log('User exists, updating role to program_director...');
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: 'program_director', full_name: 'Dr. Sarah Chen' })
      .eq('email', 'sarah.chen@hospital.edu');

    if (error) {
      console.error('Error updating user:', error);
    } else {
      console.log('Successfully updated Sarah Chen to program_director');
    }
  } else {
    console.log('User does not exist, creating...');
    
    // Get a valid institution ID
    const { data: institution } = await supabase
      .from('health_systems')
      .select('id')
      .limit(1)
      .single();

    if (!institution) {
      console.error('No health system found to assign user to');
      return;
    }

    const { error } = await supabase
      .from('user_profiles')
      .insert({
        id: crypto.randomUUID(),
        email: 'sarah.chen@hospital.edu',
        full_name: 'Dr. Sarah Chen',
        role: 'program_director',
        institution_id: institution.id,
        source: 'lev8'
      });

    if (error) {
      console.error('Error creating user:', error);
    } else {
      console.log('Successfully created Sarah Chen as program_director');
    }
  }
}

fixSarahChen().catch(console.error);
