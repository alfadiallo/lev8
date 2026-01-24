import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This is a one-time setup endpoint - should be removed or protected in production
export async function POST(_request: NextRequest) {
  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const email = 'Kenholton90@gmail.com';
    const password = 'Test1234';

    // Step 1: Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;

    if (existingUser) {
      console.log('[SetupTestUser] User already exists:', existingUser.id);
      userId = existingUser.id;
      
      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password,
        email_confirm: true,
      });
      
      if (updateError) {
        console.error('[SetupTestUser] Error updating user:', updateError);
      }
    } else {
      // Step 2: Create auth user (no email confirmation required)
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          first_name: 'Ken',
          last_name: 'Holton',
        },
      });

      if (authError) {
        console.error('[SetupTestUser] Auth error:', authError);
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      userId = authUser.user.id;
      console.log('[SetupTestUser] Created auth user:', userId);
    }

    // Step 3: Create or update user_profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: userId,
        email: email,
        first_name: 'Ken',
        last_name: 'Holton',
        role: 'resident',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (profileError) {
      console.error('[SetupTestUser] Profile error:', profileError);
      // Don't fail - profile might already exist
    }

    // Step 4: Get MHS health system and EM program IDs
    const { data: healthSystem } = await supabaseAdmin
      .from('health_systems')
      .select('id')
      .eq('slug', 'mhs')
      .single();

    const { data: program } = await supabaseAdmin
      .from('programs')
      .select('id')
      .eq('slug', 'em')
      .single();

    if (!healthSystem || !program) {
      return NextResponse.json({ 
        error: 'MHS or EM program not found. Run migrations first.',
        healthSystem,
        program,
      }, { status: 400 });
    }

    // Step 5: Create organization_membership for MHS EM
    const { error: membershipError } = await supabaseAdmin
      .from('organization_memberships')
      .upsert({
        user_id: userId,
        health_system_id: healthSystem.id,
        program_id: program.id,
        role: 'resident',
        is_primary: true,
        granted_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,health_system_id,program_id',
      });

    if (membershipError) {
      console.error('[SetupTestUser] Membership error:', membershipError);
      // Don't fail - might already exist
    }

    // Step 6: Create studio_creators entry (approved)
    const { error: studioError } = await supabaseAdmin
      .from('studio_creators')
      .upsert({
        user_id: userId,
        status: 'approved',
        approved_at: new Date().toISOString(),
        content_count: 0,
      }, {
        onConflict: 'user_id',
      });

    if (studioError) {
      console.error('[SetupTestUser] Studio creator error:', studioError);
      // Don't fail - might already exist
    }

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      user: {
        id: userId,
        email: email,
        password: 'Test1234',
        role: 'resident',
        organization: 'MHS',
        program: 'EM',
        studioAccess: true,
      },
      instructions: [
        'Login at /login with email: Kenholton90@gmail.com, password: Test1234',
        'User will be redirected to /mhs/em/dashboard',
        'User can only see Learn module (not Reflect, Understand, Truths, Expectations)',
        'User has Studio access at /studio',
      ],
    });

  } catch (error) {
    console.error('[SetupTestUser] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
