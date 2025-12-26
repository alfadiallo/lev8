// API Route: ACLS Scenarios
// GET /api/acls/scenarios - List all available ACLS scenarios
// POST /api/acls/scenarios - Create a new scenario (educators only)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

// GET /api/acls/scenarios - List scenarios
export async function GET(request: NextRequest) {
  try {
    // Use cookie-based auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // Read-only
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use service client for data fetching (bypasses RLS)
    const serviceClient = await getServiceSupabaseClient();

    // Fetch scenarios
    const { data: scenarios, error } = await serviceClient
      .from('acls_scenarios')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ACLSScenarios] Error fetching scenarios:', error);
      return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 });
    }

    return NextResponse.json({ scenarios: scenarios || [] }, { status: 200 });
  } catch (error) {
    console.error('[ACLSScenarios] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/acls/scenarios - Create scenario (educators only)
export async function POST(request: NextRequest) {
  try {
    // Use cookie-based auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // Read-only
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service client for data operations
    const serviceClient = await getServiceSupabaseClient();

    // Get user profile to check role
    const { data: profile } = await serviceClient
      .from('user_profiles')
      .select('institution_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user is educator
    const educatorRoles = ['faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin'];
    if (!educatorRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: 'Only educators can create ACLS scenarios' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, scenario_data, is_public = false } = body;

    if (!title || !scenario_data) {
      return NextResponse.json(
        { error: 'Title and scenario_data are required' },
        { status: 400 }
      );
    }

    const { data: newScenario, error } = await serviceClient
      .from('acls_scenarios')
      .insert({
        institution_id: profile.institution_id,
        title,
        description,
        scenario_data,
        created_by_user_id: user.id,
        is_public,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[ACLSScenarios] Error creating scenario:', error);
      return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 });
    }

    return NextResponse.json({ scenario: newScenario }, { status: 201 });
  } catch (error) {
    console.error('[ACLSScenarios] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


