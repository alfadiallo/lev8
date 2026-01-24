// API Route: Training Sessions
// GET /api/conversations/sessions - Get user's training sessions
// POST /api/conversations/sessions - Create a new training session

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/conversations/sessions - Get sessions
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

    // Get user's sessions - RLS will filter
    const { data: sessions, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('module_type', 'vignette')
      .order('start_time', { ascending: false });

    if (error) {
      console.error('[TrainingSessions] Error fetching sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions: sessions || [] }, { status: 200 });
  } catch (error) {
    console.error('[TrainingSessions] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/sessions - Create session
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
      vignette_id,
      vignette_title,
      difficulty,
      messages = [],
      metrics = {},
      session_data = {},
    } = body;

    if (!vignette_title || !difficulty) {
      return NextResponse.json(
        { error: 'vignette_title and difficulty are required' },
        { status: 400 }
      );
    }

    const { data: newSession, error } = await supabase
      .from('training_sessions')
      .insert({
        user_id: user.id,
        vignette_id,
        vignette_title,
        module_type: 'vignette',
        difficulty,
        messages: messages.map((msg: { timestamp: string | Date; [key: string]: unknown }) => ({
          ...msg,
          timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : msg.timestamp.toISOString(),
        })),
        metrics,
        session_data,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[TrainingSessions] Error creating session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error('[TrainingSessions] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


