// API Route: Running Board Session Detail
// GET /api/running-board/sessions/[id] - Get session details with cases and actions
// PATCH /api/running-board/sessions/[id] - Update session status

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

// GET /api/running-board/sessions/[id] - Get session details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
              // Read-only in GET request
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

    // Fetch session with all related data
    const { data: session, error } = await supabase
      .from('running_board_sessions')
      .select(`
        *,
        facilitator:user_profiles!running_board_sessions_facilitator_id_fkey(full_name),
        learner:residents!running_board_sessions_learner_id_fkey(
          id,
          user_profiles!residents_user_id_fkey(full_name)
        ),
        preset:running_board_presets(name, description),
        session_cases:running_board_session_cases(
          column_position,
          case:running_board_cases(*)
        ),
        actions:running_board_actions(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('[RunningBoardSession] Error fetching session:', error);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user has access (facilitator, learner, or admin)
    const isParticipant = session.facilitator_id === user.id;
    // Could also check if user is learner or admin here

    if (!isParticipant) {
      // Check if user is admin/faculty at same institution
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('institution_id, role')
        .eq('id', user.id)
        .single();

      const isInstitutionAdmin = 
        profile?.institution_id === session.institution_id &&
        ['faculty', 'program_director', 'super_admin'].includes(profile?.role || '');

      if (!isInstitutionAdmin) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Transform the data
    const transformedSession = {
      ...session,
      facilitator_name: session.facilitator?.full_name || 'Unknown',
      learner_name: session.learner?.user_profiles?.full_name || 'Unknown',
      preset_name: session.preset?.name || 'Custom',
      cases: (session.session_cases || [])
        .sort((a: { column_position: number }, b: { column_position: number }) => 
          a.column_position - b.column_position
        )
        .map((sc: { case: Record<string, unknown>; column_position: number }) => ({
          ...(sc.case || {}),
          column_position: sc.column_position,
        })),
    };

    // Remove nested objects we've transformed
    delete transformedSession.facilitator;
    delete transformedSession.learner;
    delete transformedSession.preset;
    delete transformedSession.session_cases;

    return NextResponse.json({ session: transformedSession }, { status: 200 });
  } catch (error) {
    console.error('[RunningBoardSession] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/running-board/sessions/[id] - Update session status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
              // Read-only in PATCH request
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

    const body = await request.json();
    const {
      status,
      final_phase_reached,
      dark_mode_used,
    } = body;

    // Build update object
    const updateData: Record<string, unknown> = {};
    
    if (status) {
      updateData.status = status;
      
      // Set timestamps based on status
      if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed' || status === 'abandoned') {
        updateData.ended_at = new Date().toISOString();
        
        // Calculate total duration if started_at exists
        const { data: currentSession } = await supabase
          .from('running_board_sessions')
          .select('started_at')
          .eq('id', id)
          .single();
        
        if (currentSession?.started_at) {
          const startTime = new Date(currentSession.started_at).getTime();
          const endTime = Date.now();
          updateData.total_duration_seconds = Math.floor((endTime - startTime) / 1000);
        }
      }
    }
    
    if (final_phase_reached !== undefined) {
      updateData.final_phase_reached = final_phase_reached;
    }
    
    if (dark_mode_used !== undefined) {
      updateData.dark_mode_used = dark_mode_used;
    }

    // Update session (only if user is facilitator)
    const { data: updatedSession, error } = await supabase
      .from('running_board_sessions')
      .update(updateData)
      .eq('id', id)
      .eq('facilitator_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[RunningBoardSession] Error updating session:', error);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json({ session: updatedSession }, { status: 200 });
  } catch (error) {
    console.error('[RunningBoardSession] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}






