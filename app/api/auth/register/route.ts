import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * User Registration - Creates auth user, profile, and optionally resident record
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, phone, medicalSchool, specialty, residencyProgram, institution } = body;

    console.log('[Register] Request data:', { email, firstName, lastName, residencyProgram, institution });

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Auth signup failed:', authError);
      return NextResponse.json(
        { error: authError.message || 'Signup failed' },
        { status: 400 }
      );
    }

    // Create user_profiles record - match actual schema
    const fullName = `${firstName} ${lastName}`.trim();
    const profileData: any = {
      id: authData.user?.id,
      email,
      full_name: fullName,
      display_name: firstName,
      role: 'resident',
      is_active: true,
      phone: phone || null,
    };
    
    console.log('[Register] Creating profile:', profileData);
    
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert(profileData);

    if (profileError) {
      console.error('[Register] Profile creation failed:', profileError);
      return NextResponse.json(
        { 
          error: 'Failed to create profile',
          details: profileError.message 
        },
        { status: 500 }
      );
    }

    // Find any available program
    const { data: programs, error: programQueryError } = await supabase
      .from('programs')
      .select('id, name')
      .limit(1)
      .maybeSingle();

    if (programQueryError) {
      console.error('[Register] Program query error:', programQueryError);
    }

    if (!programs || !programs.id) {
      console.error('[Register] No program found in database');
      return NextResponse.json(
        { 
          error: 'No program configured. Please contact administrator.',
          hint: 'Database may need seeding: POST /api/seed-data'
        },
        { status: 500 }
      );
    }
    
    const programId = programs.id;
    console.log('[Register] Using program:', programs.name, 'ID:', programId);

    // Create resident record (optional - needed for voice journal)
    console.log('[Register] Attempting to create resident record...');
    
    const { error: residentError } = await supabase
      .from('residents')
      .insert({
        user_id: authData.user?.id,
        program_id: programId,
        medical_school: medicalSchool || 'Not specified',
        specialty: specialty || 'Emergency Medicine',
      });

    if (residentError) {
      console.error('[Register] Resident creation failed:', residentError.code, residentError.message);
      console.log('[Register] Voice Journal may not work without resident record');
      console.log('[Register] Run SQL to create residents table: See SETUP-GUIDE.md');
      // Don't fail registration - profile was created successfully
    } else {
      console.log('[Register] ✅ Resident record created successfully!');
    }

    return NextResponse.json(
      { 
        userId: authData.user?.id,
        email: authData.user?.email,
        message: 'Registration successful. You can now log in.',
        profileCreated: !residentError,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: error?.message || 'Registration failed' },
      { status: 500 }
    );
  }
}