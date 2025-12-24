// API Route: Case Attempts
// GET /api/clinical-cases/[id]/attempts - Get user's attempts for a case
// POST /api/clinical-cases/[id]/attempts - Create or update attempt

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/clinical-cases/[id]/attempts - Get attempts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get user's attempts for this case
    const { data: attempts, error } = await supabase
      .from('case_attempts')
      .select('*')
      .eq('case_id', id)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('[CaseAttempts] Error fetching attempts:', error);
      return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });
    }

    return NextResponse.json({ attempts: attempts || [] }, { status: 200 });
  } catch (error) {
    console.error('[CaseAttempts] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/clinical-cases/[id]/attempts - Create or update attempt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { progress_data, score, completed, attempt_id } = body;

    // If attempt_id is provided, update existing attempt
    if (attempt_id) {
      const updateData: Record<string, unknown> = {};
      if (progress_data !== undefined) updateData.progress_data = progress_data;
      if (score !== undefined) updateData.score = score;
      if (completed !== undefined) {
        updateData.completed = completed;
        if (completed) {
          updateData.completed_at = new Date().toISOString();
        }
      }

      const { data: updatedAttempt, error } = await supabase
        .from('case_attempts')
        .update(updateData)
        .eq('id', attempt_id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('[CaseAttempts] Error updating attempt:', error);
        return NextResponse.json({ error: 'Failed to update attempt' }, { status: 500 });
      }

      return NextResponse.json({ attempt: updatedAttempt }, { status: 200 });
    }

    // Create new attempt
    const { data: newAttempt, error } = await supabase
      .from('case_attempts')
      .insert({
        case_id: id,
        user_id: user.id,
        progress_data: progress_data || {},
        score,
        completed: completed || false,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[CaseAttempts] Error creating attempt:', error);
      return NextResponse.json({ error: 'Failed to create attempt' }, { status: 500 });
    }

    return NextResponse.json({ attempt: newAttempt }, { status: 201 });
  } catch (error) {
    console.error('[CaseAttempts] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


