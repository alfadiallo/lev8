// API Route: ACLS Sessions
// GET /api/acls/sessions - Get user's ACLS sessions
// POST /api/acls/sessions - Create or update ACLS session

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/acls/sessions - Get sessions
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

    const { data: sessions, error } = await supabase
      .from('acls_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('[ACLSSessions] Error fetching sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions: sessions || [] }, { status: 200 });
  } catch (error) {
    console.error('[ACLSSessions] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/acls/sessions - Create or update session
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

    const body = await request.json();
    const {
      scenario_id,
      current_state,
      context_data,
      choices_made,
      performance_metrics,
      completed,
      session_id,
    } = body;

    if (!scenario_id) {
      return NextResponse.json(
        { error: 'scenario_id is required' },
        { status: 400 }
      );
    }

    // If session_id is provided, update existing session
    if (session_id) {
      const updateData: any = {};
      if (current_state !== undefined) updateData.current_state = current_state;
      if (context_data !== undefined) updateData.context_data = context_data;
      if (choices_made !== undefined) updateData.choices_made = choices_made;
      if (performance_metrics !== undefined) updateData.performance_metrics = performance_metrics;
      if (completed !== undefined) {
        updateData.completed = completed;
        if (completed) {
          updateData.completed_at = new Date().toISOString();
        }
      }

      const { data: updatedSession, error } = await supabase
        .from('acls_sessions')
        .update(updateData)
        .eq('id', session_id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('[ACLSSessions] Error updating session:', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
      }

      return NextResponse.json({ session: updatedSession }, { status: 200 });
    }

    // Create new session
    const { data: newSession, error } = await supabase
      .from('acls_sessions')
      .insert({
        user_id: user.id,
        scenario_id,
        current_state: current_state || {},
        context_data: context_data || {},
        choices_made: choices_made || [],
        performance_metrics: performance_metrics || {},
        completed: completed || false,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[ACLSSessions] Error creating session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error('[ACLSSessions] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


