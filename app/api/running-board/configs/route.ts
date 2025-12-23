// API Route: Running Board Configs
// GET /api/running-board/configs - List all available board configurations
// POST /api/running-board/configs - Create a new configuration (educators only)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/running-board/configs - List configs
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

    // Fetch configs - RLS will filter
    const { data: configs, error } = await supabase
      .from('running_board_configs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[RunningBoardConfigs] Error fetching configs:', error);
      return NextResponse.json({ error: 'Failed to fetch configs' }, { status: 500 });
    }

    return NextResponse.json({ configs: configs || [] }, { status: 200 });
  } catch (error) {
    console.error('[RunningBoardConfigs] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/running-board/configs - Create config (educators only)
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

    // Get user profile to check role
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
        { error: 'Only educators can create board configurations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      patient_count,
      difficulty,
      config_data,
      is_public = false,
    } = body;

    if (!name || !patient_count) {
      return NextResponse.json(
        { error: 'Name and patient_count are required' },
        { status: 400 }
      );
    }

    const { data: newConfig, error } = await supabase
      .from('running_board_configs')
      .insert({
        institution_id: profile.institution_id,
        name,
        description,
        patient_count,
        difficulty: difficulty || 'intermediate',
        config_data: config_data || {},
        created_by_user_id: user.id,
        is_public,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[RunningBoardConfigs] Error creating config:', error);
      return NextResponse.json({ error: 'Failed to create config' }, { status: 500 });
    }

    return NextResponse.json({ config: newConfig }, { status: 201 });
  } catch (error) {
    console.error('[RunningBoardConfigs] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


