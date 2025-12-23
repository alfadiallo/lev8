// API Route: Clinical Cases
// GET /api/clinical-cases - List all available clinical cases
// POST /api/clinical-cases - Create a new clinical case (educators only)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/clinical-cases - List cases
export async function GET(request: NextRequest) {
  try {
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

    // Get user profile to check institution
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('institution_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Fetch cases - RLS will filter based on institution and active status
    const { data: cases, error } = await supabase
      .from('clinical_cases')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ClinicalCases] Error fetching cases:', error);
      return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
    }

    return NextResponse.json({ cases: cases || [] }, { status: 200 });
  } catch (error) {
    console.error('[ClinicalCases] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/clinical-cases - Create case (educators only)
export async function POST(request: NextRequest) {
  try {
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

    // Get user profile to check role and institution
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('institution_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user is educator
    const educatorRoles = ['faculty', 'program_director', 'super_admin'];
    if (!educatorRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: 'Only educators can create clinical cases' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      difficulty,
      specialty,
      estimated_duration_minutes,
      case_data,
      is_public = false,
    } = body;

    // Validate required fields
    if (!title || !case_data) {
      return NextResponse.json(
        { error: 'Title and case_data are required' },
        { status: 400 }
      );
    }

    // Create case
    const { data: newCase, error } = await supabase
      .from('clinical_cases')
      .insert({
        institution_id: profile.institution_id,
        title,
        description,
        difficulty: difficulty || 'intermediate',
        specialty,
        estimated_duration_minutes,
        case_data,
        created_by_user_id: user.id,
        is_public,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[ClinicalCases] Error creating case:', error);
      return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
    }

    return NextResponse.json({ case: newCase }, { status: 201 });
  } catch (error) {
    console.error('[ClinicalCases] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


