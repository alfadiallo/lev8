import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/interview/sessions/list
 * Returns all interview sessions with candidate and rating counts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorEmail = searchParams.get('creator_email');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all sessions
    let sessionsQuery = supabase
      .from('interview_sessions')
      .select('*')
      .eq('session_type', 'group')
      .order('session_date', { ascending: false });

    if (creatorEmail) {
      sessionsQuery = sessionsQuery.eq('creator_email', creatorEmail);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      console.error('[sessions/list] Sessions error:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ sessions: [] });
    }

    const sessionIds = sessions.map(s => s.id);

    // Get candidate counts per session
    const { data: candidates, error: candidatesError } = await supabase
      .from('interview_candidates')
      .select('session_id')
      .in('session_id', sessionIds);

    if (candidatesError) {
      console.error('[sessions/list] Candidates error:', candidatesError);
    }

    // Get rating counts per session (via candidates)
    const _candidateIds = candidates?.map(c => c.session_id) || [];
    
    const { data: candidatesWithIds, error: candidateIdsError } = await supabase
      .from('interview_candidates')
      .select('id, session_id')
      .in('session_id', sessionIds);

    const ratingCounts: Record<string, number> = {};
    
    if (!candidateIdsError && candidatesWithIds && candidatesWithIds.length > 0) {
      const allCandidateIds = candidatesWithIds.map(c => c.id);
      
      const { data: ratings, error: ratingsError } = await supabase
        .from('interview_ratings')
        .select('candidate_id')
        .in('candidate_id', allCandidateIds);

      if (!ratingsError && ratings) {
        // Map candidate_id to session_id
        const candidateToSession = new Map(
          candidatesWithIds.map(c => [c.id, c.session_id])
        );
        
        ratings.forEach(r => {
          const sessionId = candidateToSession.get(r.candidate_id);
          if (sessionId) {
            ratingCounts[sessionId] = (ratingCounts[sessionId] || 0) + 1;
          }
        });
      }
    }

    // Count candidates per session
    const candidateCounts: Record<string, number> = {};
    candidates?.forEach(c => {
      candidateCounts[c.session_id] = (candidateCounts[c.session_id] || 0) + 1;
    });

    // Get interviewers per session (from interview_session_interviewers)
    const { data: allInterviewers, error: interviewersError } = await supabase
      .from('interview_session_interviewers')
      .select('session_id, interviewer_name')
      .in('session_id', sessionIds);

    const interviewersBySession: Record<string, string[]> = {};
    
    if (!interviewersError && allInterviewers) {
      allInterviewers.forEach(int => {
        if (!interviewersBySession[int.session_id]) {
          interviewersBySession[int.session_id] = [];
        }
        
        // Extract last name: "Dr. Donald Anspaugh" -> "Anspaugh"
        const nameParts = int.interviewer_name.split(' ');
        const lastName = nameParts[nameParts.length - 1];
        
        // Avoid duplicates in the list
        if (!interviewersBySession[int.session_id].includes(lastName)) {
          interviewersBySession[int.session_id].push(lastName);
        }
      });
    }

    // Build response
    const sessionsWithCounts = sessions.map(session => ({
      id: session.id,
      session_name: session.session_name,
      session_date: session.session_date,
      status: session.status,
      candidate_count: candidateCounts[session.id] || 0,
      rating_count: ratingCounts[session.id] || 0,
      interviewers: interviewersBySession[session.id] || [],
    }));

    return NextResponse.json({ sessions: sessionsWithCounts });
  } catch (error) {
    console.error('[sessions/list] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
