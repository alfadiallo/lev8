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

    // Get institution_id (required for user_profiles)
    // Use the known institution ID from seed data
    const institutionId = '7a617a6d-c0e7-4c30-bcf7-12bd123432e9';
    
    // Verify institution exists
    const { data: institutionData } = await supabase
      .from('health_systems')
      .select('id')
      .eq('id', institutionId)
      .single();
    
    let finalInstitutionId = institutionId;
    
    if (!institutionData) {
      console.error('[Register] Institution not found, trying to get any institution');
      const { data: anyInstitution } = await supabase
        .from('health_systems')
        .select('id')
        .limit(1)
        .single();
      
      if (!anyInstitution) {
        return NextResponse.json(
          { error: 'No institution configured. Please contact administrator.' },
          { status: 500 }
        );
      }
      
      finalInstitutionId = anyInstitution.id;
    }

    // Create user_profiles record - match actual schema
    const fullName = `${firstName} ${lastName}`.trim();
    const profileData = {
      id: authData.user?.id,
      email,
      full_name: fullName,
      display_name: firstName,
      role: 'resident',
      institution_id: finalInstitutionId,
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

    // Find any available program for the institution
    const { data: programs, error: programQueryError } = await supabase
      .from('programs')
      .select('id, name')
      .eq('health_system_id', finalInstitutionId)
      .limit(1)
      .maybeSingle();

    let programId: string | null = null;

    if (programQueryError) {
      console.error('[Register] Program query error:', programQueryError);
    }

    if (!programs || !programs.id) {
      console.error('[Register] No program found for institution, trying to find any program');
      // Fallback: try to find any program
      const { data: anyProgram } = await supabase
        .from('programs')
        .select('id, name')
        .limit(1)
        .maybeSingle();
      
      if (anyProgram?.id) {
        programId = anyProgram.id;
        console.log('[Register] Using fallback program:', anyProgram.name, 'ID:', programId);
      } else {
        console.error('[Register] No program found in database at all');
        // Don't fail registration - resident record creation is optional
        console.log('[Register] Continuing without program (resident record may not be created)');
      }
    } else {
      programId = programs.id;
      console.log('[Register] Using program:', programs.name, 'ID:', programId);
    }

    // Create resident record (optional - needed for voice journal)
    // Only create if we have a program_id
    let residentCreated = false;
    if (programId) {
      console.log('[Register] Attempting to create resident record...');
      
      // First, we need a class_id - get the first active class for the program
      const { data: academicClass } = await supabase
        .from('academic_classes')
        .select('id')
        .eq('program_id', programId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      
      if (academicClass?.id) {
        const { error: residentError } = await supabase
          .from('residents')
          .insert({
            user_id: authData.user?.id,
            program_id: programId,
            class_id: academicClass.id,
            medical_school: medicalSchool || 'Not specified',
            specialty: specialty || 'Emergency Medicine',
          });

        if (residentError) {
          console.error('[Register] Resident creation failed:', residentError.code, residentError.message);
          console.log('[Register] Voice Journal may not work without resident record');
          // Don't fail registration - profile was created successfully
        } else {
          console.log('[Register] ✅ Resident record created successfully!');
          residentCreated = true;
        }
      } else {
        console.log('[Register] No academic class found - skipping resident record creation');
        console.log('[Register] Voice Journal may not work without resident record');
      }
    } else {
      console.log('[Register] No program_id available - skipping resident record creation');
      console.log('[Register] Voice Journal may not work without resident record');
    }

    return NextResponse.json(
      { 
        userId: authData.user?.id,
        email: authData.user?.email,
        message: 'Registration successful. You can now log in.',
        profileCreated: residentCreated,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}