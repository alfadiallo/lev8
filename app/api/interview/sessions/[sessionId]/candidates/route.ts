import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAccess } from '@/lib/stripe/subscription';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const FREE_CANDIDATE_LIMIT = 5;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: candidates, error } = await supabase
      .from('interview_candidates')
      .select('*')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[candidates] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
    }

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error('[candidates] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { candidate_name, candidate_email, medical_school, graduation_year } = body;

    if (!candidate_name) {
      return NextResponse.json({ error: 'Candidate name is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get session to check creator email and session type
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('creator_email, session_type')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check access limits for individual sessions
    if (session.session_type === 'individual' && session.creator_email) {
      const accessResult = await checkAccess(
        session.creator_email,
        'individual',
        FREE_CANDIDATE_LIMIT
      );

      // If user doesn't have active subscription and has reached limit
      if (!accessResult.hasAccess && accessResult.reason === 'limit_reached') {
        return NextResponse.json(
          { 
            error: 'Candidate limit reached',
            message: `Free accounts are limited to ${FREE_CANDIDATE_LIMIT} candidates. Upgrade to add unlimited candidates.`,
            candidateCount: accessResult.candidateCount,
            limit: FREE_CANDIDATE_LIMIT,
          },
          { status: 403 }
        );
      }
    }

    // Get the current max sort_order for this session
    const { data: existingCandidates } = await supabase
      .from('interview_candidates')
      .select('sort_order')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = existingCandidates && existingCandidates.length > 0 
      ? (existingCandidates[0].sort_order || 0) + 1 
      : 0;

    const { data: candidate, error } = await supabase
      .from('interview_candidates')
      .insert({
        session_id: sessionId,
        candidate_name,
        candidate_email: candidate_email?.toLowerCase() || null,
        medical_school: medical_school || null,
        graduation_year: graduation_year || null,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('[candidates] POST error:', error);
      return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
    }

    return NextResponse.json(candidate, { status: 201 });
  } catch (error) {
    console.error('[candidates] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
