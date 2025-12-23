/**
 * Seed Core Faculty Profiles
 * 
 * This script creates faculty accounts for core faculty members.
 * They will receive password reset emails to set their own passwords.
 * 
 * Usage: npx tsx scripts/seed-core-faculty.ts
 * 
 * To customize:
 * 1. Edit the CORE_FACULTY array below with your faculty data
 * 2. Run the script
 * 3. Faculty members will receive welcome emails with password setup links
 */

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

// ============================================================================
// CONFIGURATION
// ============================================================================

// Set to true to send welcome emails with password reset links
// Set to false to create accounts silently (no emails sent)
const SEND_EMAILS = false;

// Default password for all accounts (only used if SEND_EMAILS is false)
// Share this with faculty manually, or reset their passwords later from admin portal
const DEFAULT_PASSWORD = 'Elevate2025!';

// ============================================================================
// CONFIGURE YOUR FACULTY HERE
// ============================================================================
interface FacultyMember {
  full_name: string;
  personal_email: string;          // Primary login email
  institutional_email?: string;    // Optional institutional email
  credentials?: string;            // e.g., "MD", "MD, MPH", "DO"
  role: 'faculty' | 'program_director';
  is_evaluator?: boolean;
}

const CORE_FACULTY: FacultyMember[] = [
  {
    full_name: 'Hanan Atia',
    personal_email: 'hananatia@gmail.com',
    credentials: 'MD',
    role: 'faculty',
    is_evaluator: true,
  },
  {
    full_name: 'Alfa Diallo',
    personal_email: 'findme@alfadiallo.com',
    credentials: 'MD, MPH',
    role: 'faculty',
    is_evaluator: true,
  },
  {
    full_name: 'Lara Goldstein',
    personal_email: 'drg666@gmail.com',
    credentials: 'MD, PhD',
    role: 'faculty',
    is_evaluator: true,
  },
  {
    full_name: 'David Hooke',
    personal_email: 'davidhooke@gmail.com',
    credentials: 'DO',
    role: 'faculty',
    is_evaluator: true,
  },
  {
    full_name: 'Brian Kohen',
    personal_email: 'brik591@gmail.com',
    credentials: 'MD',
    role: 'faculty',
    is_evaluator: true,
  },
  {
    full_name: 'Randy Katz',
    personal_email: 'Randyscottkatz@gmail.com',
    credentials: 'DO',
    role: 'faculty',
    is_evaluator: true,
  },
  {
    full_name: 'Steven Katz',
    personal_email: 'stevenkatz911@gmail.com',
    credentials: 'MD',
    role: 'faculty',
    is_evaluator: true,
  },
  {
    full_name: 'Sandra Lopez',
    personal_email: 'sandramarcellalopez@gmail.com',
    credentials: 'MD',
    role: 'faculty',
    is_evaluator: true,
  },
  {
    full_name: 'Leon Melnitsky',
    personal_email: 'lmelnitsky@gmail.com',
    credentials: 'DO',
    role: 'faculty',
    is_evaluator: true,
  },
  {
    full_name: 'Jheanelle McKay',
    personal_email: 'jheanellemckay@gmail.com',
    credentials: 'MD',
    role: 'faculty',
    is_evaluator: true,
  },
  {
    full_name: 'Donny Perez',
    personal_email: 'donnyperez@gmail.com',
    credentials: 'DO',
    role: 'faculty',
    is_evaluator: true,
  },
  {
    full_name: 'Franz Mendoza',
    personal_email: 'franz.mendoza93@gmail.com',
    credentials: 'MD',
    role: 'faculty',
    is_evaluator: true,
  },
  {
    full_name: 'Yehuda Wenger',
    personal_email: 'yehudawenger@gmail.com',
    credentials: 'MD',
    role: 'faculty',
    is_evaluator: true,
  },
];

// ============================================================================

async function generateTempPassword(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function seedCoreFaculty() {
  console.log('🏥 Seeding Core Faculty Profiles\n');
  console.log(`   Found ${CORE_FACULTY.length} faculty members to create\n`);

  if (CORE_FACULTY.length === 0) {
    console.log('⚠️  No faculty members configured!');
    console.log('   Edit the CORE_FACULTY array in this script to add your faculty.\n');
    process.exit(0);
  }

  // Get institution
  console.log('📋 Step 1: Getting institution...');
  const { data: institution, error: instError } = await supabase
    .from('health_systems')
    .select('id, name')
    .limit(1)
    .single();

  if (instError || !institution) {
    console.error('   ❌ No institution found. Please run setup scripts first.');
    process.exit(1);
  }
  console.log(`   ✅ Found institution: ${institution.name}`);

  // Get program
  console.log('\n📋 Step 2: Getting program...');
  const { data: program, error: progError } = await supabase
    .from('programs')
    .select('id, name')
    .eq('health_system_id', institution.id)
    .limit(1)
    .single();

  if (progError || !program) {
    console.error('   ❌ No program found. Please run setup scripts first.');
    process.exit(1);
  }
  console.log(`   ✅ Found program: ${program.name}`);

  // Get admin user for invited_by field
  const { data: adminUser } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('role', 'super_admin')
    .limit(1)
    .single();

  console.log('\n📋 Step 3: Creating faculty accounts...\n');

  const results: { name: string; status: 'created' | 'exists' | 'error'; message: string }[] = [];

  for (const faculty of CORE_FACULTY) {
    console.log(`   Processing: ${faculty.full_name}...`);

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .or(`email.eq.${faculty.personal_email.toLowerCase()},personal_email.eq.${faculty.personal_email.toLowerCase()}`)
        .single();

      if (existingUser) {
        console.log(`   ⚠️  Skipped (already exists): ${faculty.full_name}`);
        results.push({ name: faculty.full_name, status: 'exists', message: 'Already exists' });
        continue;
      }

      // Create auth user
      const password = SEND_EMAILS ? await generateTempPassword() : DEFAULT_PASSWORD;
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: faculty.personal_email.toLowerCase(),
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: faculty.full_name,
          role: faculty.role,
        },
      });

      if (authError) {
        console.log(`   ❌ Auth error for ${faculty.full_name}: ${authError.message}`);
        results.push({ name: faculty.full_name, status: 'error', message: authError.message });
        continue;
      }

      const userId = authData.user!.id;

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: faculty.personal_email.toLowerCase(),
          personal_email: faculty.personal_email.toLowerCase(),
          institutional_email: faculty.institutional_email?.toLowerCase() || null,
          full_name: faculty.full_name,
          display_name: faculty.full_name.split(' ')[0],
          role: faculty.role,
          institution_id: institution.id,
          account_status: 'active',
          is_active: true,
          invited_by: adminUser?.id || null,
          invited_at: new Date().toISOString(),
        });

      if (profileError) {
        console.log(`   ❌ Profile error for ${faculty.full_name}: ${profileError.message}`);
        // Clean up auth user
        await supabase.auth.admin.deleteUser(userId);
        results.push({ name: faculty.full_name, status: 'error', message: profileError.message });
        continue;
      }

      // Create faculty record
      const { error: facultyError } = await supabase
        .from('faculty')
        .insert({
          user_id: userId,
          program_id: program.id,
          title: faculty.credentials || null,
          is_evaluator: faculty.is_evaluator ?? true,
        });

      if (facultyError) {
        console.log(`   ⚠️  Faculty record error (user created): ${facultyError.message}`);
      }

      // Generate password reset link only if sending emails
      if (SEND_EMAILS) {
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: faculty.personal_email.toLowerCase(),
        });
        console.log(`   ✅ Created: ${faculty.full_name}`);
        if (linkData?.properties?.action_link) {
          console.log(`      Password reset link: ${linkData.properties.action_link}`);
        }
      } else {
        console.log(`   ✅ Created: ${faculty.full_name} (password: ${DEFAULT_PASSWORD})`);
      }

      results.push({ name: faculty.full_name, status: 'created', message: 'Account created' });
    } catch (error) {
      console.log(`   ❌ Error for ${faculty.full_name}: ${error}`);
      results.push({ name: faculty.full_name, status: 'error', message: String(error) });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  
  const created = results.filter(r => r.status === 'created').length;
  const exists = results.filter(r => r.status === 'exists').length;
  const errors = results.filter(r => r.status === 'error').length;

  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⚠️  Already existed: ${exists}`);
  console.log(`   ❌ Errors: ${errors}`);

  if (errors > 0) {
    console.log('\n   Errors:');
    results
      .filter(r => r.status === 'error')
      .forEach(r => console.log(`   - ${r.name}: ${r.message}`));
  }

  console.log('\n✨ Done!\n');
  if (SEND_EMAILS) {
    console.log('Note: Faculty members should receive password reset emails.');
    console.log('If emails are not configured, use the password reset links above.\n');
  } else {
    console.log(`Note: All accounts created with password: ${DEFAULT_PASSWORD}`);
    console.log('You can share this password manually or reset passwords from /admin/users\n');
  }
}

seedCoreFaculty().catch(console.error);

