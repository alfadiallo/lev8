import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/users/directory - Get program directory (residents, faculty)
export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission (program director or super admin)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, institution_id')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'program_director' && profile.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'You do not have permission to view the directory' },
        { status: 403 }
      );
    }

    // Get program information
    const { data: programs } = await supabase
      .from('programs')
      .select('id, name, specialty')
      .eq('health_system_id', profile.institution_id)
      .limit(1)
      .single();

    // Get residents
    const { data: residents } = await supabase
      .from('residents')
      .select(`
        id,
        user_id,
        user_profiles!inner(
          id,
          full_name,
          email
        ),
        classes!inner(
          graduation_year
        )
      `)
      .order('user_profiles(full_name)');

    // Get faculty (active only)
    const { data: faculty } = await supabase
      .from('faculty')
      .select(`
        id,
        user_id,
        title,
        user_profiles!inner(
          id,
          full_name,
          email
        )
      `)
      .eq('is_active', true)
      .order('user_profiles(full_name)');

    // Format the data
    const formattedResidents = residents?.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      full_name: r.user_profiles.full_name,
      email: r.user_profiles.email,
      class_year: r.classes.graduation_year,
    })) || [];

    const formattedFaculty = faculty?.map((f: any) => ({
      id: f.id,
      user_id: f.user_id,
      full_name: f.user_profiles.full_name,
      email: f.user_profiles.email,
      title: f.title,
    })) || [];

    return NextResponse.json({
      program: {
        name: programs?.name || 'Emergency Medicine Residency',
        specialty: programs?.specialty || 'Emergency Medicine',
        health_system: 'Memorial Hospital West',
        residents: formattedResidents,
        faculty: formattedFaculty,
      },
    });
  } catch (error) {
    console.error('[API] Directory fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

