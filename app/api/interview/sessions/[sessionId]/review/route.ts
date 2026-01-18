import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/interview/sessions/[sessionId]/review
 * Returns all ratings data for the PD review dashboard
 * Includes: session info, candidates, all ratings, and interviewer summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch session info
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 2. Fetch all candidates for this session
    const { data: candidates, error: candidatesError } = await supabase
      .from('interview_candidates')
      .select('*')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: true });

    if (candidatesError) {
      console.error('[review] Candidates error:', candidatesError);
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
    }

    // 3. Fetch all ratings for candidates in this session
    const candidateIds = (candidates || []).map(c => c.id);
    
    let ratings: unknown[] = [];
    if (candidateIds.length > 0) {
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('interview_ratings')
        .select('*')
        .in('candidate_id', candidateIds);

      if (ratingsError) {
        console.error('[review] Ratings error:', ratingsError);
        return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
      }
      ratings = ratingsData || [];
    }

    // 4. Fetch session interviewers
    const { data: interviewers, error: interviewersError } = await supabase
      .from('interview_session_interviewers')
      .select('*')
      .eq('session_id', sessionId)
      .order('role', { ascending: true });

    if (interviewersError) {
      console.error('[review] Interviewers error:', interviewersError);
    }

    // 5. Build interviewer summary from ratings
    const interviewerMap = new Map<string, {
      email: string;
      name: string;
      role: string;
      candidatesRated: number;
      avgEq: number;
      avgPq: number;
      avgIq: number;
      avgTotal: number;
    }>();

    // First, add known interviewers from session_interviewers table
    (interviewers || []).forEach(i => {
      interviewerMap.set(i.interviewer_email, {
        email: i.interviewer_email,
        name: i.interviewer_name || i.interviewer_email,
        role: i.role || 'interviewer',
        candidatesRated: 0,
        avgEq: 0,
        avgPq: 0,
        avgIq: 0,
        avgTotal: 0,
      });
    });

    // Then aggregate from ratings
    interface Rating {
      interviewer_email: string;
      interviewer_name?: string;
      eq_score?: number;
      pq_score?: number;
      iq_score?: number;
    }
    
    const ratingsByInterviewer = new Map<string, Rating[]>();
    (ratings as Rating[]).forEach(r => {
      const email = r.interviewer_email;
      if (!ratingsByInterviewer.has(email)) {
        ratingsByInterviewer.set(email, []);
      }
      ratingsByInterviewer.get(email)!.push(r);

      // Add to map if not already there
      if (!interviewerMap.has(email)) {
        interviewerMap.set(email, {
          email,
          name: r.interviewer_name || email,
          role: 'interviewer',
          candidatesRated: 0,
          avgEq: 0,
          avgPq: 0,
          avgIq: 0,
          avgTotal: 0,
        });
      }
    });

    // Calculate averages
    ratingsByInterviewer.forEach((interviewerRatings, email) => {
      const interviewer = interviewerMap.get(email)!;
      interviewer.candidatesRated = interviewerRatings.length;
      
      const validRatings = interviewerRatings.filter(r => 
        r.eq_score != null && r.pq_score != null && r.iq_score != null
      );
      
      if (validRatings.length > 0) {
        const sumEq = validRatings.reduce((sum, r) => sum + (r.eq_score || 0), 0);
        const sumPq = validRatings.reduce((sum, r) => sum + (r.pq_score || 0), 0);
        const sumIq = validRatings.reduce((sum, r) => sum + (r.iq_score || 0), 0);
        
        interviewer.avgEq = Math.round(sumEq / validRatings.length);
        interviewer.avgPq = Math.round(sumPq / validRatings.length);
        interviewer.avgIq = Math.round(sumIq / validRatings.length);
        interviewer.avgTotal = interviewer.avgEq + interviewer.avgPq + interviewer.avgIq;
      }
    });

    // 6. Build candidate data with ratings matrix
    interface CandidateRating {
      candidate_id: string;
      interviewer_email: string;
      interviewer_name?: string;
      eq_score?: number;
      pq_score?: number;
      iq_score?: number;
      notes?: string;
    }
    
    const candidatesWithRatings = (candidates || []).map(candidate => {
      const candidateRatings = (ratings as CandidateRating[]).filter(r => r.candidate_id === candidate.id);
      
      // Build ratings by interviewer
      const ratingsByInterviewerForCandidate: Record<string, {
        eq: number | null;
        pq: number | null;
        iq: number | null;
        total: number | null;
        notes: string | null;
        interviewerName: string;
      }> = {};
      
      candidateRatings.forEach(r => {
        const total = (r.eq_score != null && r.pq_score != null && r.iq_score != null)
          ? r.eq_score + r.pq_score + r.iq_score
          : null;
          
        ratingsByInterviewerForCandidate[r.interviewer_email] = {
          eq: r.eq_score ?? null,
          pq: r.pq_score ?? null,
          iq: r.iq_score ?? null,
          total,
          notes: r.notes ?? null,
          interviewerName: r.interviewer_name || r.interviewer_email,
        };
      });

      return {
        ...candidate,
        ratings: ratingsByInterviewerForCandidate,
        ratingCount: candidateRatings.length,
      };
    });

    // Sort interviewers: PD first, then coordinators, then interviewers
    const roleOrder = { program_director: 0, coordinator: 1, interviewer: 2 };
    const sortedInterviewers = Array.from(interviewerMap.values()).sort((a, b) => {
      const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 2;
      const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 2;
      return aOrder - bOrder;
    });

    return NextResponse.json({
      session,
      candidates: candidatesWithRatings,
      interviewers: sortedInterviewers,
      summary: {
        totalCandidates: candidates?.length || 0,
        totalRatings: ratings.length,
        totalInterviewers: interviewerMap.size,
      },
    });
  } catch (error) {
    console.error('[review] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
