// API Route: Clinical Cases
// GET /api/clinical-cases - List all available clinical cases
// POST /api/clinical-cases - Create a new clinical case (educators only)

import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { getServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/clinical-cases - List cases
export async function GET(request: NextRequest) {
  try {
    // Use checkApiPermission for auth (handles cookies + Bearer tokens)
    const authResult = await checkApiPermission(request);
    if (!authResult.authorized) {
      return authResult.response!;
    }

    // Use shared server client (respects RLS)
    const supabase = getServerSupabaseClient();

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
    // Require educator role
    const authResult = await checkApiPermission(request, {
      requiredRoles: ['faculty', 'program_director', 'super_admin']
    });
    if (!authResult.authorized) {
      return authResult.response!;
    }

    // Use shared server client (respects RLS)
    const supabase = getServerSupabaseClient();

    // Get user profile to check institution (using cached auth result)
    // We need institution_id, so fetch it
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('institution_id')
      .eq('id', authResult.userId!)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
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


