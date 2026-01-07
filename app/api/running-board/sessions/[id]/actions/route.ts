// API Route: Running Board Session Actions
// GET /api/running-board/sessions/[id]/actions - Get all actions for a session
// POST /api/running-board/sessions/[id]/actions - Record a checkbox action

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

// GET /api/running-board/sessions/[id]/actions - Get all actions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    
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

    // Verify user has access to this session
    const { data: session } = await supabase
      .from('running_board_sessions')
      .select('facilitator_id, institution_id')
      .eq('id', sessionId)
      .single();

    if (!session || session.facilitator_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch all actions for the session
    const { data: actions, error } = await supabase
      .from('running_board_actions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[RunningBoardActions] Error fetching actions:', error);
      return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
    }

    return NextResponse.json({ actions: actions || [] }, { status: 200 });
  } catch (error) {
    console.error('[RunningBoardActions] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/running-board/sessions/[id]/actions - Record action
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    
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
              // Read-only in POST request
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

    // Verify user is the facilitator
    const { data: session } = await supabase
      .from('running_board_sessions')
      .select('facilitator_id')
      .eq('id', sessionId)
      .single();

    if (!session || session.facilitator_id !== user.id) {
      return NextResponse.json({ error: 'Only facilitator can record actions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      case_id,
      checklist_item_id,
      phase_id,
      is_critical,
      checked,
      elapsed_time_seconds,
    } = body;

    // Validate required fields
    if (!case_id || !checklist_item_id || phase_id === undefined || checked === undefined) {
      return NextResponse.json(
        { error: 'case_id, checklist_item_id, phase_id, and checked are required' },
        { status: 400 }
      );
    }

    // Check if action already exists for this item
    const { data: existingAction } = await supabase
      .from('running_board_actions')
      .select('id, checked')
      .eq('session_id', sessionId)
      .eq('case_id', case_id)
      .eq('checklist_item_id', checklist_item_id)
      .single();

    if (existingAction) {
      // Update existing action
      const updateData: Record<string, unknown> = {
        checked,
      };

      if (checked) {
        updateData.checked_at = new Date().toISOString();
        updateData.elapsed_time_seconds = elapsed_time_seconds || null;
      } else {
        updateData.unchecked_at = new Date().toISOString();
      }

      const { data: updatedAction, error } = await supabase
        .from('running_board_actions')
        .update(updateData)
        .eq('id', existingAction.id)
        .select()
        .single();

      if (error) {
        console.error('[RunningBoardActions] Error updating action:', error);
        return NextResponse.json({ error: 'Failed to update action' }, { status: 500 });
      }

      return NextResponse.json({ action: updatedAction }, { status: 200 });
    }

    // Create new action
    const { data: newAction, error } = await supabase
      .from('running_board_actions')
      .insert({
        session_id: sessionId,
        case_id,
        checklist_item_id,
        phase_id,
        is_critical: is_critical || false,
        checked,
        checked_at: checked ? new Date().toISOString() : null,
        elapsed_time_seconds: elapsed_time_seconds || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[RunningBoardActions] Error creating action:', error);
      return NextResponse.json({ error: 'Failed to create action' }, { status: 500 });
    }

    return NextResponse.json({ action: newAction }, { status: 201 });
  } catch (error) {
    console.error('[RunningBoardActions] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

