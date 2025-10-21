import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, phone, institution, specialty, medicalSchool, residencyProgram } = body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (authError) {
      console.error('Auth creation failed:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Create user_profiles record
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: 'resident', // Default role
        institution_id: institution, // Should be UUID of Memorial Hospital West
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation failed:', profileError);
      // Cleanup: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // For MVP: Create resident record (assuming all signups are residents)
    const { data: classData } = await supabase
      .from('academic_classes')
      .select('id')
      .eq('program_id', residencyProgram)
      .single();

    if (classData) {
      await supabase
        .from('residents')
        .insert({
          user_id: authData.user.id,
          program_id: residencyProgram,
          class_id: classData.id,
          medical_school: medicalSchool,
          specialty,
        });
    }

    return NextResponse.json(
      {
        userId: authData.user.id,
        email,
        message: 'User created. Check email for verification link.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}