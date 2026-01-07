// API Route: Running Board Sessions
// GET /api/running-board/sessions - List sessions (with filters)
// POST /api/running-board/sessions - Create a new simulation session

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

// GET /api/running-board/sessions - List sessions with filters
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            cookiesToSet.forEach(({ name: _name, value: _value, options: _options }) => {
              // We don't need to set cookies in this GET request
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getServiceSupabaseClient();

    // Parse query params for filtering
    const url = new URL(request.url);
    const learner_id = url.searchParams.get('learner_id');
    const status = url.searchParams.get('status');
    const from_date = url.searchParams.get('from_date');
    const to_date = url.searchParams.get('to_date');

    // Build query - get sessions where user is facilitator or learner
    let query = supabase
      .from('running_board_sessions')
      .select(`
        *,
        learner:residents!running_board_sessions_learner_id_fkey(
          id,
          user_profiles!residents_user_id_fkey(full_name)
        ),
        preset:running_board_presets(name)
      `)
      .or(`facilitator_id.eq.${user.id}`);

    // Apply filters
    if (learner_id) {
      query = query.eq('learner_id', learner_id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (from_date) {
      query = query.gte('created_at', from_date);
    }
    if (to_date) {
      query = query.lte('created_at', to_date);
    }

    const { data: sessions, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[RunningBoardSessions] Error fetching sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Transform the data for easier consumption
    const transformedSessions = (sessions || []).map(s => ({
      ...s,
      learner_name: s.learner?.user_profiles?.full_name || 'Unknown',
      preset_name: s.preset?.name || 'Custom',
    }));

    return NextResponse.json({ sessions: transformedSessions }, { status: 200 });
  } catch (error) {
    console.error('[RunningBoardSessions] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/running-board/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            cookiesToSet.forEach(({ name: _name, value: _value, options: _options }) => {
              // We don't need to set cookies in this POST request
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getServiceSupabaseClient();

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('institution_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      learner_id,
      learner_pgy_level,
      preset_id,
      case_ids, // Array of case UUIDs for custom selection
      educator_id,
      educator_name,
      educator_type, // 'resident' | 'faculty' | 'custom'
    } = body;

    // Validate required fields
    if (!learner_id || !learner_pgy_level) {
      return NextResponse.json(
        { error: 'learner_id and learner_pgy_level are required' },
        { status: 400 }
      );
    }

    if (!preset_id && (!case_ids || case_ids.length === 0)) {
      return NextResponse.json(
        { error: 'Either preset_id or case_ids must be provided' },
        { status: 400 }
      );
    }

    // Create the session
    const { data: newSession, error: sessionError } = await supabase
      .from('running_board_sessions')
      .insert({
        institution_id: profile.institution_id,
        facilitator_id: user.id,
        learner_id,
        learner_pgy_level,
        preset_id: preset_id || null,
        educator_id: educator_id || null,
        educator_name: educator_name || null,
        educator_type: educator_type || null,
        status: 'setup',
      })
      .select()
      .single();

    if (sessionError) {
      console.error('[RunningBoardSessions] Error creating session:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Determine which cases to use
    let casesToInsert: string[] = [];
    
    if (preset_id) {
      // Get case IDs from preset
      const { data: preset } = await supabase
        .from('running_board_presets')
        .select('case_ids')
        .eq('id', preset_id)
        .single();
      
      casesToInsert = preset?.case_ids || [];
    } else {
      casesToInsert = case_ids;
    }

    // Insert session cases with column positions
    const sessionCases = casesToInsert.map((caseId: string, index: number) => ({
      session_id: newSession.id,
      case_id: caseId,
      column_position: index + 1,
    }));

    const { error: casesError } = await supabase
      .from('running_board_session_cases')
      .insert(sessionCases);

    if (casesError) {
      console.error('[RunningBoardSessions] Error inserting session cases:', casesError);
      // Clean up the session
      await supabase.from('running_board_sessions').delete().eq('id', newSession.id);
      return NextResponse.json({ error: 'Failed to associate cases with session' }, { status: 500 });
    }

    // Fetch the complete session with cases
    const { data: fullSession } = await supabase
      .from('running_board_sessions')
      .select(`
        *,
        session_cases:running_board_session_cases(
          column_position,
          case:running_board_cases(*)
        )
      `)
      .eq('id', newSession.id)
      .single();

    return NextResponse.json({ session: fullSession }, { status: 201 });
  } catch (error) {
    console.error('[RunningBoardSessions] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


