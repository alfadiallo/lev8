import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const email = searchParams.get('email');

    if (!code) {
      return NextResponse.json({ error: 'Session code is required' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up session by share_token
    const { data: session, error } = await supabase
      .from('interview_sessions')
      .select('id, session_name, status, session_type')
      .eq('share_token', code)
      .single();

    if (error || !session) {
      console.error('[join] Session lookup error:', error);
      return NextResponse.json(
        { error: 'Session not found. Please check your session code.' },
        { status: 404 }
      );
    }

    // Check if session is still active
    if (session.status === 'completed' || session.status === 'archived') {
      return NextResponse.json(
        { error: 'This session has been closed.' },
        { status: 403 }
      );
    }

    // For group sessions, optionally add the user as an interviewer if not already
    if (session.session_type === 'group') {
      // Check if user is already an interviewer
      const { data: existingInterviewer } = await supabase
        .from('interview_session_interviewers')
        .select('id')
        .eq('session_id', session.id)
        .eq('interviewer_email', email.toLowerCase())
        .single();

      if (!existingInterviewer) {
        // Get user profile if exists
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .eq('email', email.toLowerCase())
          .single();

        // Add as interviewer
        await supabase
          .from('interview_session_interviewers')
          .insert({
            session_id: session.id,
            user_id: userProfile?.id || null,
            interviewer_email: email.toLowerCase(),
            interviewer_name: userProfile?.full_name || email.split('@')[0],
            role: 'interviewer',
          });
      }
    }

    return NextResponse.json({
      sessionId: session.id,
      sessionName: session.session_name,
    });
  } catch (error) {
    console.error('[join] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
