// Script to create educator user - Alfa Diallo
// Usage: npx tsx scripts/create-educator-user.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createEducatorUser() {
  const email = 'adiallo@mhs.net';
  const password = process.argv[2] || 'TempPassword123!'; // Get password from command line or use default
  const fullName = 'Alfa Diallo';
  const institutionName = 'Memorial Healthcare System';
  const programName = 'Emergency Medicine Residency';
  const role = 'faculty'; // Change to 'program_director' if needed

  console.log('🔄 Creating educator user...\n');
  console.log(`   Name: ${fullName}`);
  console.log(`   Email: ${email}`);
  console.log(`   Role: ${role}`);
  console.log(`   Institution: ${institutionName}`);
  console.log(`   Program: ${programName}\n`);

  try {
    // Step 1: Get or create institution
    console.log('📋 Step 1: Getting institution...');
    let { data: institution, error: instError } = await supabase
      .from('health_systems')
      .select('id')
      .eq('name', institutionName)
      .single();

    if (instError || !institution) {
      // Try to find by the known ID
      const knownId = '7a617a6d-c0e7-4c30-bcf7-12bd123432e9';
      const { data: instById } = await supabase
        .from('health_systems')
        .select('id')
        .eq('id', knownId)
        .single();

      if (instById) {
        institution = instById;
        console.log(`   ✅ Found institution: ${institution.id}`);
      } else {
        console.error('   ❌ Institution not found. Please run seed-basic-data.sql first.');
        process.exit(1);
      }
    } else {
      console.log(`   ✅ Found institution: ${institution.id}`);
    }

    const institutionId = institution.id;

    // Step 2: Get or create program
    console.log('\n📋 Step 2: Getting program...');
    let { data: program, error: progError } = await supabase
      .from('programs')
      .select('id')
      .eq('name', programName)
      .eq('health_system_id', institutionId)
      .single();

    if (progError || !program) {
      // Create program
      const { data: newProgram, error: createProgError } = await supabase
        .from('programs')
        .insert({
          health_system_id: institutionId,
          name: programName,
          specialty: 'Emergency Medicine',
        })
        .select('id')
        .single();

      if (createProgError) {
        console.error('   ❌ Error creating program:', createProgError);
        process.exit(1);
      }

      program = newProgram;
      console.log(`   ✅ Created program: ${program.id}`);
    } else {
      console.log(`   ✅ Found program: ${program.id}`);
    }

    const programId = program.id;

    // Step 3: Create auth user
    console.log('\n📋 Step 3: Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        role: role,
      },
    });

    let userId: string;
    
    if (authError) {
      if (authError.code === 'email_exists' || authError.message.includes('already registered')) {
        console.log('   ⚠️  User already exists in auth. Getting existing user...');
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          console.error('   ❌ Error listing users:', listError);
          process.exit(1);
        }
        const user = existingUsers?.users.find(u => u.email === email);
        if (!user) {
          console.error('   ❌ Could not find existing user');
          process.exit(1);
        }
        userId = user.id;
        console.log(`   ✅ Found existing auth user: ${userId}`);
      } else {
        console.error('   ❌ Error creating auth user:', authError);
        process.exit(1);
      }
    } else {
      userId = authData.user!.id;
      console.log(`   ✅ Created auth user: ${userId}`);
    }

    // Step 4: Create user profile
    console.log('\n📋 Step 4: Creating user profile...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        role: role,
        institution_id: institutionId,
      }, {
        onConflict: 'id',
      });

    if (profileError) {
      console.error('   ❌ Error creating profile:', profileError);
      process.exit(1);
    }
    console.log('   ✅ User profile created');

    // Step 5: Create faculty record
    console.log('\n📋 Step 5: Creating faculty record...');
    const { error: facultyError } = await supabase
      .from('faculty')
      .upsert({
        user_id: userId,
        program_id: programId,
        title: 'Faculty',
        department: 'Emergency Medicine',
        is_evaluator: true,
      }, {
        onConflict: 'user_id',
      });

    if (facultyError) {
      console.error('   ❌ Error creating faculty record:', facultyError);
      process.exit(1);
    }
    console.log('   ✅ Faculty record created');

    console.log('\n✅ Successfully created educator user!');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    console.log('\n💡 You can now login at http://localhost:3000/login');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);

  } catch (error: any) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

createEducatorUser().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

