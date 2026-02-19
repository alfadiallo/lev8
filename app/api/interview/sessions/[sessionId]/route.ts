import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const DEMO_INTERVIEWER_EMAILS = new Set([
  'sarah.chen@hospital.edu',
  'emily.watson@hospital.edu',
]);
const DEMO_SESSION_PREFIX = '11111111-0001-0001-0001-';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const shareToken = searchParams.get('token');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the session
    const query = supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId);

    const { data: session, error: sessionError } = await query.single();

    if (sessionError) {
      console.error('[session] GET error:', sessionError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check access: creator, share token, public, or assigned interviewer
    let hasAccess = 
      session.creator_email === email?.toLowerCase() ||
      session.share_token === shareToken ||
      session.is_public;

    // Also check if user is an assigned interviewer for this session
    if (!hasAccess && email) {
      const { data: interviewerRecord } = await supabase
        .from('interview_session_interviewers')
        .select('id')
        .eq('session_id', sessionId)
        .eq('interviewer_email', email.toLowerCase())
        .single();
      
      if (interviewerRecord) {
        hasAccess = true;
      }
    }

    // Allow demo interviewer personas to open seeded demo interview dates.
    if (!hasAccess && email && sessionId.startsWith(DEMO_SESSION_PREFIX)) {
      if (DEMO_INTERVIEWER_EMAILS.has(email.toLowerCase())) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch candidates
    const { data: candidates, error: candidatesError } = await supabase
      .from('interview_candidates')
      .select('*')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (candidatesError) {
      console.error('[session] candidates error:', candidatesError);
    }

    return NextResponse.json({
      session,
      candidates: candidates || [],
    });
  } catch (error) {
    console.error('[session] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { session_name, session_date, status, notes } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updateData: Record<string, unknown> = {};
    if (session_name !== undefined) updateData.session_name = session_name;
    if (session_date !== undefined) updateData.session_date = session_date;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updated_at = new Date().toISOString();

    const { data: session, error } = await supabase
      .from('interview_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('[session] PATCH error:', error);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('[session] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('interview_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('[session] DELETE error:', error);
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[session] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
