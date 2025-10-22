import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * SIMPLIFIED REGISTRATION - Just create auth user and profile
 * Resident record is optional and won't fail registration
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, phone } = body;

    console.log('[SimpleRegister] Starting for:', email);

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('[SimpleRegister] Auth error:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Signup failed' },
        { status: 400 }
      );
    }

    console.log('[SimpleRegister] Auth user created:', authData.user.id);

    // 2. Create profile (minimal required fields)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: `${firstName || ''} ${lastName || ''}`.trim(),
        display_name: firstName || email.split('@')[0],
        role: 'resident',
        phone: phone || null,
        is_active: true,
      });

    if (profileError) {
      console.error('[SimpleRegister] Profile error:', profileError);
      
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: 'Failed to create profile: ' + profileError.message },
        { status: 500 }
      );
    }

    console.log('[SimpleRegister] Profile created');

    // 3. Try to create resident record (optional - won't fail registration)
    const { data: program } = await supabase
      .from('programs')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (program) {
      const { error: residentError } = await supabase
        .from('residents')
        .insert({
          user_id: authData.user.id,
          program_id: program.id,
          medical_school: 'Not specified',
          specialty: 'Emergency Medicine',
        });

      if (residentError) {
        console.log('[SimpleRegister] Resident record skipped:', residentError.message);
      } else {
        console.log('[SimpleRegister] Resident record created');
      }
    }

    console.log('[SimpleRegister] ✅ SUCCESS');

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      email: authData.user.email,
      message: 'Registration successful! You can now log in.',
    });

  } catch (error) {
    console.error('[SimpleRegister] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}

